"""Server-side code generation — non-streaming provider call with JSON schema.

Mirrors the logic previously in frontend/app/api/generate/route.ts.
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from typing import Any

import httpx

from app.agent.registries.prompts import (
    ARDUINO_GENERATION_SCHEMA,
    DERIVE_WIRING_SCHEMA,
    OPTIMIZE_CODE_SCHEMA,
    RPI_GENERATION_SCHEMA,
    VERIFY_SCHEMA,
    arduino_generation_prompt,
    build_file_context,
    derive_rpi_wiring_prompt,
    derive_wiring_prompt,
    optimize_code_prompt,
    rpi_generation_prompt,
    verify_arduino_prompt,
    verify_python_prompt,
)

log = logging.getLogger(__name__)

REQUEST_TIMEOUT = 60.0
MAX_RETRIES = 2

GenerateAction = str  # GENERATE_ARDUINO | GENERATE_RPI | VERIFY_ARDUINO | VERIFY_PYTHON | DERIVE_WIRING | OPTIMIZE_CODE


def _env_gemini_key() -> str:
    key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("NEXT_PUBLIC_GEMINI_API_KEY") or "").strip()
    if not key:
        raise ValueError("GEMINI_API_KEY not set")
    return key


def _env_groq_key() -> str | None:
    return (os.environ.get("GROQ_API_KEY") or "").strip() or None


# ── Provider callers (non-streaming) ─────────────────────────────────────────

async def _call_gemini(
    api_key: str,
    model: str,
    system: str,
    prompt: str,
    response_schema: dict | None,
    base_url: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 8192,
) -> dict:
    base = (base_url or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
    url = f"{base}/models/{model}:generateContent?key={api_key}"
    body: dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system}]},
        "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
    }
    if response_schema:
        body["generationConfig"]["responseMimeType"] = "application/json"
        body["generationConfig"]["responseSchema"] = response_schema

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
    data = resp.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not text:
        raise ValueError("Empty response from Gemini")
    usage = data.get("usageMetadata") or {}
    return {
        "text": text,
        "prompt_tokens": usage.get("promptTokenCount", 0),
        "completion_tokens": usage.get("candidatesTokenCount", 0),
        "total_tokens": usage.get("totalTokenCount", 0),
    }


async def _call_openai_compatible(
    api_key: str,
    model: str,
    system: str,
    prompt: str,
    response_schema: dict | None,
    base_url: str,
    temperature: float = 0.2,
    max_tokens: int = 8192,
) -> dict:
    url = f"{base_url.rstrip('/')}/chat/completions"
    messages = [{"role": "system", "content": system}, {"role": "user", "content": prompt}]
    if response_schema:
        messages[0]["content"] += f"\n\nIMPORTANT: Respond with valid JSON matching:\n{json.dumps(response_schema, indent=2)}"
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_schema:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )
        resp.raise_for_status()
    data = resp.json()
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    if not text:
        raise ValueError("Empty response from OpenAI-compatible API")
    usage = data.get("usage") or {}
    return {
        "text": text,
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
    }


async def _call_anthropic(
    api_key: str,
    model: str,
    system: str,
    prompt: str,
    response_schema: dict | None,
    temperature: float = 0.2,
    max_tokens: int = 8192,
) -> dict:
    sys_text = system
    if response_schema:
        sys_text += f"\n\nIMPORTANT: Respond with valid JSON matching:\n{json.dumps(response_schema, indent=2)}"
    body = {
        "model": model,
        "system": sys_text,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            json=body,
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
        )
        resp.raise_for_status()
    data = resp.json()
    text = (data.get("content") or [{}])[0].get("text", "")
    if not text:
        raise ValueError("Empty response from Anthropic")
    usage = data.get("usage") or {}
    return {
        "text": text,
        "prompt_tokens": usage.get("input_tokens", 0),
        "completion_tokens": usage.get("output_tokens", 0),
        "total_tokens": (usage.get("input_tokens", 0) + usage.get("output_tokens", 0)),
    }


# ── Regex wiring fallback (mirrors basicRegexWiring in route.ts) ──────────────

def _basic_regex_wiring(files: list[dict]) -> dict:
    code = "\n".join(f.get("content", "") for f in files)
    components = []
    counter = [1]

    def _id(prefix: str) -> str:
        val = f"{prefix}_{counter[0]}"
        counter[0] += 1
        return val

    def _find_pin(pattern: str) -> str:
        m = re.search(pattern, code)
        return m.group(1) if m else "2"

    if "Servo.h" in code:
        pin = _find_pin(r'\.attach\s*\(\s*(\d+)\s*\)')
        components.append({"id": _id("servo"), "type": "SERVO", "pin": pin or "9", "label": "Servo"})
    if "WiFi" in code or "ESP8266" in code:
        components.append({"id": _id("wifi"), "type": "MODULE_WIFI", "pin": "RX/TX", "label": "WiFi Module"})
    if "Adafruit_NeoPixel" in code or "FastLED" in code:
        pin = _find_pin(r'PIN\s+(\d+)|(\d+)\s*,\s*NUM_LEDS')
        components.append({"id": _id("neo"), "type": "NEOPIXEL", "pin": pin or "6", "label": "NeoPixel Strip"})
    if "DHT.h" in code or "DHT11" in code or "DHT22" in code:
        components.append({"id": _id("dht"), "type": "SENSOR_DHT", "pin": "2", "label": "DHT Sensor"})
    if "Stepper.h" in code:
        pin = _find_pin(r'Stepper\s+\w+\s*\(\s*\w+\s*,\s*(\d+)')
        components.append({"id": _id("step"), "type": "STEPPER", "pin": pin or "8", "label": "Stepper Motor"})

    # Generic pinMode() scan
    for m in re.finditer(r'pinMode\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)', code):
        pin_name, mode = m.group(1), m.group(2)
        pin_val = pin_name
        define_m = re.search(rf'#define\s+{re.escape(pin_name)}\s+(\w+)', code)
        if define_m:
            pin_val = define_m.group(1)
        if pin_name == "LED_BUILTIN":
            pin_val = "13"
        if any(str(c["pin"]) == str(pin_val) for c in components):
            continue
        name_lower = pin_name.lower()
        if mode == "OUTPUT":
            if "led" in name_lower:
                comp_type, label = "LED", "LED"
            elif "relay" in name_lower:
                comp_type, label = "RELAY", "Relay"
            elif "buzzer" in name_lower:
                comp_type, label = "BUZZER", "Buzzer"
            else:
                comp_type, label = "GENERIC", "Output Module"
        else:
            if "echo" in name_lower:
                continue
            if "btn" in name_lower or "button" in name_lower:
                comp_type, label = "BUTTON", "Button"
            else:
                comp_type, label = "GENERIC", "Input Sensor"
        components.append({"id": _id("io"), "type": comp_type, "pin": pin_val, "label": label})

    if not components:
        components.append({"id": "def_led", "type": "LED", "pin": "13", "label": "Built-in LED"})

    return {"board": "Arduino Uno", "components": components}


# ── Main generate function ────────────────────────────────────────────────────

async def run_generate(
    action: GenerateAction,
    files: list[dict],
    prompt: str = "",
    device_mode: str = "arduino",
    model_config: dict | None = None,
) -> dict:
    """Run a structured generation action and return parsed JSON + usage info."""
    mc = model_config or {}
    api_key = (mc.get("apiKey") or "").strip()
    has_custom = len(api_key) > 10
    provider = mc.get("provider", "gemini")
    model = mc.get("model", "")
    base_url = mc.get("baseUrl")
    temperature = float(mc.get("temperature") or 0.2)
    max_tokens = int(mc.get("maxTokens") or 8192)

    file_ctx = build_file_context(files)

    # Select system prompt + schema from action
    if action == "GENERATE_ARDUINO":
        system = arduino_generation_prompt(file_ctx, prompt)
        schema = ARDUINO_GENERATION_SCHEMA
        user_prompt = "Generate the Arduino project as specified."
    elif action == "GENERATE_RPI":
        system = rpi_generation_prompt(file_ctx, prompt)
        schema = RPI_GENERATION_SCHEMA
        user_prompt = "Generate the Raspberry Pi project as specified."
    elif action == "VERIFY_ARDUINO":
        code_files = [f for f in files if f.get("type") == "code" or f.get("name", "").endswith(".ino")]
        system = verify_arduino_prompt(build_file_context(code_files))
        schema = VERIFY_SCHEMA
        user_prompt = "Analyze the above Arduino code for errors and issues."
    elif action == "VERIFY_PYTHON":
        py_files = [f for f in files if f.get("name", "").endswith(".py")]
        system = verify_python_prompt(build_file_context(py_files))
        schema = VERIFY_SCHEMA
        user_prompt = "Analyze the above Python code for errors, security issues, and best practice violations."
    elif action == "DERIVE_WIRING":
        if device_mode == "raspberry-pi":
            py_files = [f for f in files if f.get("name", "").endswith(".py")]
            system = derive_rpi_wiring_prompt(build_file_context(py_files))
        else:
            code_files = [f for f in files if f.get("type") == "code" or f.get("name", "").endswith(".ino")]
            system = derive_wiring_prompt(build_file_context(code_files))
        schema = DERIVE_WIRING_SCHEMA
        user_prompt = "Extract all hardware components and their wiring from the above code."
    elif action == "OPTIMIZE_CODE":
        system = optimize_code_prompt(file_ctx)
        schema = OPTIMIZE_CODE_SCHEMA
        user_prompt = "Review and optimize the above project code."
    else:
        raise ValueError(f"Unknown generate action: {action}")

    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            if has_custom:
                if provider == "gemini":
                    gemini_model = model or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
                    result = await _call_gemini(api_key, gemini_model, system, user_prompt, schema, base_url, temperature, max_tokens)
                elif provider == "anthropic":
                    result = await _call_anthropic(api_key, model, system, user_prompt, schema, temperature, max_tokens)
                else:
                    openai_url = base_url or ("https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1")
                    result = await _call_openai_compatible(api_key, model, system, user_prompt, schema, openai_url, temperature, max_tokens)
            else:
                gemini_key = _env_gemini_key()
                gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
                result = await _call_gemini(gemini_key, gemini_model, system, user_prompt, schema)

            # Parse JSON response
            text = result["text"]
            # Strip markdown code fences if present
            text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
            text = re.sub(r'```\s*$', '', text.strip(), flags=re.MULTILINE)
            parsed = json.loads(text.strip())
            return {
                "data": parsed,
                "provider": provider if has_custom else "gemini",
                "model": model or gemini_model if has_custom else gemini_model,
                "prompt_tokens": result.get("prompt_tokens", 0),
                "completion_tokens": result.get("completion_tokens", 0),
                "total_tokens": result.get("total_tokens", 0),
            }

        except Exception as exc:
            last_error = exc
            log.warning("generate attempt %d/%d failed: %s", attempt + 1, MAX_RETRIES + 1, exc)

            if attempt == MAX_RETRIES:
                # Try Groq fallback
                groq_key = _env_groq_key()
                if groq_key and not has_custom:
                    try:
                        groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
                        result = await _call_openai_compatible(groq_key, groq_model, system, user_prompt, schema, "https://api.groq.com/openai/v1")
                        text = result["text"]
                        text = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.MULTILINE)
                        text = re.sub(r'```\s*$', '', text.strip(), flags=re.MULTILINE)
                        parsed = json.loads(text.strip())
                        return {
                            "data": parsed,
                            "provider": "groq",
                            "model": groq_model,
                            "prompt_tokens": result.get("prompt_tokens", 0),
                            "completion_tokens": result.get("completion_tokens", 0),
                            "total_tokens": result.get("total_tokens", 0),
                        }
                    except Exception as groq_exc:
                        log.warning("Groq fallback failed: %s", groq_exc)

                # Regex fallback for DERIVE_WIRING only
                if action == "DERIVE_WIRING" and device_mode != "raspberry-pi":
                    fallback = _basic_regex_wiring(files)
                    return {"data": fallback, "provider": "fallback_regex", "model": None,
                            "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

                raise RuntimeError(f"All providers failed for {action}: {last_error}") from last_error

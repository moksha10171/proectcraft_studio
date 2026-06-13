"""Device-mode tool routing — port of frontend/lib/agent/device-tools.ts."""

from __future__ import annotations

from typing import Literal

DeviceMode = Literal["arduino", "raspberry-pi"]

# Tools excluded from each mode
_EXCLUDE_FROM_RPI = {"GENERATE_ARDUINO", "VERIFY_ARDUINO"}
_EXCLUDE_FROM_ARDUINO = {"GENERATE_RPI", "VERIFY_PYTHON"}

# All tool names in registry order
_ALL_TOOLS = [
    "GENERATE_ARDUINO",
    "GENERATE_RPI",
    "VERIFY_ARDUINO",
    "VERIFY_PYTHON",
    "DERIVE_WIRING",
    "OPTIMIZE_CODE",
    "APPLY_CHANGES",
    "SEND_MESSAGE",
    "WEB_SEARCH",
    "FETCH_PROMPTS",
    "READ_FILE",
    "LIST_FILES",
    "WRITE_FILE",
]


def resolve_tool_for_device(tool: str, device_mode: DeviceMode) -> str:
    """Return the effective tool name for this device mode.

    If GENERATE_ARDUINO is called in RPi mode → GENERATE_RPI (and vice versa).
    If VERIFY_ARDUINO is called in RPi mode → VERIFY_PYTHON (and vice versa).
    """
    if device_mode == "raspberry-pi":
        if tool == "GENERATE_ARDUINO":
            return "GENERATE_RPI"
        if tool == "VERIFY_ARDUINO":
            return "VERIFY_PYTHON"
    else:
        if tool == "GENERATE_RPI":
            return "GENERATE_ARDUINO"
        if tool == "VERIFY_PYTHON":
            return "VERIFY_ARDUINO"
    return tool


def get_tools_for_device_mode(device_mode: DeviceMode) -> list[str]:
    """Return the tool names available for the given device mode."""
    exclude = _EXCLUDE_FROM_RPI if device_mode == "raspberry-pi" else _EXCLUDE_FROM_ARDUINO
    return [t for t in _ALL_TOOLS if t not in exclude]


def default_generate_tool(device_mode: DeviceMode) -> str:
    return "GENERATE_RPI" if device_mode == "raspberry-pi" else "GENERATE_ARDUINO"


def default_verify_tool(device_mode: DeviceMode) -> str:
    return "VERIFY_PYTHON" if device_mode == "raspberry-pi" else "VERIFY_ARDUINO"


def build_device_system_suffix(device_mode: DeviceMode) -> str:
    if device_mode == "raspberry-pi":
        return (
            "\n\n## Mode: Raspberry Pi\n"
            "You are working in Raspberry Pi mode. Generate Python 3 code using RPi.GPIO or gpiozero. "
            "Use BCM pin numbering. Produce wiring manifests with Raspberry Pi board types. "
            "Use GENERATE_RPI for code generation and VERIFY_PYTHON for verification."
        )
    return (
        "\n\n## Mode: Arduino\n"
        "You are working in Arduino mode. Generate Arduino C++ sketches. "
        "Use pin numbers valid for Arduino Uno/Nano/Mega/ESP32. "
        "Use GENERATE_ARDUINO for code generation and VERIFY_ARDUINO for verification."
    )

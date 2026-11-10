# Purpose and related projects

ProjectCraft focuses on one workflow: learn an embedded project, edit its code,
check it, understand its wiring and use an optional AI assistant. Students can
inspect every layer; educators can self-host the same workbench; makers can use
their own models and keep local workspace storage.

## Existing tools

These are references to learn from, not dependencies or claims of feature parity:

| Tool | Established focus | ProjectCraft's current relationship |
| --- | --- | --- |
| [Arduino CLI](https://docs.arduino.cc/arduino-cli/) | Board cores, libraries and real firmware compilation | Invoked locally by the backend for AVR compilation |
| [Wokwi](https://docs.wokwi.com/) | Electronics simulation with supported microcontrollers and components | Useful external simulator; ProjectCraft's animations are illustrative |
| [AVR8js](https://github.com/wokwi/avr8js) | Open-source AVR CPU emulation in JavaScript | Potential future integration, not installed or used today |
| [PlatformIO](https://docs.platformio.org/en/latest/what-is-platformio.html) | Cross-platform embedded builds, debugging and testing | External workflow for broader boards and production hardware validation |

An open-source educational studio is useful when its setup is reproducible,
outputs are inspectable and limitations are explicit. It does not need to replace
every professional embedded tool.

## Supported boundaries

- Arduino mode currently compiles AVR Uno, classic Nano and Mega. Raspberry Pi
  mode checks Linux Python syntax. ESP32 and other IoT boards have reference
  material; their builds and flashing remain external.
- Diagrams show components and pin relationships. Animation is not generated
  firmware execution, electrical analysis or proof that a physical circuit works.
- Cloud AI is optional and may incur provider charges. Local compatible model
  servers need sufficient hardware and model-specific testing.
- Project catalog entries must link to actual source examples. Do not invent
  ratings, usage counts, community adoption, hardware test results or benchmark data.

## Contribution priorities

Fix correctness in the existing editor → compiler → wiring → AI path first.
Future board support must include a real toolchain configuration, reproducible
checks and a documented pin model. CPU emulation should be a separately reviewed
integration with upstream licensing attribution and observable test outputs.
Generic web development catalogs, billing and unrelated tool collections are
outside the core product direction.

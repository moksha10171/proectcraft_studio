# Hardware examples

These small source examples ship with the repository and are available from the
project catalog. They have no invented ratings, views or download counts.

- **Arduino LED blink:** Uno, classic Nano or Mega built-in LED. Open `sketch.ino`
  in Studio, then Compile. Install the `arduino:avr` core first.
- **Raspberry Pi LED blink:** Linux Raspberry Pi using gpiozero. Wire physical pin
  11 (BCM GPIO17) through a 330 Ω resistor to the LED anode, then cathode to GND
  (physical pin 6). Install `python3-gpiozero` on the Pi. Check Syntax in Studio;
  run `python3 main.py` on the physical Pi. Ctrl+C stops it and closes the GPIO.

The Python example is not for Raspberry Pi Pico/MicroPython. Compilation or
syntax checks do not verify physical wiring or GPIO library availability.

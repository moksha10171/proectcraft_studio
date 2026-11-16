# Hardware examples

These small source examples ship with the repository and are available from the
project catalog. They have no invented ratings, views or download counts.

- **Arduino LED blink:** Uno, classic Nano or Mega built-in LED. Open `sketch.ino`
  in Studio, then Compile. Install the `arduino:avr` core first.
- **Arduino button input:** Uno. Connect a push button between D2 and GND; the sketch
  uses `INPUT_PULLUP`, so D2 is LOW while the button is pressed. The built-in LED
  follows the button and the state is printed over serial.
- **Arduino potentiometer dimmer:** Uno, Nano or Mega. Wire a 10 kΩ potentiometer with
  one end to GND, the other end to 5V and the wiper to A0. Connect D9 through a
  330 Ω resistor to the LED anode and the cathode to GND. D9 is a PWM pin, so
  `analogWrite` dims the LED; in Studio's emulator it runs at about 490 Hz and the
  Signals tab measures its duty cycle against the slider position.
- **Raspberry Pi LED blink:** Linux Raspberry Pi using gpiozero. Wire physical pin
  11 (BCM GPIO17) through a 330 Ω resistor to the LED anode, then cathode to GND
  (physical pin 6). Install `python3-gpiozero` on the Pi. Check Syntax in Studio;
  run `python3 main.py` on the physical Pi. Ctrl+C stops it and closes the GPIO.

The Python example is not for Raspberry Pi Pico/MicroPython. Compilation or
syntax checks do not verify physical wiring or GPIO library availability.

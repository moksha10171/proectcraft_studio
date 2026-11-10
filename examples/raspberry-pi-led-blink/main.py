"""Linux Raspberry Pi: BCM GPIO17 -> 330 ohm resistor -> LED -> GND.

Install gpiozero on the Pi. Do not connect a GPIO pin directly to an LED.
This script controls physical hardware; Studio checks syntax without running it.
"""
from signal import pause
from gpiozero import LED


def main():
    with LED(17) as led:
        led.blink(on_time=1, off_time=1)
        pause()


if __name__ == "__main__":
    main()

// Analog dimmer: a potentiometer on A0 sets the brightness of an LED on D9.
// D9 is a PWM pin, so analogWrite() switches it on and off hundreds of times per second.
const int POT_PIN = A0;
const int LED_PIN = 9;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(POT_PIN);         // 0..1023 for 0..5 V
  int duty = map(raw, 0, 1023, 0, 255);  // analogWrite takes 0..255
  analogWrite(LED_PIN, duty);
  Serial.print("raw=");
  Serial.print(raw);
  Serial.print(" duty=");
  Serial.println(duty);
  delay(250);
}

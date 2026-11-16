void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  const bool pressed = digitalRead(2) == LOW;
  digitalWrite(LED_BUILTIN, pressed);
  Serial.println(pressed ? "Pressed" : "Released");
  delay(100);
}

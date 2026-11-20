/**
 * Python source installed into Pyodide before a Raspberry Pi script runs. It provides RPi.GPIO and a
 * subset of gpiozero on a virtual clock: time.sleep() advances simulated time instantly, so every run
 * is deterministic, and the script's pin activity is recorded as a trace. Nothing here talks to hardware.
 *
 * Modelled: GPIO modes, outputs, inputs with pull-ups, software PWM, edge callbacks, LED/PWMLED/Buzzer/
 * Button, print() output. Not modelled: threads, I2C/SPI/UART, other libraries' hardware access.
 */
export const PI_SHIM = String.raw`
import sys, types, json, heapq, traceback, math, builtins

class _TimeLimit(BaseException):
    pass

_BOARD_TO_BCM = {3: 2, 5: 3, 7: 4, 8: 14, 10: 15, 11: 17, 12: 18, 13: 27, 15: 22, 16: 23, 18: 24, 19: 10, 21: 9,
                 22: 25, 23: 11, 24: 8, 26: 7, 29: 5, 31: 6, 32: 12, 33: 13, 35: 19, 36: 16, 37: 26, 38: 20, 40: 21}
_VALID_BCM = set(range(2, 28))
_EDGE_BUDGET = 8000

class _Sim:
    def __init__(self, limit_us, inputs):
        self.now = 0
        self.limit = limit_us
        self.events = []
        self.heap = []
        self.seq = 0
        self.mode = {}        # bcm -> 'in' | 'out'
        self.level = {}       # bcm -> last driven output level
        self.pull = {}        # bcm -> 'up' | 'down' | None
        self.ext = {}         # bcm -> False while an external part drives the pin low
        self.pwm = {}         # bcm -> [freq, duty, started_us]
        self.emitted = {}     # bcm -> last level written to the trace
        self.watch = {}       # bcm -> [(edge, fn)]
        self.edge_budget = _EDGE_BUDGET
        self.truncated = False
        self.numbering = None
        for item in inputs:
            self.at(item[0], (lambda pin, high: lambda: self.drive(pin, high))(item[1], item[2]))

    # ---- scheduler -------------------------------------------------------
    def at(self, t, fn):
        self.seq += 1
        heapq.heappush(self.heap, (t, self.seq, fn))

    def advance(self, t):
        if t > self.limit:
            self._pwm_edges(self.now, self.limit)
            self.now = self.limit
            raise _TimeLimit()
        if t > self.now:
            self._pwm_edges(self.now, t)
            self.now = t

    def sleep(self, seconds):
        if seconds < 0:
            raise ValueError('sleep length must be non-negative')
        target = self.now + int(round(seconds * 1e6))
        while self.heap and self.heap[0][0] <= target:
            t, _, fn = heapq.heappop(self.heap)
            self.advance(max(t, self.now))
            fn()
        self.advance(target)

    def wait_until(self, condition, timeout_s=None):
        deadline = None if timeout_s is None else self.now + int(timeout_s * 1e6)
        while not condition():
            nxt = self.heap[0][0] if self.heap else None
            if deadline is not None and (nxt is None or nxt > deadline):
                self.advance(deadline)
                return False
            if nxt is None:
                self.advance(self.limit + 1)
            t, _, fn = heapq.heappop(self.heap)
            self.advance(max(t, self.now))
            fn()
        return True

    # ---- trace -----------------------------------------------------------
    def emit_pin(self, pin, value):
        value = 1 if value else 0
        if self.emitted.get(pin) != value:
            self.emitted[pin] = value
            self.events.append(['p', self.now, 'GPIO%d' % pin, value])

    def text(self, chunk):
        if chunk:
            self.events.append(['s', self.now, chunk])

    def _pwm_edges(self, t0, t1):
        for pin, (freq, duty, started) in list(self.pwm.items()):
            if duty <= 0 or duty >= 100 or freq <= 0:
                continue
            period = 1e6 / freq
            high = period * duty / 100.0
            k = max(0, int(math.floor((t0 - started) / period)))
            while True:
                rise = started + k * period
                if rise > t1:
                    break
                for when, value in ((rise, 1), (rise + high, 0)):
                    if t0 < when <= t1:
                        if self.edge_budget <= 0:
                            self.truncated = True
                            return
                        self.edge_budget -= 1
                        self.emitted[pin] = value
                        self.events.append(['p', int(round(when)), 'GPIO%d' % pin, value])
                k += 1

    def set_duty(self, pin, duty):
        self.events.append(['d', self.now, 'GPIO%d' % pin, duty])

    # ---- pins ------------------------------------------------------------
    def channel(self, ch):
        if self.numbering is None:
            raise RuntimeError('Please set pin numbering mode using GPIO.setmode(GPIO.BOARD) or GPIO.setmode(GPIO.BCM)')
        if self.numbering == 'BOARD':
            if ch not in _BOARD_TO_BCM:
                raise ValueError('The channel sent is invalid on a Raspberry Pi')
            return _BOARD_TO_BCM[ch]
        if ch not in _VALID_BCM:
            raise ValueError('The channel sent is invalid on a Raspberry Pi')
        return ch

    def read(self, pin):
        if self.mode.get(pin) == 'out':
            return self.level.get(pin, 0)
        if self.ext.get(pin) is False:
            return 0
        return 1 if self.pull.get(pin) == 'up' else 0

    def drive(self, pin, high):
        """An external part (a push button to ground) changes what the pin sees."""
        before = self.read(pin)
        if high:
            self.ext.pop(pin, None)
        else:
            self.ext[pin] = False
        after = self.read(pin)
        if self.mode.get(pin) == 'in' and after != before:
            self.emit_pin(pin, after)
            for edge, fn in list(self.watch.get(pin, [])):
                if edge == 'both' or (edge == 'rising' and after) or (edge == 'falling' and not after):
                    fn()
        elif self.mode.get(pin) is None:
            pass

    def setup_in(self, pin, pull):
        self.mode[pin] = 'in'
        self.pull[pin] = pull
        self.pwm.pop(pin, None)
        self.emit_pin(pin, self.read(pin))

    def setup_out(self, pin, initial=0):
        self.mode[pin] = 'out'
        self.level[pin] = 1 if initial else 0
        self.emit_pin(pin, self.level[pin])

    def write(self, pin, value):
        if self.mode.get(pin) != 'out':
            raise RuntimeError('The GPIO channel has not been set up as an OUTPUT')
        self.level[pin] = 1 if value else 0
        self.emit_pin(pin, self.level[pin])

_sim = None
def _s():
    return _sim

# ---- RPi.GPIO ---------------------------------------------------------------
_gpio = types.ModuleType('RPi.GPIO')
for _name, _value in dict(BCM=11, BOARD=10, OUT=0, IN=1, HIGH=1, LOW=0, PUD_OFF=20, PUD_DOWN=21, PUD_UP=22,
                          RISING=31, FALLING=32, BOTH=33, VERSION='0.7.1 (ProjectCraft simulation)', RPI_INFO={'TYPE': 'simulated'}).items():
    setattr(_gpio, _name, _value)

def _as_list(ch):
    return list(ch) if isinstance(ch, (list, tuple)) else [ch]

def _setmode(mode):
    if mode not in (10, 11):
        raise ValueError('An invalid mode was passed to setmode()')
    _s().numbering = 'BOARD' if mode == 10 else 'BCM'
def _getmode():
    return {None: None, 'BOARD': 10, 'BCM': 11}[_s().numbering]
def _setup(channel, direction, pull_up_down=20, initial=None):
    sim = _s()
    for ch in _as_list(channel):
        pin = sim.channel(ch)
        if direction == 0:
            sim.setup_out(pin, initial or 0)
        elif direction == 1:
            sim.setup_in(pin, {22: 'up', 21: 'down'}.get(pull_up_down))
        else:
            raise ValueError('An invalid direction was passed to setup()')
def _output(channel, value):
    sim = _s()
    chans = _as_list(channel)
    values = _as_list(value) if isinstance(value, (list, tuple)) else [value] * len(chans)
    for ch, val in zip(chans, values):
        sim.write(sim.channel(ch), val)
def _input(channel):
    sim = _s()
    pin = sim.channel(channel)
    if pin not in sim.mode:
        raise RuntimeError('You must setup() the GPIO channel first')
    return sim.read(pin)
def _cleanup(channel=None):
    sim = _s()
    pins = [sim.channel(c) for c in _as_list(channel)] if channel is not None else list(sim.mode)
    for pin in pins:
        sim.pwm.pop(pin, None)
        sim.set_duty(pin, None)
        sim.mode.pop(pin, None)
        sim.watch.pop(pin, None)
        sim.level.pop(pin, None)
        sim.pull.pop(pin, None)
        sim.emitted.pop(pin, None)
def _add_event_detect(channel, edge, callback=None, bouncetime=None):
    sim = _s()
    pin = sim.channel(channel)
    if sim.mode.get(pin) != 'in':
        raise RuntimeError('You must setup() the GPIO channel as an input first')
    name = {31: 'rising', 32: 'falling', 33: 'both'}.get(edge)
    if name is None:
        raise ValueError('The edge must be set to RISING, FALLING or BOTH')
    if callback is not None:
        sim.watch.setdefault(pin, []).append((name, (lambda c, p: lambda: c(c_ch(p)))(callback, pin)))
def c_ch(pin):
    sim = _s()
    if sim.numbering == 'BOARD':
        for board, bcm in _BOARD_TO_BCM.items():
            if bcm == pin:
                return board
    return pin
def _remove_event_detect(channel):
    sim = _s()
    sim.watch.pop(sim.channel(channel), None)
def _wait_for_edge(channel, edge, bouncetime=None, timeout=None):
    sim = _s()
    pin = sim.channel(channel)
    seen = []
    name = {31: 'rising', 32: 'falling', 33: 'both'}[edge]
    entry = (name, lambda: seen.append(1))
    sim.watch.setdefault(pin, []).append(entry)
    try:
        ok = sim.wait_until(lambda: bool(seen), None if timeout is None else timeout / 1000.0)
    finally:
        sim.watch[pin].remove(entry)
    return channel if ok else None

class _PWM:
    def __init__(self, channel, frequency, bcm=None):
        sim = _s()
        self.pin = bcm if bcm is not None else sim.channel(channel)
        if sim.mode.get(self.pin) != 'out':
            raise RuntimeError('You must setup() the GPIO channel as an output first')
        if frequency <= 0:
            raise ValueError('frequency must be greater than 0.0')
        self.freq = float(frequency)
        self.duty = 0.0
        self.running = False
    def _apply(self):
        sim = _s()
        if self.running:
            sim.pwm[self.pin] = [self.freq, self.duty, sim.now]
            sim.set_duty(self.pin, self.duty)
            sim.level[self.pin] = 1 if self.duty >= 100 else 0
            if self.duty >= 100:
                sim.emit_pin(self.pin, 1)
            elif self.duty <= 0:
                sim.emit_pin(self.pin, 0)
            else:
                sim.emit_pin(self.pin, 1)
    def start(self, duty_cycle):
        if not 0.0 <= duty_cycle <= 100.0:
            raise ValueError('dutycycle must have a value from 0.0 to 100.0')
        self.duty = float(duty_cycle)
        self.running = True
        self._apply()
    def ChangeDutyCycle(self, duty_cycle):
        if not 0.0 <= duty_cycle <= 100.0:
            raise ValueError('dutycycle must have a value from 0.0 to 100.0')
        self.duty = float(duty_cycle)
        self._apply()
    def ChangeFrequency(self, frequency):
        if frequency <= 0:
            raise ValueError('frequency must be greater than 0.0')
        self.freq = float(frequency)
        self._apply()
    def stop(self):
        sim = _s()
        self.running = False
        sim.pwm.pop(self.pin, None)
        sim.set_duty(self.pin, None)
        sim.emit_pin(self.pin, 0)
        sim.level[self.pin] = 0

_gpio.setmode = _setmode; _gpio.getmode = _getmode; _gpio.setwarnings = lambda flag: None
_gpio.setup = _setup; _gpio.output = _output; _gpio.input = _input; _gpio.cleanup = _cleanup
_gpio.add_event_detect = _add_event_detect; _gpio.remove_event_detect = _remove_event_detect
_gpio.wait_for_edge = _wait_for_edge; _gpio.PWM = _PWM
_rpi = types.ModuleType('RPi'); _rpi.__path__ = []; _rpi.GPIO = _gpio

# ---- gpiozero (subset) --------------------------------------------------------
def _bcm(pin):
    if isinstance(pin, str):
        digits = ''.join(c for c in pin if c.isdigit())
        if not digits:
            raise ValueError('Unsupported pin %r' % (pin,))
        pin = int(digits)
    if pin not in _VALID_BCM:
        raise ValueError('GPIO%s is not a usable pin on this simulated Raspberry Pi (use 2-27, BCM numbering)' % (pin,))
    return pin

class _Blinker:
    """Background on/off cycling shared by LED and Buzzer."""
    def __init__(self, device):
        self.device = device
        self.token = 0
    def start(self, on_time, off_time, n, background, on, off):
        sim = _s()
        self.token += 1
        token = self.token
        remaining = [n]
        def step(state):
            if token != self.token:
                return
            if state:
                on()
                sim.at(sim.now + int(on_time * 1e6), lambda: step(False))
            else:
                off()
                if remaining[0] is not None:
                    remaining[0] -= 1
                    if remaining[0] <= 0:
                        return
                sim.at(sim.now + int(off_time * 1e6), lambda: step(True))
        if background:
            step(True)
        else:
            count = 0
            while n is None or count < n:
                on(); sim.sleep(on_time); off(); sim.sleep(off_time); count += 1
    def stop(self):
        self.token += 1

class _OutputDevice:
    def __init__(self, pin=None, active_high=True, initial_value=False):
        self.pin = _bcm(pin)
        self.active_high = active_high
        self._blink = _Blinker(self)
        sim = _s()
        sim.numbering = sim.numbering or 'BCM'
        sim.setup_out(self.pin, 0 if active_high else 1)
        if initial_value:
            self.on()
    def _set(self, lit):
        _s().write(self.pin, lit if self.active_high else not lit)
    def on(self):
        self._blink.stop(); self._set(True)
    def off(self):
        self._blink.stop(); self._set(False)
    def toggle(self):
        self._blink.stop(); self._set(not self.is_active)
    @property
    def is_active(self):
        return bool(_s().read(self.pin)) == self.active_high
    @property
    def value(self):
        return 1 if self.is_active else 0
    @value.setter
    def value(self, v):
        self.on() if v else self.off()
    def close(self):
        self._blink.stop()
        _s().mode.pop(self.pin, None)

def _enter(self):
    return self
def _exit(self, *exc):
    self.close()
_OutputDevice.__enter__ = _enter
_OutputDevice.__exit__ = _exit

class LED(_OutputDevice):
    @property
    def is_lit(self):
        return self.is_active
    def blink(self, on_time=1, off_time=1, n=None, background=True):
        self._blink.start(on_time, off_time, n, background, lambda: self._set(True), lambda: self._set(False))

class Buzzer(_OutputDevice):
    def beep(self, on_time=1, off_time=1, n=None, background=True):
        self._blink.start(on_time, off_time, n, background, lambda: self._set(True), lambda: self._set(False))

class PWMLED:
    def __init__(self, pin=None, active_high=True, initial_value=0, frequency=100):
        self.pin = _bcm(pin)
        sim = _s()
        sim.numbering = sim.numbering or 'BCM'
        sim.setup_out(self.pin, 0)
        self._pwm = _PWM(None, frequency, bcm=self.pin)
        self._value = 0.0
        self.value = initial_value
    @property
    def value(self):
        return self._value
    @value.setter
    def value(self, v):
        if not 0 <= v <= 1:
            raise ValueError('PWMLED value must be between 0 and 1')
        self._value = float(v)
        if not self._pwm.running:
            self._pwm.start(self._value * 100)
        else:
            self._pwm.ChangeDutyCycle(self._value * 100)
    def on(self): self.value = 1
    def off(self): self.value = 0
    def toggle(self): self.value = 1 - self._value
    @property
    def is_lit(self): return self._value > 0
    def close(self): self._pwm.stop()

class Button:
    def __init__(self, pin=None, pull_up=True, active_state=None, bounce_time=None, hold_time=1, hold_repeat=False):
        self.pin = _bcm(pin)
        self.pull_up = pull_up
        self._when_pressed = None
        self._when_released = None
        sim = _s()
        sim.numbering = sim.numbering or 'BCM'
        sim.setup_in(self.pin, 'up' if pull_up else 'down')
        sim.watch.setdefault(self.pin, []).append(('both', self._edge))
    def _edge(self):
        callback = self._when_pressed if self.is_pressed else self._when_released
        if callback:
            callback()
    @property
    def is_pressed(self):
        level = _s().read(self.pin)
        return level == 0 if self.pull_up else level == 1
    value = is_pressed
    @property
    def is_active(self): return self.is_pressed
    @property
    def when_pressed(self): return self._when_pressed
    @when_pressed.setter
    def when_pressed(self, fn): self._when_pressed = fn
    @property
    def when_released(self): return self._when_released
    @when_released.setter
    def when_released(self, fn): self._when_released = fn
    def wait_for_press(self, timeout=None):
        return _s().wait_until(lambda: self.is_pressed, timeout)
    def wait_for_release(self, timeout=None):
        return _s().wait_until(lambda: not self.is_pressed, timeout)
    def close(self):
        _s().mode.pop(self.pin, None)

PWMLED.__enter__ = _enter; PWMLED.__exit__ = _exit
Button.__enter__ = _enter; Button.__exit__ = _exit

_gz = types.ModuleType('gpiozero')
_gz.LED = LED; _gz.Buzzer = Buzzer; _gz.PWMLED = PWMLED; _gz.Button = Button

class _Out:
    def write(self, text):
        _s().text(text)
        return len(text)
    def flush(self):
        pass

_real = {}
def _install(sim):
    global _sim
    import time, signal
    _sim = sim
    for name in ('sleep', 'time', 'monotonic', 'perf_counter', 'time_ns'):
        _real.setdefault(name, getattr(time, name))
    def tick():
        sim.now = min(sim.now + 10, sim.limit)  # every clock read costs 10 microseconds, so busy-waits terminate
        if sim.now >= sim.limit:
            raise _TimeLimit()
        return sim.now
    time.sleep = sim.sleep
    time.time = lambda: 1.7e9 + tick() / 1e6
    time.monotonic = lambda: tick() / 1e6
    time.perf_counter = time.monotonic
    time.time_ns = lambda: int(1.7e18 + tick() * 1000)
    signal.pause = lambda: sim.wait_until(lambda: False)
    for mod in (_rpi, _gpio, _gz):
        sys.modules[mod.__name__] = mod
    _rpi.GPIO = _gpio

def __run(args_json):
    args = json.loads(args_json)
    sim = _Sim(int(args['limitUs']), args['inputs'])
    _install(sim)
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = _Out()
    error = None
    ended = False
    try:
        sys.path.insert(0, '/home/pyodide')
        source = open('/home/pyodide/' + args['main']).read()
        import linecache
        linecache.cache[args['main']] = (len(source), None, source.splitlines(True), args['main'])
        code = compile(source, args['main'], 'exec')
        exec(code, {'__name__': '__main__', '__file__': args['main']})
        ended = True
    except _TimeLimit:
        pass
    except SystemExit:
        ended = True
    except KeyboardInterrupt:
        ended = True
    except BaseException as exc:
        error = ''.join(traceback.format_exception_only(type(exc), exc)).strip()
        frames = [f for f in traceback.extract_tb(exc.__traceback__) if not f.filename.startswith('<')]
        sim.text('Traceback (most recent call last):\n' + ''.join(traceback.format_list(frames)) + error + '\n')
    finally:
        sys.stdout, sys.stderr = old_out, old_err
        if '/home/pyodide' in sys.path:
            sys.path.remove('/home/pyodide')
        for name in list(sys.modules):
            if getattr(sys.modules[name], '__file__', '') and str(sys.modules[name].__file__).startswith('/home/pyodide'):
                del sys.modules[name]
    events = sorted(sim.events, key=lambda e: e[1])
    return json.dumps({'events': events, 'endUs': sim.now, 'ended': ended, 'error': error, 'truncated': sim.truncated})
`

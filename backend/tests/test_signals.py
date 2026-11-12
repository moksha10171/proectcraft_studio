"""Backend measurements must agree with frontend/tests/signal-analysis.test.ts (same vectors)."""
import pytest
from app.services.signals import channels, measure, summarize, describe


def wave(pin, rises, high, first=None):
    events = [] if first is None else [{'timeUs': 0, 'pin': pin, 'value': first}]
    for t in rises:
        events += [{'timeUs': t, 'pin': pin, 'value': 1}, {'timeUs': t + high, 'pin': pin, 'value': 0}]
    return events


def test_square_wave_matches_frontend_vector():
    m = measure(channels(wave('D9', [100, 1100, 2100, 3100], 250, 0))['D9'])
    assert (m['cycles'], m['periodUs'], m['frequencyHz'], m['highUs'], m['lowUs']) == (3, 1000, 1000, 250, 750)
    assert m['dutyPercent'] == pytest.approx(25)


def test_level_present_at_start_is_not_a_rise_matches_frontend_vector():
    m = measure(channels([{'timeUs': 0, 'pin': 'D2', 'value': 1}, {'timeUs': 50, 'pin': 'D2', 'value': 0}, {'timeUs': 150, 'pin': 'D2', 'value': 1}])['D2'])
    assert (m['cycles'], m['periodUs'], m['frequencyHz'], m['dutyPercent'], m['highUs'], m['lowUs'], m['transitions']) == (0, None, None, None, None, 100, 2)


def test_irregular_pulses_match_frontend_vector():
    events = [{'timeUs': 0, 'pin': 'D3', 'value': 0}]
    for t, high in zip([100, 1100, 2300, 3300], [200, 300, 400, 100]):
        events += [{'timeUs': t, 'pin': 'D3', 'value': 1}, {'timeUs': t + high, 'pin': 'D3', 'value': 0}]
    m = measure(channels(events)['D3'])
    assert m['periodUs'] == 1000 and m['highUs'] == 250
    assert m['dutyPercent'] == pytest.approx(28.125)


def test_channels_dedupe_and_summarize_serial():
    summary = summarize([{'timeUs': 1, 'pin': 'D13', 'value': 1}, {'timeUs': 2, 'pin': 'D13', 'value': 1}, {'timeUs': 3, 'serial': 'o'}, {'timeUs': 4, 'serial': 'k'}, {'timeUs': 5, 'pin': 'D13', 'value': 0}])
    assert summary['pins']['D13']['transitions'] == 1 and summary['serial'] == 'ok'


def test_description_states_origin_staleness_and_limits():
    run = {'id': 'a' * 32, 'origin': 'emulator', 'engine': 'avr8js-atmega328p', 'sourceRevision': 2, 'durationMs': 5000, 'dropped': 3,
           'trace': wave('D13', [0, 2_000_000, 4_000_000], 1_000_000, 0)}
    text = describe(run, current_revision=3)
    assert 'STALE: current source is revision 3' in text
    assert '0.500 Hz' in text and 'duty 50.0 %' in text and '3 dropped' in text
    assert 'not physical hardware evidence' in text
    assert 'matches the current revision' in describe(run, current_revision=2)

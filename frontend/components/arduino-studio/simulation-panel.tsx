"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { WiringManifest, ComponentType, ArduinoComponent, RaspberryPiWiringManifest, DeviceMode, RaspberryPiComponentType, RaspberryPiComponent } from '@/lib/arduino-studio/types';

interface SimulationPanelProps {
    wiring: WiringManifest | RaspberryPiWiringManifest;
    isRunning: boolean;
    activePinStates: Record<string, number>;
    deviceMode?: DeviceMode;
}

// --- Robust Audio System ---
let audioCtx: AudioContext | null = null;
const oscillators: Record<string, { osc: OscillatorNode, gain: GainNode }> = {};

const initAudio = () => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch { /* empty */ }
};

const playTone = (id: string, freq: number, type: OscillatorType = 'square') => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;
    if (oscillators[id]) {
        try { oscillators[id].osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05); oscillators[id].gain.gain.setTargetAtTime(0.1, audioCtx.currentTime, 0.05); } catch { /* empty */ }
    } else {
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            oscillators[id] = { osc, gain };
        } catch { /* empty */ }
    }
};

const stopTone = (id: string) => {
    if (!audioCtx || !oscillators[id]) return;
    try {
        const { osc, gain } = oscillators[id];
        gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
        setTimeout(() => { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch { /* empty */ } }, 100);
        delete oscillators[id];
    } catch { /* empty */ }
};

// --- Helper: Sparkline Graph ---
const Sparkline = ({ data, color = '#22d3ee', max = 1023 }: { data: number[], color?: string, max?: number }) => {
    if (!data || data.length < 2) return null;
    const width = 40; const height = 20; const step = width / (data.length - 1);
    const pathData = data.map((val, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (Math.min(val, max) / max) * height}`).join(' ');
    return (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 border border-slate-700 rounded px-1 py-0.5 shadow-lg z-30 pointer-events-none transition-opacity duration-300">
            <svg width={width} height={height} className="overflow-visible"><path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx={width} cy={height - (Math.min(data[data.length - 1], max) / max) * height} r="2" fill="#fff" /></svg>
        </div>
    );
};

const getPinColor = (pin: string | number) => {
    const p = String(pin).toUpperCase();
    if (p === 'GND') return '#1f2937';
    if (['5V', '3.3V', 'VIN'].includes(p)) return '#ef4444';
    if (p.startsWith('A')) return '#a855f7';
    if (['0', '1'].includes(p)) return '#f59e0b';
    const pNum = parseInt(p);
    if (!isNaN(pNum)) return pNum >= 8 ? '#3b82f6' : '#10b981';
    return '#64748b';
};

const SimulationPanel: React.FC<SimulationPanelProps> = ({ wiring, isRunning, activePinStates, deviceMode = 'arduino' }) => {
    const [localInteractions, setLocalInteractions] = useState<Record<string, boolean>>({});
    const [dataHistory, setDataHistory] = useState<Record<string, number[]>>({});

    const contentRef = useRef<HTMLDivElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const componentRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [wirePaths, setWirePaths] = useState<{ id: string, color: string, path: string }[]>([]);

    useEffect(() => {
        if (!isRunning) { Object.keys(oscillators).forEach(stopTone); return; }
        try {
            wiring.components.forEach(comp => {
                const state = activePinStates[String(comp.pin)] || 0;
                if (comp.type === ComponentType.BUZZER) state > 0 ? playTone(comp.id, 2000, 'square') : stopTone(comp.id);
                else if (comp.type === ComponentType.VIBRATION_MOTOR) state > 0 ? playTone(comp.id, 150, 'sawtooth') : stopTone(comp.id);
                else if (comp.type === ComponentType.SPEAKER) state > 0 ? playTone(comp.id, 120 + Math.random() * 50, 'sawtooth') : stopTone(comp.id);
            });
        } catch (error) {
            console.warn('Audio system error:', error);
            // Silently fail if audio doesn't work - don't break the simulation
        }
    }, [isRunning, activePinStates, wiring.components]);

    useEffect(() => { return () => { Object.keys(oscillators).forEach(stopTone); }; }, []);

    useEffect(() => {
        if (!isRunning) { setDataHistory({}); return; }
        try {
            setDataHistory(prev => {
                const next = { ...prev };
                wiring.components.forEach(comp => {
                    if (!comp || !comp.id || comp.pin === undefined) return;
                    const val = activePinStates[String(comp.pin)] || 0;
                    const hist = next[comp.id] || Array(20).fill(0);
                    next[comp.id] = [...hist, val].slice(-20);
                });
                return next;
            });
        } catch (error) {
            console.warn('Data history update error:', error);
        }
    }, [activePinStates, isRunning, wiring.components]);

    const toggleInteraction = (id: string, pressed: boolean) => setLocalInteractions(prev => ({ ...prev, [id]: pressed }));

    const updateWires = () => {
        if (!contentRef.current || !boardRef.current) return;
        try {
            const parentRect = contentRef.current.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            const boardRel = { x: boardRect.left - parentRect.left + boardRect.width / 2, y: boardRect.top - parentRect.top + boardRect.height / 2 };

            const newPaths = wiring.components.map((comp, index) => {
                if (!comp || !comp.id || comp.pin === undefined) return null;
                const compEl = componentRefs.current[comp.id];
                if (!compEl) return null;

                const compRect = compEl.getBoundingClientRect();
                const startX = compRect.left - parentRect.left + compRect.width / 2;
                const startY = compRect.bottom - parentRect.top - 5;
                const pin = String(comp.pin).toUpperCase();
                let endX = boardRel.x, endY = boardRel.y;

                if (['GND'].includes(pin)) { endX += 60; endY -= 96; }
                else if (['5V', '3.3V'].includes(pin)) { endX -= 50; endY += 96; }
                else if (pin.startsWith('A')) {
                    const idx = parseInt(pin.replace('A', '')) || 0;
                    endX = boardRel.x + 75 + (idx * 15); endY = boardRel.y + 96;
                } else {
                    const pInt = parseInt(pin);
                    if (!isNaN(pInt)) {
                        if (pInt > 7) { endX = boardRel.x + 105 - ((pInt - 8) * 15); endY = boardRel.y - 96; }
                        else { endX = boardRel.x - 25 - ((7 - pInt) * 15); endY = boardRel.y - 96; }
                    }
                }
                const verticalDist = Math.abs(endY - startY);
                const hang = Math.min(150, Math.max(50, verticalDist * 0.6)) + (index % 5) * 10;
                const curveX = (index % 2 === 0 ? 1 : -1) * (index * 2);
                return { id: comp.id, color: getPinColor(pin), path: `M ${startX} ${startY} C ${startX + curveX} ${startY + hang * 0.5}, ${endX + curveX} ${endY - hang * 0.5}, ${endX} ${endY}` };
            }).filter(Boolean) as { id: string, color: string, path: string }[];
            setWirePaths(newPaths);
        } catch (error) {
            console.warn('Wire update error:', error);
            // Don't crash if wire drawing fails
        }
    };

    useLayoutEffect(() => {
        updateWires();
        const observer = new ResizeObserver(updateWires);
        if (contentRef.current) observer.observe(contentRef.current);
        window.addEventListener('resize', updateWires);
        return () => { observer.disconnect(); window.removeEventListener('resize', updateWires); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wiring, isRunning]);

    // --- RENDERERS ---

    const renderComponent = (comp: ArduinoComponent) => {
        // Validate component before rendering
        if (!comp || !comp.type || comp.pin === undefined) {
            console.warn('Invalid component data:', comp);
            return null;
        }

        const stateVal = activePinStates[String(comp.pin)] || 0;
        const isActive = stateVal > 0;
        const isPressed = localInteractions[comp.id];
        const history = dataHistory[comp.id];
        const wrapperClass = "flex flex-col items-center gap-2 group relative select-none transition-transform duration-200 z-20";

        switch (comp.type) {
            case ComponentType.BUTTON:
                return (
                    <div className={`${wrapperClass} cursor-pointer active:scale-95`} onMouseDown={() => toggleInteraction(comp.id, true)} onMouseUp={() => toggleInteraction(comp.id, false)} onMouseLeave={() => toggleInteraction(comp.id, false)}>
                        <div className="w-12 h-12 bg-gray-800 rounded border-b-4 border-black shadow-lg flex items-center justify-center relative"><div className={`w-8 h-8 rounded-full border-2 border-red-900 transition-all duration-75 ${isPressed || isActive ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-red-700'}`}></div></div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">BTN {comp.pin}</span>
                    </div>
                );
            case ComponentType.LED: {
                const ledColor = (comp.properties?.color as string) || 'red';
                return (
                    <div className={wrapperClass}>
                        <div className="relative"><div className={`w-10 h-10 rounded-t-full rounded-b-md border border-black/20 transition-all duration-100 relative z-10 ${isActive ? '' : 'brightness-50 grayscale'}`} style={{ backgroundColor: ledColor, boxShadow: isActive ? `0 0 25px 5px ${ledColor === 'blue' ? 'rgba(59,130,246,0.9)' : 'rgba(239,68,68,0.9)'}, inset 0 -4px 6px rgba(0,0,0,0.3)` : 'inset 0 -4px 6px rgba(0,0,0,0.4)', transform: isActive ? 'scale(1.05)' : 'scale(1)' }}><div className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-white rounded-full opacity-60 blur-[1px]"></div></div></div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LED</span>
                    </div>
                );
            }
            case ComponentType.BUZZER:
            case ComponentType.VIBRATION_MOTOR:
            case ComponentType.SPEAKER:
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded-full bg-black border-2 border-gray-700 shadow-md flex items-center justify-center relative ${isActive ? 'animate-pulse' : ''}`}>
                            <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{comp.type}</span>
                    </div>
                );

            // --- ADVANCED SENSORS ---

            case ComponentType.SENSOR_ULTRASONIC: {
                const dist = stateVal;
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={200} color="#38bdf8" />}
                        <div className="w-24 h-10 bg-[#4080bf] rounded-md border-b-2 border-[#2b5783] relative flex items-center justify-evenly shadow-md">
                            {/* Metal Cylinders */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-300 to-white border border-gray-400 grid place-items-center relative shadow-inner">
                                <div className="w-7 h-7 bg-black/80 rounded-full mesh-pattern opacity-60"></div>
                                <span className="text-[5px] text-black absolute top-1 font-bold">T</span>
                            </div>
                            <div className="w-1 h-3 bg-gray-300 rounded-sm"></div> {/* Crystal */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-300 to-white border border-gray-400 grid place-items-center relative shadow-inner">
                                <div className="w-7 h-7 bg-black/80 rounded-full mesh-pattern opacity-60"></div>
                                <span className="text-[5px] text-black absolute top-1 font-bold">R</span>
                            </div>
                        </div>
                        <div className="text-[9px] font-mono text-sky-700 bg-sky-100 px-1.5 rounded shadow-sm mt-1">{isRunning ? `${dist} cm` : 'HC-SR04'}</div>
                    </div>
                );
            }

            case ComponentType.SENSOR_WATER: {
                const waterLevel = stateVal;
                const fillPercent = Math.min(100, (waterLevel / 800) * 100);
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#3b82f6" />}
                        <div className="w-10 h-16 bg-[#b91c1c] border border-red-900 rounded-sm shadow-md relative overflow-hidden flex flex-col items-center">
                            {/* Gold Traces */}
                            <div className="absolute inset-x-1 top-4 bottom-1 flex justify-between">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-full bg-yellow-400/80 rounded-full"></div>)}
                            </div>
                            {/* Water Overlay */}
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-blue-500/60 transition-all duration-300 ease-in-out border-t border-blue-300"
                                style={{ height: `${fillPercent}%` }}
                            >
                                <div className="w-full h-0.5 bg-white/40 animate-pulse"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">WATER</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_TEMP:
                // DS18B20 Style
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1} color="#fb923c" />}
                        <div className="flex flex-col items-center">
                            {/* Black Body */}
                            <div className="w-5 h-8 bg-[#1a1a1a] rounded-t-full rounded-b-sm relative shadow-md flex items-center justify-center">
                                <span className="text-[5px] text-gray-400 rotate-90">DS18B20</span>
                            </div>
                            {/* Legs */}
                            <div className="flex gap-1 -mt-0.5">
                                <div className="w-0.5 h-3 bg-gray-400"></div>
                                <div className="w-0.5 h-3 bg-gray-400"></div>
                                <div className="w-0.5 h-3 bg-gray-400"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">TEMP</span>
                    </div>
                );

            case ComponentType.SENSOR_PH: {
                // pH Probe Visual
                const phVal = stateVal / 100; // stored as int
                const phColor = phVal < 7 ? 'bg-yellow-400' : phVal > 7 ? 'bg-blue-500' : 'bg-green-500';
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1400} color="#84cc16" />}
                        <div className="flex flex-col items-center gap-0.5">
                            {/* BNC Connector Board */}
                            <div className="w-8 h-8 bg-[#1e293b] rounded border border-gray-600 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-300"></div>
                            </div>
                            {/* Cable */}
                            <div className="w-1 h-6 bg-black"></div>
                            {/* Probe */}
                            <div className="w-4 h-16 bg-blue-500/20 border border-blue-400 rounded-full relative overflow-hidden flex flex-col justify-end items-center">
                                <div className={`w-3 h-3 rounded-full mb-1 ${phColor} opacity-80 shadow-[0_0_5px_currentColor]`}></div>
                                <div className="w-full h-10 bg-white/10 absolute top-0"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">pH {phVal.toFixed(1)}</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_HEART: {
                // Pulse Sensor
                const isBeat = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-10 bg-purple-900 rounded-full border-2 border-purple-400 shadow-md flex items-center justify-center relative">
                            <div className={`transition-all duration-100 ${isBeat ? 'scale-125 text-red-500' : 'scale-100 text-red-800'}`}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                            </div>
                            {/* Green LED flash on back */}
                            {isBeat && <div className="absolute inset-0 bg-green-500/30 rounded-full animate-ping"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">PULSE</span>
                    </div>
                );
            }

            case ComponentType.MODULE_WIFI: {
                // ESP-01 Style
                const wifiState = stateVal; // 0=off, 1=connecting, 2=on
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-14 bg-black rounded-sm border-t-4 border-yellow-600 shadow-md relative flex flex-col p-1">
                            {/* Antenna Trace */}
                            <div className="w-full h-4 border-t-2 border-r-2 border-yellow-600/80 rounded-tr-md mb-1 opacity-70"></div>
                            {/* Chip */}
                            <div className="w-6 h-6 bg-[#1a1a1a] self-center rounded border border-gray-700 flex items-center justify-center">
                                <div className="w-1 h-1 bg-white/20 rounded-full absolute top-1 right-1"></div>
                                <span className="text-[4px] text-gray-500">ESP</span>
                            </div>
                            {/* Blue Status LED */}
                            <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1 right-1 transition-colors ${wifiState > 0 ? 'bg-blue-500 shadow-[0_0_8px_blue] animate-pulse' : 'bg-blue-900'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">WiFi</span>
                    </div>
                );
            }

            case ComponentType.SEVEN_SEGMENT: {
                const num = stateVal;
                const segs = [
                    [1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1],
                    [0, 1, 1, 0, 0, 1, 1], [1, 0, 1, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0, 0],
                    [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]
                ];
                const currentSegs = segs[num % 10] || [0, 0, 0, 0, 0, 0, 0];
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-20 bg-gray-900 rounded border-2 border-gray-600 p-1 relative shadow-xl">
                            <div className="w-full h-full bg-black relative">
                                {isActive && <div className="absolute inset-0 opacity-10 overflow-hidden"><div className="animate-matrix-rain text-[4px] text-green-500 font-mono break-all leading-none">010101010101010101</div></div>}
                                <div className={`absolute top-1 left-2 right-2 h-1 bg-red-600 rounded-full transition-opacity ${currentSegs[0] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute top-1 right-1 h-8 w-1 bg-red-600 rounded-full transition-opacity ${currentSegs[1] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute bottom-1 right-1 h-8 w-1 bg-red-600 rounded-full transition-opacity ${currentSegs[2] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute bottom-1 left-2 right-2 h-1 bg-red-600 rounded-full transition-opacity ${currentSegs[3] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute bottom-1 left-1 h-8 w-1 bg-red-600 rounded-full transition-opacity ${currentSegs[4] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute top-1 left-1 h-8 w-1 bg-red-600 rounded-full transition-opacity ${currentSegs[5] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                                <div className={`absolute top-[38px] left-2 right-2 h-1 bg-red-600 rounded-full transition-opacity ${currentSegs[6] ? 'opacity-100 shadow-[0_0_8px_red]' : 'opacity-10'}`}></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">7-SEG</span>
                    </div>
                );
            }

            case ComponentType.STEPPER: {
                const rotation = stateVal;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gray-400 rounded-full border-4 border-gray-500 shadow-xl relative flex items-center justify-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full border border-gray-400 relative transition-transform duration-100" style={{ transform: `rotate(${rotation}deg)` }}>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-black rounded-sm"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">NEMA 17</span>
                    </div>
                );
            }

            case ComponentType.JOYSTICK: {
                const jX = stateVal;
                const pinY = comp.properties?.pinY;
                const jY = pinY ? (activePinStates[String(pinY)] || 512) : 512;
                const xPercent = ((jX - 512) / 512) * 20;
                const yPercent = ((jY - 512) / 512) * 20;
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-16 bg-black rounded-md border-2 border-gray-700 relative overflow-hidden flex items-center justify-center">
                            <div className="w-full h-full grid-pattern opacity-30 absolute inset-0"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 shadow-lg relative transition-transform duration-75"
                                style={{ transform: `translate(${xPercent}px, ${yPercent}px)` }}>
                                <div className="absolute inset-2 bg-black/50 rounded-full"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">JOYSTICK</span>
                    </div>
                );
            }

            case ComponentType.NEOPIXEL: {
                const offset = stateVal;
                return (
                    <div className={wrapperClass}>
                        <div className="flex gap-1 p-1 bg-black rounded-full border border-gray-700 shadow-lg">
                            {[0, 20, 40, 60].map((shift, i) => {
                                const hue = (offset + shift) % 360;
                                return (
                                    <div key={i} className="w-4 h-4 rounded-full bg-white transition-colors duration-75"
                                        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)`, boxShadow: `0 0 5px hsl(${hue}, 100%, 50%)` }}>
                                    </div>
                                )
                            })}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">NEOPIXEL</span>
                    </div>
                );
            }

            case ComponentType.LCD: {
                // 16x2 LCD Display
                const displayText = isRunning ? "Hello World!" : "16x2 LCD";
                return (
                    <div className={wrapperClass}>
                        <div className="w-28 h-14 bg-[#1a365d] rounded-md border-2 border-[#2d4a6f] shadow-lg relative overflow-hidden">
                            {/* PCB Background */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}></div>
                            </div>
                            {/* Display Area */}
                            <div className={`absolute inset-1 rounded-sm flex flex-col justify-center px-1 font-mono text-[8px] leading-tight transition-all ${isActive ? 'bg-[#90EE90] text-[#1a1a1a]' : 'bg-[#4a5d4a] text-[#2a2a2a]'}`}>
                                <div className="truncate">{displayText}</div>
                                <div className="truncate opacity-60">{isActive ? `Val: ${stateVal}` : ''}</div>
                            </div>
                            {/* Potentiometer */}
                            <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full border border-blue-400"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LCD 16x2</span>
                    </div>
                );
            }

            case ComponentType.RGB_LED: {
                // RGB LED with color blending
                const r = stateVal;
                const g = (comp.properties?.pinG ? (activePinStates[String(comp.properties.pinG)] || 0) : 0);
                const b = (comp.properties?.pinB ? (activePinStates[String(comp.properties.pinB)] || 0) : 0);
                const rgbColor = `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
                const isLit = r > 0 || g > 0 || b > 0;
                return (
                    <div className={wrapperClass}>
                        <div className="relative">
                            {/* LED Housing */}
                            <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-gray-300 shadow-md flex items-center justify-center">
                                {/* LED Dome */}
                                <div
                                    className={`w-8 h-8 rounded-full transition-all duration-150 ${isLit ? '' : 'opacity-30'}`}
                                    style={{
                                        backgroundColor: isLit ? rgbColor : '#333',
                                        boxShadow: isLit ? `0 0 20px 5px ${rgbColor}, inset 0 2px 4px rgba(255,255,255,0.4)` : 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <div className="absolute top-1 right-2 w-2 h-2 bg-white/50 rounded-full blur-[1px]"></div>
                                </div>
                            </div>
                            {/* Legs */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                                <div className="w-0.5 h-3 bg-gray-400 rounded-b-sm"></div>
                                <div className="w-0.5 h-4 bg-gray-400 rounded-b-sm"></div>
                                <div className="w-0.5 h-3 bg-gray-400 rounded-b-sm"></div>
                                <div className="w-0.5 h-3 bg-gray-400 rounded-b-sm"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm mt-2">RGB LED</span>
                    </div>
                );
            }

            case ComponentType.SERVO: {
                // Servo motor with rotating arm
                const angle = Math.min(180, Math.max(0, stateVal));
                return (
                    <div className={wrapperClass}>
                        <div className="relative">
                            {/* Servo Body */}
                            <div className="w-16 h-10 bg-gradient-to-b from-blue-600 to-blue-800 rounded-sm shadow-lg border border-blue-900 relative">
                                {/* Mounting Tabs */}
                                <div className="absolute -left-1 top-1 w-2 h-2 bg-blue-700 rounded-sm"></div>
                                <div className="absolute -left-1 bottom-1 w-2 h-2 bg-blue-700 rounded-sm"></div>
                                <div className="absolute -right-1 top-1 w-2 h-2 bg-blue-700 rounded-sm"></div>
                                <div className="absolute -right-1 bottom-1 w-2 h-2 bg-blue-700 rounded-sm"></div>
                                {/* Label */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[6px] text-white/70 font-bold">SG90</span>
                                </div>
                                {/* Output shaft hub */}
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-300 shadow-md z-10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                </div>
                            </div>
                            {/* Servo Arm */}
                            <div
                                className="absolute -top-1 left-1/2 w-1 h-10 bg-white rounded-full shadow-md origin-bottom transition-transform duration-200 z-20"
                                style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full border border-gray-300"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm mt-3">{angle}°</span>
                    </div>
                );
            }

            case ComponentType.RELAY: {
                // Relay module
                const isOn = stateVal > 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-blue-900 rounded border border-blue-700 shadow-lg relative flex flex-col p-1">
                            {/* Relay cube */}
                            <div className={`flex-1 bg-blue-600 rounded-sm border border-blue-500 flex items-center justify-center relative transition-all ${isOn ? 'bg-blue-500' : ''}`}>
                                <span className="text-[5px] text-white/60 font-bold">SONGLE</span>
                                {/* Click indicator */}
                                {isOn && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-sm"></div>}
                            </div>
                            {/* Terminals */}
                            <div className="flex justify-between mt-1 px-0.5">
                                <div className="w-2 h-2 bg-green-500 rounded-sm border border-green-600"></div>
                                <div className="w-2 h-2 bg-yellow-500 rounded-sm border border-yellow-600"></div>
                                <div className="w-2 h-2 bg-red-500 rounded-sm border border-red-600"></div>
                            </div>
                            {/* Status LED */}
                            <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all ${isOn ? 'bg-red-500 shadow-[0_0_6px_red]' : 'bg-red-900'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{isOn ? 'ON' : 'OFF'}</span>
                    </div>
                );
            }

            case ComponentType.POTENTIOMETER: {
                // Rotary potentiometer
                const value = stateVal;
                const rotation = (value / 1023) * 270 - 135; // -135 to +135 degrees
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#8b5cf6" />}
                        <div className="relative w-14 h-14">
                            {/* Base */}
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full border-2 border-gray-600 shadow-lg">
                                {/* Value arc background */}
                                <svg className="absolute inset-0" viewBox="0 0 56 56">
                                    <circle cx="28" cy="28" r="20" fill="none" stroke="#374151" strokeWidth="3" strokeDasharray="94.2" strokeDashoffset="31.4" transform="rotate(135 28 28)" />
                                    <circle cx="28" cy="28" r="20" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={`${(value / 1023) * 94.2} 94.2`} strokeDashoffset="31.4" transform="rotate(135 28 28)" className="transition-all duration-100" />
                                </svg>
                            </div>
                            {/* Knob */}
                            <div className="absolute inset-2 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-inner border border-gray-400 flex items-center justify-center">
                                {/* Indicator line */}
                                <div
                                    className="absolute w-0.5 h-4 bg-gray-800 rounded-full origin-bottom transition-transform duration-100"
                                    style={{ transform: `translateY(-25%) rotate(${rotation}deg)` }}
                                ></div>
                                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{value}</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_DHT: {
                // DHT11/22 Temperature & Humidity Sensor
                const temp = isRunning ? (20 + (stateVal % 20)).toFixed(1) : '--';
                const humidity = isRunning ? (40 + (stateVal % 40)).toFixed(0) : '--';
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-[#4fc3f7] rounded-sm border border-[#29b6f6] shadow-md relative overflow-hidden">
                            {/* Mesh pattern */}
                            <div className="absolute inset-1 grid grid-cols-4 gap-0.5 opacity-40">
                                {[...Array(16)].map((_, i) => <div key={i} className="w-full h-full bg-white/30 rounded-sm"></div>)}
                            </div>
                            {/* Label */}
                            <div className="absolute bottom-0 inset-x-0 bg-white/90 py-0.5 text-center">
                                <span className="text-[6px] font-bold text-blue-800">DHT11</span>
                            </div>
                        </div>
                        <div className="flex gap-1 text-[8px] font-mono">
                            <span className="bg-orange-100 text-orange-700 px-1 rounded">{temp}°C</span>
                            <span className="bg-blue-100 text-blue-700 px-1 rounded">{humidity}%</span>
                        </div>
                    </div>
                );
            }

            case ComponentType.LDR: {
                // Light Dependent Resistor
                const lightLevel = stateVal;
                const brightness = Math.min(100, (lightLevel / 1023) * 100);
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#fbbf24" />}
                        <div className="relative">
                            {/* LDR Body */}
                            <div
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 border-2 border-amber-700 shadow-lg flex items-center justify-center transition-all duration-200"
                                style={{ boxShadow: `0 0 ${brightness / 5}px ${brightness / 10}px rgba(251, 191, 36, ${brightness / 100})` }}
                            >
                                {/* Squiggly pattern */}
                                <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-60">
                                    <path d="M4 12 Q8 6, 12 12 Q16 18, 20 12" fill="none" stroke="#78350f" strokeWidth="2" />
                                </svg>
                            </div>
                            {/* Legs */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                <div className="w-0.5 h-3 bg-gray-400"></div>
                                <div className="w-0.5 h-3 bg-gray-400"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm mt-1">LDR {Math.round(brightness)}%</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_GAS: {
                // MQ-x Gas Sensor
                const gasLevel = stateVal;
                const dangerLevel = gasLevel > 700 ? 'text-red-500' : gasLevel > 400 ? 'text-yellow-500' : 'text-green-500';
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#ef4444" />}
                        <div className="relative">
                            {/* Sensor housing */}
                            <div className="w-12 h-14 bg-gradient-to-b from-gray-700 to-gray-900 rounded-md border border-gray-600 shadow-lg flex flex-col items-center p-1">
                                {/* Mesh cap */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-gray-400 to-gray-600 border border-gray-500 relative overflow-hidden">
                                    <div className="absolute inset-0 mesh-pattern opacity-80"></div>
                                    {/* Heating coil glow */}
                                    {isActive && (
                                        <div className="absolute inset-2 bg-orange-500/40 rounded-full animate-pulse"></div>
                                    )}
                                </div>
                                {/* Label */}
                                <span className="text-[6px] text-white/60 mt-1">MQ-2</span>
                            </div>
                            {/* Pins */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 h-2 bg-gray-400"></div>)}
                            </div>
                        </div>
                        <span className={`text-[9px] font-mono bg-white/90 px-1.5 rounded shadow-sm ${dangerLevel}`}>{gasLevel} ppm</span>
                    </div>
                );
            }

            case ComponentType.PIR: {
                // PIR Motion Sensor (HC-SR501)
                const motionDetected = stateVal > 0;
                return (
                    <div className={wrapperClass}>
                        <div className="relative">
                            {/* Sensor body */}
                            <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg border border-[#2d5a8f] shadow-lg flex items-center justify-center">
                                {/* Fresnel lens dome */}
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-white/80 to-white/20 border border-white/30 relative transition-all ${motionDetected ? 'shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`}>
                                    {/* Lens pattern */}
                                    <div className="absolute inset-1 rounded-full overflow-hidden">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="absolute inset-0 border border-white/20 rounded-full" style={{ transform: `scale(${1 - i * 0.15})` }}></div>
                                        ))}
                                    </div>
                                    {/* Detection indicator */}
                                    {motionDetected && <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping"></div>}
                                </div>
                            </div>
                            {/* Adjust pots */}
                            <div className="absolute -bottom-1 left-1 flex gap-1">
                                <div className="w-2 h-2 bg-yellow-600 rounded-full border border-yellow-700"></div>
                                <div className="w-2 h-2 bg-yellow-600 rounded-full border border-yellow-700"></div>
                            </div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${motionDetected ? 'bg-red-100 text-red-600' : 'bg-white/90 text-gray-500'}`}>
                            {motionDetected ? 'MOTION!' : 'PIR'}
                        </span>
                    </div>
                );
            }

            case ComponentType.IR_SENSOR: {
                // IR Receiver/Transmitter
                const irActive = stateVal > 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-12 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center p-1 relative">
                            {/* IR LED dome */}
                            <div className={`w-6 h-6 rounded-t-full bg-[#1a0a1a] border border-purple-900 relative transition-all ${irActive ? 'shadow-[0_0_10px_rgba(147,51,234,0.8)]' : ''}`}>
                                {irActive && <div className="absolute inset-0 bg-purple-500/50 rounded-t-full animate-pulse"></div>}
                            </div>
                            {/* Body */}
                            <div className="w-6 h-3 bg-[#1a0a1a] border-x border-b border-purple-900"></div>
                            {/* Legs */}
                            <div className="flex gap-1 mt-1">
                                <div className="w-0.5 h-2 bg-gray-400"></div>
                                <div className="w-0.5 h-2 bg-gray-400"></div>
                                <div className="w-0.5 h-2 bg-gray-400"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">IR</span>
                    </div>
                );
            }

            case ComponentType.MOTOR_DRIVER: {
                // L298N Motor Driver
                const motor1Speed = stateVal;
                const motor2Speed = comp.properties?.motor2Pin ? (activePinStates[String(comp.properties.motor2Pin)] || 0) : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-16 bg-red-900 rounded border border-red-800 shadow-lg relative p-1">
                            {/* Chip */}
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-6 bg-[#1a1a1a] rounded-sm border border-gray-600 flex items-center justify-center">
                                <span className="text-[5px] text-white/50">L298N</span>
                            </div>
                            {/* Heatsink */}
                            <div className="absolute top-2 right-1 w-4 h-5 flex flex-col gap-[1px]">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-full h-0.5 bg-gray-400"></div>)}
                            </div>
                            {/* Motor terminals */}
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-sm border transition-all ${motor1Speed > 0 ? 'bg-green-500 border-green-600 shadow-[0_0_5px_green]' : 'bg-gray-700 border-gray-600'}`}></div>
                                    <span className="text-[5px] text-white/50">M1</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-sm border transition-all ${motor2Speed > 0 ? 'bg-green-500 border-green-600 shadow-[0_0_5px_green]' : 'bg-gray-700 border-gray-600'}`}></div>
                                    <span className="text-[5px] text-white/50">M2</span>
                                </div>
                            </div>
                            {/* Power LED */}
                            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_green]"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">L298N</span>
                    </div>
                );
            }

            case ComponentType.OLED: {
                // OLED Display (SSD1306)
                const displayValue = stateVal;
                return (
                    <div className={wrapperClass}>
                        <div className="w-24 h-14 bg-[#0a0a0a] rounded border-2 border-blue-900 shadow-lg relative overflow-hidden">
                            {/* Screen area */}
                            <div className="absolute inset-1 bg-[#000810] rounded-sm flex flex-col items-center justify-center p-1">
                                {isActive ? (
                                    <>
                                        <span className="text-[8px] text-cyan-400 font-mono">ArduGen</span>
                                        <span className="text-[10px] text-white font-bold font-mono">{displayValue}</span>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                                            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${(displayValue / 1023) * 100}%` }}></div>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[7px] text-gray-600 font-mono">SSD1306</span>
                                )}
                            </div>
                            {/* I2C address label */}
                            <div className="absolute bottom-0 right-1 text-[5px] text-blue-400/50">0x3C</div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">OLED</span>
                    </div>
                );
            }

            case ComponentType.KEYPAD: {
                // 4x4 Keypad
                const pressedKey = stateVal % 16;
                const keys = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-20 bg-gray-800 rounded border border-gray-700 shadow-lg p-1 grid grid-cols-4 gap-0.5">
                            {keys.map((key, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-center rounded-sm text-[6px] font-mono font-bold transition-all
                                        ${isRunning && i === pressedKey ? 'bg-white text-black scale-95' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">KEYPAD</span>
                    </div>
                );
            }

            case ComponentType.ROTARY_ENCODER: {
                // Rotary Encoder with push button
                const rotation = (stateVal % 360);
                const buttonPressed = comp.properties?.sw ? (activePinStates[String(comp.properties.sw)] > 0) : false;
                return (
                    <div className={wrapperClass}>
                        <div className="relative w-12 h-12">
                            {/* Base */}
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full border-2 border-gray-500 shadow-lg">
                                {/* Rotation marks */}
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-0.5 h-1.5 bg-gray-400 rounded-full"
                                        style={{
                                            top: '2px',
                                            left: '50%',
                                            transform: `translateX(-50%) rotate(${i * 30}deg)`,
                                            transformOrigin: '50% 22px'
                                        }}
                                    ></div>
                                ))}
                            </div>
                            {/* Knob */}
                            <div
                                className={`absolute inset-2 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full shadow-inner border border-gray-400 transition-transform duration-75 ${buttonPressed ? 'scale-95 brightness-90' : ''}`}
                                style={{ transform: `rotate(${rotation}deg)` }}
                            >
                                {/* Indicator */}
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">ENCODER</span>
                    </div>
                );
            }

            case ComponentType.LED_MATRIX: {
                // 8x8 LED Matrix
                const pattern = stateVal;
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-16 bg-[#1a1a1a] rounded border border-gray-700 shadow-lg p-1 grid grid-cols-8 gap-[1px]">
                            {[...Array(64)].map((_, i) => {
                                const row = Math.floor(i / 8);
                                const col = i % 8;
                                // Create animated patterns based on state
                                const isLit = isRunning && ((pattern + i) % 8 === row || (pattern + i) % 8 === col);
                                return (
                                    <div
                                        key={i}
                                        className={`rounded-full transition-all duration-100 ${isLit ? 'bg-red-500 shadow-[0_0_3px_red]' : 'bg-red-900/30'}`}
                                    ></div>
                                );
                            })}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">8x8 MATRIX</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_SOUND: {
                // Sound/Microphone Sensor
                const soundLevel = stateVal;
                const bars = 5;
                const activeBarCount = Math.floor((soundLevel / 1023) * bars);
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center p-1.5 gap-1">
                            {/* Microphone symbol */}
                            <div className="w-4 h-6 bg-gray-700 rounded-t-full border border-gray-600 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-3 bg-gray-500 rounded-t-sm"></div>
                            </div>
                            {/* Level bars */}
                            <div className="flex gap-0.5 h-3">
                                {[...Array(bars)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 rounded-sm transition-all ${i < activeBarCount ? 'bg-green-500 shadow-[0_0_3px_green]' : 'bg-gray-700'}`}
                                        style={{ height: `${50 + i * 10}%` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">SOUND</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_SOIL: {
                // Soil Moisture Sensor
                const moisture = stateVal;
                const moisturePercent = Math.round((moisture / 1023) * 100);
                const moistureColor = moisturePercent > 70 ? 'bg-blue-500' : moisturePercent > 40 ? 'bg-green-500' : 'bg-yellow-500';
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#22c55e" />}
                        <div className="w-8 h-16 bg-yellow-900 rounded-b-lg border border-yellow-800 shadow-md relative overflow-hidden">
                            {/* Prongs */}
                            <div className="absolute top-0 left-1.5 w-1.5 h-12 bg-gray-400 rounded-b-sm"></div>
                            <div className="absolute top-0 right-1.5 w-1.5 h-12 bg-gray-400 rounded-b-sm"></div>
                            {/* Moisture indicator */}
                            <div
                                className={`absolute bottom-0 left-0 right-0 ${moistureColor} opacity-60 transition-all`}
                                style={{ height: `${moisturePercent}%` }}
                            ></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{moisturePercent}%</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_PRESSURE: {
                // BMP180/BME280 Pressure Sensor
                const pressure = isRunning ? 1013 + (stateVal % 50) - 25 : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-10 bg-purple-900 rounded border border-purple-700 shadow-md flex items-center justify-center relative">
                            <div className="w-6 h-6 bg-[#1a1a1a] rounded-sm border border-gray-600 flex items-center justify-center">
                                <span className="text-[5px] text-purple-400">BMP</span>
                            </div>
                            {isActive && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{isRunning ? `${pressure}hPa` : 'BMP180'}</span>
                    </div>
                );
            }

            case ComponentType.ACCELEROMETER: {
                // MPU6050 Accelerometer/Gyroscope
                const ax = ((stateVal % 200) - 100) / 100;
                const ay = (((stateVal + 67) % 200) - 100) / 100;
                const az = (((stateVal + 134) % 200) - 100) / 100;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-purple-900 rounded border border-purple-700 shadow-md flex items-center justify-center relative">
                            <div className="w-8 h-6 bg-[#1a1a1a] rounded-sm border border-gray-600 flex items-center justify-center">
                                <span className="text-[4px] text-purple-300">MPU6050</span>
                            </div>
                            {/* Axis indicator */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 text-[6px] font-mono">
                                <span className="text-red-400">X:{ax.toFixed(1)}</span>
                                <span className="text-green-400">Y:{ay.toFixed(1)}</span>
                                <span className="text-blue-400">Z:{az.toFixed(1)}</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm mt-2">ACCEL</span>
                    </div>
                );
            }

            case ComponentType.MODULE_GPS: {
                // NEO-6M GPS Module
                const lat = isRunning ? (12.9716 + (stateVal % 100) * 0.0001).toFixed(4) : '--';
                const lng = isRunning ? (77.5946 + (stateVal % 100) * 0.0001).toFixed(4) : '--';
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-md relative overflow-hidden p-1">
                            {/* Ceramic antenna */}
                            <div className="w-10 h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded mx-auto border border-gray-500"></div>
                            {/* Chip */}
                            <div className="w-6 h-3 bg-gray-800 border border-gray-600 mx-auto mt-0.5 rounded-sm flex items-center justify-center">
                                <span className="text-[4px] text-white/50">u-blox</span>
                            </div>
                            {/* Fix LED */}
                            <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_5px_green] animate-pulse' : 'bg-red-900'}`}></div>
                        </div>
                        <div className="text-[7px] font-mono text-gray-400 bg-gray-800 px-1 rounded">{lat}°, {lng}°</div>
                    </div>
                );
            }

            case ComponentType.MODULE_RFID: {
                // MFRC522 RFID Reader
                const cardPresent = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-12 bg-[#0066cc] rounded border border-[#0055aa] shadow-md relative p-1">
                            {/* Antenna coil */}
                            <div className="w-10 h-8 border-2 border-yellow-400 rounded mx-auto relative">
                                <div className="absolute inset-1 border border-yellow-400/50 rounded"></div>
                            </div>
                            {/* Chip */}
                            <div className="absolute bottom-1 right-1 w-4 h-3 bg-[#1a1a1a] rounded-sm border border-gray-600"></div>
                            {/* Card animation */}
                            {cardPresent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-5 bg-white rounded shadow-lg border border-gray-300 animate-bounce">
                                    <div className="absolute top-1 left-1 w-3 h-2 bg-yellow-500 rounded-sm"></div>
                                </div>
                            )}
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${cardPresent ? 'bg-green-100 text-green-600' : 'bg-white/90 text-gray-500'}`}>
                            {cardPresent ? 'CARD!' : 'RFID'}
                        </span>
                    </div>
                );
            }

            case ComponentType.MODULE_BLUETOOTH: {
                // HC-05/HC-06 Bluetooth Module
                const connected = stateVal > 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-16 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center p-1 gap-1">
                            {/* Bluetooth symbol */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${connected ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M14.24 12.01l2.32 2.32c.28-.72.44-1.51.44-2.33 0-.82-.16-1.59-.43-2.31l-2.33 2.32zm5.29-5.3l-1.26 1.26c.63 1.21.98 2.57.98 4.02s-.36 2.82-.98 4.02l1.2 1.2c.97-1.54 1.54-3.36 1.54-5.31-.01-1.89-.55-3.67-1.48-5.19zm-3.82 1L10 2H9v7.59L4.41 5 3 6.41 8.59 12 3 17.59 4.41 19 9 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM11 5.83l1.88 1.88L11 9.59V5.83zm1.88 10.46L11 18.17v-3.76l1.88 1.88z" />
                                </svg>
                            </div>
                            {/* Status LED */}
                            <div className={`w-2 h-2 rounded-full transition-all ${connected ? 'bg-blue-500 shadow-[0_0_5px_blue]' : 'bg-red-500 animate-pulse shadow-[0_0_5px_red]'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">HC-05</span>
                    </div>
                );
            }

            case ComponentType.MODULE_RTC: {
                // DS3231 Real Time Clock
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const mins = now.getMinutes().toString().padStart(2, '0');
                const secs = now.getSeconds().toString().padStart(2, '0');
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex items-center justify-center relative">
                            {/* Battery */}
                            <div className="absolute top-1 right-1 w-4 h-3 border border-gray-600 rounded-sm flex items-center justify-center">
                                <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-gray-600"></div>
                                <div className="w-2.5 h-1.5 bg-green-600 rounded-sm"></div>
                            </div>
                            {/* Chip */}
                            <div className="w-8 h-5 bg-gray-800 border border-gray-600 rounded-sm flex items-center justify-center">
                                <span className="text-[4px] text-gray-400">DS3231</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-gray-900 px-1.5 rounded shadow-sm">{hours}:{mins}:{secs}</span>
                    </div>
                );
            }

            case ComponentType.MODULE_FINGERPRINT: {
                // FPM10A Fingerprint Scanner
                const scanActive = isActive && isRunning;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center p-1 gap-1">
                            {/* Scanner window */}
                            <div className={`w-10 h-10 rounded border-2 ${scanActive ? 'border-green-500 bg-green-900/30' : 'border-gray-600 bg-gray-800'} relative overflow-hidden transition-all`}>
                                {/* Fingerprint lines */}
                                <div className="absolute inset-1 opacity-30">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-full h-0.5 bg-white/50 rounded-full my-1" style={{ width: `${60 + i * 5}%`, marginLeft: 'auto', marginRight: 'auto' }}></div>
                                    ))}
                                </div>
                                {/* Scan line */}
                                {scanActive && (
                                    <div className="absolute inset-x-0 h-0.5 bg-green-400 shadow-[0_0_10px_green] animate-pulse" style={{ top: `${(stateVal % 100)}%` }}></div>
                                )}
                            </div>
                            {/* LED */}
                            <div className={`w-1.5 h-1.5 rounded-full ${scanActive ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-red-500'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">FINGER</span>
                    </div>
                );
            }

            case ComponentType.TFT_DISPLAY: {
                // TFT LCD Color Display
                const hue = (stateVal % 360);
                return (
                    <div className={wrapperClass}>
                        <div className="w-24 h-18 bg-[#1a1a1a] rounded border-2 border-gray-700 shadow-lg relative overflow-hidden p-1">
                            {/* Screen */}
                            <div className="w-full h-14 bg-gradient-to-br rounded-sm relative overflow-hidden" style={{ background: isActive ? `linear-gradient(135deg, hsl(${hue}, 70%, 30%), hsl(${(hue + 60) % 360}, 70%, 20%))` : '#111' }}>
                                {isActive && (
                                    <>
                                        <span className="absolute top-1 left-1 text-[7px] text-white font-mono">ArduGen</span>
                                        <div className="absolute bottom-1 left-1 right-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white/60 rounded-full" style={{ width: `${(stateVal / 1023) * 100}%` }}></div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">TFT 1.8"</span>
                    </div>
                );
            }

            case ComponentType.MODULE_GSM: {
                // SIM800L/SIM900 GSM Module
                const signalStrength = Math.floor((stateVal / 1023) * 5);
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-md relative p-1">
                            {/* Chip */}
                            <div className="w-10 h-8 bg-[#2a2a4a] mx-auto rounded border border-gray-600 flex items-center justify-center">
                                <span className="text-[5px] text-white/60">SIM800L</span>
                            </div>
                            {/* SIM card slot */}
                            <div className="absolute bottom-1 left-1 w-6 h-3 bg-yellow-600/50 rounded-sm border border-yellow-700"></div>
                            {/* Signal bars */}
                            <div className="absolute top-1 right-1 flex gap-0.5 items-end">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1 rounded-t-sm ${i <= signalStrength ? 'bg-green-500' : 'bg-gray-700'}`} style={{ height: `${i * 2}px` }}></div>
                                ))}
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">GSM</span>
                    </div>
                );
            }

            case ComponentType.MODULE_LORA: {
                // LoRa Transceiver Module
                const transmitting = isActive && (stateVal % 1000 < 200);
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-[#1a3a1a] rounded border border-green-800 shadow-md relative flex flex-col items-center p-1">
                            {/* Antenna */}
                            <div className="w-1 h-4 bg-gray-400 rounded-full relative">
                                {transmitting && (
                                    <>
                                        <div className="absolute -left-2 top-0 w-2 h-1 border-t-2 border-l-2 border-green-400 rounded-tl-full animate-ping"></div>
                                        <div className="absolute -right-2 top-0 w-2 h-1 border-t-2 border-r-2 border-green-400 rounded-tr-full animate-ping"></div>
                                    </>
                                )}
                            </div>
                            {/* Module body */}
                            <div className="w-8 h-6 bg-[#0a0a0a] border border-gray-600 rounded-sm mt-1 flex items-center justify-center">
                                <span className="text-[4px] text-green-400">LoRa</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LoRa</span>
                    </div>
                );
            }

            case ComponentType.MODULE_ETHERNET:
            case ComponentType.SHIELD_ETHERNET: {
                // Ethernet Shield/Module
                const connected = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-12 bg-[#1a1a3a] rounded border border-blue-800 shadow-md relative p-1 flex items-center gap-1">
                            {/* RJ45 jack */}
                            <div className="w-8 h-8 bg-gray-300 rounded-sm border border-gray-400 relative">
                                <div className="absolute inset-1 bg-[#1a1a1a] rounded-sm"></div>
                                {/* LEDs */}
                                <div className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
                                <div className={`absolute top-0.5 left-0.5 w-1 h-1 rounded-full ${isActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`}></div>
                            </div>
                            {/* Chip */}
                            <div className="flex-1 h-6 bg-[#0a0a0a] border border-gray-600 rounded-sm flex items-center justify-center">
                                <span className="text-[4px] text-blue-400">W5100</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">ETHERNET</span>
                    </div>
                );
            }

            case ComponentType.SHIELD_MOTOR: {
                // Motor Shield
                const m1Speed = stateVal;
                const m2Speed = (stateVal + 500) % 1023;
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-14 bg-[#3a1a1a] rounded border border-red-900 shadow-md relative p-1">
                            {/* Heatsink */}
                            <div className="absolute top-1 right-1 h-8 w-4 flex flex-col gap-[1px]">
                                {[...Array(8)].map((_, i) => <div key={i} className="w-full h-0.5 bg-gray-400"></div>)}
                            </div>
                            {/* Motor outputs */}
                            <div className="flex gap-2 mt-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-5 h-5 rounded border-2 ${m1Speed > 100 ? 'border-green-500 bg-green-900/50' : 'border-gray-600 bg-gray-800'}`}>
                                        <div className="w-full h-full flex items-center justify-center text-[6px] text-white/60">M1</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className={`w-5 h-5 rounded border-2 ${m2Speed > 100 ? 'border-green-500 bg-green-900/50' : 'border-gray-600 bg-gray-800'}`}>
                                        <div className="w-full h-full flex items-center justify-center text-[6px] text-white/60">M2</div>
                                    </div>
                                </div>
                            </div>
                            {/* Label */}
                            <div className="absolute bottom-0.5 left-0.5 text-[5px] text-red-400">L293D</div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">MOTOR SHIELD</span>
                    </div>
                );
            }

            case ComponentType.DC_MOTOR: {
                // DC Motor
                const spinning = stateVal > 100;
                const speed = stateVal / 1023;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-700 rounded-full border-2 border-gray-600 shadow-lg flex items-center justify-center relative">
                            {/* Motor body */}
                            <div className="w-8 h-8 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full border border-gray-400 flex items-center justify-center" style={{ animation: spinning ? `spin ${2 - speed}s linear infinite` : 'none' }}>
                                {/* Shaft */}
                                <div className="w-2 h-2 bg-gray-300 rounded-full border border-gray-400"></div>
                            </div>
                            {/* Terminals */}
                            <div className="absolute -bottom-1 left-2 w-1.5 h-2 bg-red-600 rounded-b-sm"></div>
                            <div className="absolute -bottom-1 right-2 w-1.5 h-2 bg-black rounded-b-sm"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">DC MOTOR</span>
                    </div>
                );
            }

            case ComponentType.TOUCH_SENSOR: {
                // Capacitive Touch Sensor
                const touched = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-10 h-10 rounded-full border-2 shadow-md flex items-center justify-center transition-all cursor-pointer ${touched ? 'bg-cyan-600 border-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-gray-800 border-gray-600'}`}>
                            <div className={`w-5 h-5 rounded-full transition-all ${touched ? 'bg-cyan-300' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">TOUCH</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_FLAME: {
                // Flame Detector
                const flameDetected = stateVal > 700;
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-12 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center p-1">
                            {/* IR detector */}
                            <div className={`w-6 h-6 rounded-full border-2 transition-all ${flameDetected ? 'bg-orange-600 border-orange-500 shadow-[0_0_10px_orange] animate-pulse' : 'bg-gray-800 border-gray-600'}`}></div>
                            {/* LED */}
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${flameDetected ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-gray-700'}`}></div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${flameDetected ? 'bg-orange-100 text-orange-600' : 'bg-white/90 text-gray-500'}`}>
                            {flameDetected ? 'FIRE!' : 'FLAME'}
                        </span>
                    </div>
                );
            }

            case ComponentType.SENSOR_RAIN: {
                // Rain Sensor
                const rainLevel = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#3b82f6" />}
                        <div className="w-10 h-14 bg-[#1a3a3a] rounded border border-cyan-800 shadow-md relative overflow-hidden">
                            {/* Sensor traces */}
                            <div className="absolute inset-1 flex flex-col gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-0.5 w-full bg-yellow-600 rounded-full"></div>
                                ))}
                            </div>
                            {/* Rain drops */}
                            {rainLevel > 30 && (
                                <div className="absolute inset-0 flex justify-around pt-1">
                                    {[...Array(Math.floor(rainLevel / 20))].map((_, i) => (
                                        <div key={i} className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(rainLevel)}%</span>
                    </div>
                );
            }

            case ComponentType.BATTERY: {
                // Battery
                const charge = (stateVal / 1023) * 100;
                const chargeColor = charge > 50 ? 'bg-green-500' : charge > 20 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-8 bg-gray-800 rounded border border-gray-600 shadow-md relative flex items-center p-1">
                            {/* Battery body */}
                            <div className="flex-1 h-full bg-gray-900 rounded-sm overflow-hidden relative">
                                <div className={`absolute inset-y-0 left-0 ${chargeColor} transition-all`} style={{ width: `${charge}%` }}></div>
                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono text-white">{Math.round(charge)}%</span>
                            </div>
                            {/* Terminal */}
                            <div className="w-1.5 h-3 bg-gray-400 rounded-r-sm -mr-0.5"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">Li-Po</span>
                    </div>
                );
            }

            case ComponentType.SOLAR_PANEL: {
                // Solar Panel
                const power = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-12 bg-[#1a1a4a] rounded border border-blue-800 shadow-md relative overflow-hidden">
                            {/* Solar cells grid */}
                            <div className="absolute inset-0.5 grid grid-cols-4 grid-rows-3 gap-[1px]">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`bg-blue-900 rounded-sm ${isActive ? 'bg-blue-700' : ''}`}></div>
                                ))}
                            </div>
                            {/* Power indicator */}
                            {isActive && (
                                <div className="absolute inset-0 bg-yellow-400/20 animate-pulse"></div>
                            )}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(power)}%</span>
                    </div>
                );
            }

            case ComponentType.ESP32_CAM: {
                // ESP32 Camera Module
                const capturing = isActive && (stateVal % 2000 < 100);
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-20 bg-[#1a1a1a] rounded border border-gray-700 shadow-lg relative overflow-hidden">
                            {/* Camera lens */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-900 to-black border border-blue-800">
                                    {capturing && <div className="w-full h-full bg-white/30 rounded-full animate-ping"></div>}
                                </div>
                            </div>
                            {/* Flash LED */}
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${capturing ? 'bg-white shadow-[0_0_10px_white]' : 'bg-gray-700'}`}></div>
                            {/* ESP32 chip */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-gray-800 rounded-sm border border-gray-600 flex items-center justify-center">
                                <span className="text-[4px] text-green-400">ESP32</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">ESP32-CAM</span>
                    </div>
                );
            }

            case ComponentType.THERMAL_CAMERA: {
                // MLX90640 Thermal Imaging Camera
                const heatData = Array(8).fill(0).map((_, i) => Math.floor((stateVal + i * 100) % 256));
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-lg p-1">
                            {/* Thermal grid */}
                            <div className="w-full h-10 grid grid-cols-8 grid-rows-6 gap-0">
                                {[...Array(48)].map((_, i) => {
                                    const temp = (heatData[i % 8] + i * 5) % 256;
                                    const hue = 240 - (temp / 256) * 240; // Blue to red
                                    return <div key={i} style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}></div>;
                                })}
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">THERMAL</span>
                    </div>
                );
            }

            case ComponentType.AI_MODULE: {
                // Edge AI Accelerator (Coral, K210)
                const processing = isActive;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-900 to-indigo-900 rounded border border-purple-700 shadow-lg flex items-center justify-center relative overflow-hidden">
                            {/* Neural network visualization */}
                            <div className="absolute inset-2 flex items-center justify-center">
                                {[...Array(3)].map((_, layer) => (
                                    <div key={layer} className="flex flex-col gap-1 mx-0.5">
                                        {[...Array(3 + layer)].map((_, node) => (
                                            <div key={node} className={`w-1.5 h-1.5 rounded-full ${processing ? 'bg-cyan-400 animate-pulse' : 'bg-purple-600'}`} style={{ animationDelay: `${node * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {/* AI label */}
                            <div className="absolute bottom-0.5 text-[5px] text-white/60 font-bold">AI</div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">EDGE AI</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_AIR_QUALITY: {
                // BME680/CCS811 Air Quality Sensor
                const aqi = Math.round((stateVal / 1023) * 500);
                const aqiColor = aqi < 50 ? 'text-green-500' : aqi < 100 ? 'text-yellow-500' : aqi < 150 ? 'text-orange-500' : 'text-red-500';
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#22c55e" />}
                        <div className="w-12 h-12 bg-[#1a2a1a] rounded border border-green-800 shadow-md flex items-center justify-center relative">
                            <div className="w-8 h-8 bg-[#0a0a0a] rounded-sm border border-gray-600 flex items-center justify-center">
                                <span className="text-[5px] text-green-400">BME680</span>
                            </div>
                            {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 rounded shadow-sm bg-white/90 ${aqiColor}`}>AQI: {aqi}</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_CO2: {
                // MH-Z19 CO2 Sensor
                const co2 = 400 + Math.round((stateVal / 1023) * 1600);
                const co2Color = co2 < 800 ? 'text-green-500' : co2 < 1200 ? 'text-yellow-500' : 'text-red-500';
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-10 bg-[#2a2a1a] rounded border border-yellow-800 shadow-md flex items-center justify-center p-1 gap-1">
                            {/* Sensor chamber */}
                            <div className="w-6 h-6 bg-[#1a1a1a] rounded border border-gray-600 flex items-center justify-center">
                                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-yellow-500/50' : 'bg-gray-700'}`}></div>
                            </div>
                            {/* Value */}
                            <div className="flex flex-col items-center">
                                <span className={`text-[8px] font-mono font-bold ${co2Color}`}>{co2}</span>
                                <span className="text-[5px] text-gray-400">ppm</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">CO2</span>
                    </div>
                );
            }

            case ComponentType.SENSOR_LIDAR:
            case ComponentType.SENSOR_TOF: {
                // LiDAR / Time-of-Flight Sensor
                const distance = Math.round((stateVal / 1023) * 400);
                const scanAngle = (stateVal * 2) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Laser emitter */}
                            <div className="w-4 h-4 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-gray-700'}`}></div>
                            </div>
                            {/* Scanning beam */}
                            {isActive && (
                                <div className="absolute top-2 left-1/2 w-0.5 h-6 bg-red-500/50 origin-top" style={{ transform: `translateX(-50%) rotate(${scanAngle}deg)` }}></div>
                            )}
                            {/* Distance display */}
                            <span className="text-[8px] font-mono text-cyan-400 mt-1">{distance}cm</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{comp.type === ComponentType.SENSOR_LIDAR ? 'LiDAR' : 'ToF'}</span>
                    </div>
                );
            }

            case ComponentType.LOAD_CELL: {
                // HX711 Load Cell / Weight Sensor
                const weight = (stateVal / 1023) * 5; // 0-5kg
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#f59e0b" />}
                        <div className="w-14 h-10 bg-gray-400 rounded border border-gray-500 shadow-md relative flex items-center justify-center">
                            {/* Strain gauge pattern */}
                            <div className="absolute inset-1 flex items-center justify-center">
                                <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
                            </div>
                            {/* Weight display */}
                            <span className="text-[10px] font-mono font-bold text-gray-800 z-10">{weight.toFixed(2)}kg</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LOAD CELL</span>
                    </div>
                );
            }

            case ComponentType.IMU_9DOF: {
                // 9-axis IMU (BNO055)
                const roll = ((stateVal % 180) - 90);
                const pitch = (((stateVal + 60) % 180) - 90);
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-purple-900 rounded border border-purple-700 shadow-md flex items-center justify-center relative">
                            {/* 3D orientation cube */}
                            <div className="w-8 h-8 border-2 border-purple-400 rounded-sm" style={{ transform: `rotateX(${pitch}deg) rotateY(${roll}deg)`, perspective: '100px' }}>
                                <div className="w-full h-full flex items-center justify-center text-[6px] text-purple-300">IMU</div>
                            </div>
                        </div>
                        <div className="text-[7px] font-mono text-gray-400">R:{roll}° P:{pitch}°</div>
                    </div>
                );
            }

            case ComponentType.GESTURE_SENSOR: {
                // APDS-9960 Gesture Sensor
                const gesture = ['↑', '↓', '←', '→', '✋'][Math.floor(stateVal / 200) % 5];
                const detected = stateVal % 1000 < 300;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded border-2 shadow-md flex items-center justify-center transition-all ${detected ? 'bg-cyan-900 border-cyan-500' : 'bg-gray-800 border-gray-600'}`}>
                            <span className={`text-2xl ${detected ? 'text-cyan-300' : 'text-gray-600'}`}>{gesture}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">GESTURE</span>
                    </div>
                );
            }

            case ComponentType.UV_SENSOR: {
                // UV Light Sensor
                const uvIndex = Math.round((stateVal / 1023) * 11);
                const uvColor = uvIndex <= 2 ? 'text-green-500' : uvIndex <= 5 ? 'text-yellow-500' : uvIndex <= 7 ? 'text-orange-500' : uvIndex <= 10 ? 'text-red-500' : 'text-purple-500';
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-12 bg-[#2a1a3a] rounded border border-purple-800 shadow-md flex flex-col items-center justify-center">
                            <div className={`w-5 h-5 rounded-full border-2 ${uvIndex > 5 ? 'border-yellow-400 bg-yellow-500/30' : 'border-gray-600 bg-gray-800'}`}></div>
                            <span className={`text-[10px] font-mono font-bold mt-1 ${uvColor}`}>{uvIndex}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">UV</span>
                    </div>
                );
            }

            case ComponentType.ENCODER_MOTOR: {
                // DC Motor with Encoder
                const rpm = Math.round((stateVal / 1023) * 3000);
                const rotation = (stateVal * 5) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-gray-700 rounded border border-gray-600 shadow-lg flex items-center relative">
                            {/* Motor body */}
                            <div className="w-8 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-l flex items-center justify-center">
                                <div className="w-4 h-4 bg-gray-500 rounded-full border border-gray-400" style={{ transform: `rotate(${rotation}deg)` }}>
                                    <div className="w-1 h-2 bg-gray-300 mx-auto"></div>
                                </div>
                            </div>
                            {/* Encoder disc */}
                            <div className="w-6 h-8 bg-[#1a1a1a] rounded-r border-l border-gray-600 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border-2 border-dashed border-yellow-500" style={{ transform: `rotate(${rotation}deg)` }}></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-gray-900 px-1 rounded">{rpm} RPM</span>
                    </div>
                );
            }

            // ========== 50 NEW COMPONENT RENDERERS ==========

            case ComponentType.SOLENOID: {
                // Solenoid Valve/Lock
                const extended = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-gray-700 rounded border border-gray-600 shadow-md flex items-center relative overflow-hidden">
                            {/* Coil */}
                            <div className="w-8 h-8 bg-[#1a1a1a] border border-gray-600 flex items-center justify-center">
                                {[...Array(4)].map((_, i) => <div key={i} className="w-6 h-0.5 bg-amber-600 my-0.5"></div>)}
                            </div>
                            {/* Plunger */}
                            <div className={`w-4 h-4 bg-gray-400 rounded-sm transition-transform ${extended ? 'translate-x-2' : ''}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">SOLENOID</span>
                    </div>
                );
            }

            case ComponentType.PUMP: {
                // Water/Liquid Pump
                const running = stateVal > 100;
                const rotation = (stateVal * 3) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-blue-900 rounded-full border-2 border-blue-700 shadow-lg flex items-center justify-center relative">
                            {/* Impeller */}
                            <div className="w-6 h-6 rounded-full border border-blue-500" style={{ transform: `rotate(${rotation}deg)` }}>
                                {[0, 120, 240].map(angle => (
                                    <div key={angle} className="absolute w-1 h-3 bg-blue-400 rounded-full origin-bottom left-1/2 -ml-0.5" style={{ transform: `rotate(${angle}deg) translateY(-100%)` }}></div>
                                ))}
                            </div>
                            {running && <div className="absolute inset-0 border-2 border-blue-400 rounded-full animate-ping opacity-30"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">PUMP</span>
                    </div>
                );
            }

            case ComponentType.FAN: {
                // Cooling Fan
                const spinning = stateVal > 100;
                const rotation = (stateVal * 5) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-800 rounded border border-gray-600 shadow-lg flex items-center justify-center">
                            <div className={`w-10 h-10 transition-all ${spinning ? '' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
                                {[0, 72, 144, 216, 288].map(angle => (
                                    <div key={angle} className="absolute w-1.5 h-4 bg-gray-400 rounded-full origin-bottom left-1/2 top-1/2 -ml-0.75 -mt-2" style={{ transform: `rotate(${angle}deg) translateY(-100%)` }}></div>
                                ))}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">FAN</span>
                    </div>
                );
            }

            case ComponentType.HEATER: {
                // Heating Element
                const temp = (stateVal / 1023) * 100;
                const hue = 60 - (temp / 100) * 60; // Yellow to red
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-[#2a1a1a] rounded border border-red-900 shadow-md flex items-center justify-center p-1 gap-0.5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-6 w-1.5 rounded-full transition-all" style={{ backgroundColor: temp > 20 ? `hsl(${hue}, 100%, ${30 + temp / 2}%)` : '#333', boxShadow: temp > 50 ? `0 0 ${temp / 10}px hsl(${hue}, 100%, 50%)` : 'none' }}></div>
                            ))}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(temp)}°C</span>
                    </div>
                );
            }

            case ComponentType.LINEAR_ACTUATOR: {
                // Linear Motion Actuator
                const position = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-8 bg-gray-700 rounded border border-gray-600 shadow-md relative flex items-center p-1">
                            {/* Body */}
                            <div className="w-8 h-6 bg-gray-800 rounded-sm"></div>
                            {/* Extending rod */}
                            <div className="h-2 bg-gray-400 rounded-r" style={{ width: `${20 + position * 0.4}px` }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(position)}%</span>
                    </div>
                );
            }

            case ComponentType.ELECTROMAGNET: {
                // Magnetic Actuator
                const magnetOn = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded-full border-4 shadow-lg flex items-center justify-center transition-all ${magnetOn ? 'bg-blue-900 border-blue-500 shadow-[0_0_15px_blue]' : 'bg-gray-800 border-gray-600'}`}>
                            <span className="text-white text-lg font-bold">{magnetOn ? 'N' : '○'}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">MAGNET</span>
                    </div>
                );
            }

            case ComponentType.PELTIER: {
                // Thermoelectric Cooler
                const cooling = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 rounded border border-gray-600 shadow-md flex overflow-hidden">
                            <div className={`w-1/2 h-full flex items-center justify-center ${cooling ? 'bg-blue-600' : 'bg-blue-900'}`}>
                                <span className="text-xs text-white">C</span>
                            </div>
                            <div className={`w-1/2 h-full flex items-center justify-center ${cooling ? 'bg-red-600' : 'bg-red-900'}`}>
                                <span className="text-xs text-white">H</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">PELTIER</span>
                    </div>
                );
            }

            case ComponentType.AIR_COMPRESSOR: {
                // Pneumatic Compressor
                const running = stateVal > 100;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-12 bg-gray-700 rounded border border-gray-600 shadow-md flex flex-col items-center justify-center ${running ? 'animate-pulse' : ''}`}>
                            <div className="w-8 h-6 bg-[#1a1a1a] rounded border border-gray-600"></div>
                            {running && <div className="absolute -top-2 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">AIR</span>
                    </div>
                );
            }

            case ComponentType.LASER_MODULE: {
                // Laser Diode
                const laserOn = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-14 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center relative">
                            <div className={`w-4 h-4 rounded-full ${laserOn ? 'bg-red-600 shadow-[0_0_20px_red]' : 'bg-gray-700'}`}></div>
                            {laserOn && <div className="absolute -top-8 w-0.5 h-8 bg-red-500 opacity-70"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LASER</span>
                    </div>
                );
            }

            case ComponentType.ALARM_SIREN: {
                // Alarm Horn/Siren
                const alarming = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded-full border-4 shadow-lg flex items-center justify-center ${alarming ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-gray-800 border-gray-600'}`}>
                            <span className="text-2xl">{alarming ? '🔔' : '🔕'}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${alarming ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white/90 text-gray-500'}`}>ALARM</span>
                    </div>
                );
            }

            case ComponentType.MAGNETIC_LOCK:
            case ComponentType.FOG_MACHINE: {
                // Generic actuator with on/off
                const active = stateVal > 500;
                const label = comp.type === ComponentType.MAGNETIC_LOCK ? 'MAG LOCK' : 'FOG';
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-10 rounded border shadow-md flex items-center justify-center transition-all ${active ? 'bg-green-900 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                            <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{label}</span>
                    </div>
                );
            }

            case ComponentType.LED_STRIP: {
                // WS2812B RGB LED Strip
                const offset = Math.floor(stateVal / 50) % 8;
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-6 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex items-center justify-around p-1">
                            {[...Array(8)].map((_, i) => {
                                const hue = ((i + offset) * 45) % 360;
                                return <div key={i} className="w-2 h-4 rounded-sm" style={{ backgroundColor: isActive ? `hsl(${hue}, 100%, 50%)` : '#333', boxShadow: isActive ? `0 0 5px hsl(${hue}, 100%, 50%)` : 'none' }}></div>;
                            })}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LED STRIP</span>
                    </div>
                );
            }

            case ComponentType.LED_RING: {
                // NeoPixel Ring
                const offset = Math.floor(stateVal / 30) % 12;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-gray-700 shadow-md relative">
                            {[...Array(12)].map((_, i) => {
                                const angle = i * 30;
                                const hue = ((i + offset) * 30) % 360;
                                return (
                                    <div key={i} className="absolute w-2 h-2 rounded-full" style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-22px)`, backgroundColor: isActive ? `hsl(${hue}, 100%, 50%)` : '#333', boxShadow: isActive ? `0 0 4px hsl(${hue}, 100%, 50%)` : 'none' }}></div>
                                );
                            })}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">LED RING</span>
                    </div>
                );
            }

            case ComponentType.LED_BAR: {
                // LED Bar Graph
                const level = Math.floor((stateVal / 1023) * 10);
                return (
                    <div className={wrapperClass}>
                        <div className="w-6 h-16 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col-reverse gap-0.5 p-1">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-full h-1.5 rounded-sm transition-all ${i < level ? (i < 3 ? 'bg-green-500' : i < 7 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-700'}`} style={{ boxShadow: i < level ? '0 0 3px currentColor' : 'none' }}></div>
                            ))}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">BAR</span>
                    </div>
                );
            }

            case ComponentType.LED_FILAMENT:
            case ComponentType.LASER_CROSSHAIR: {
                // Simple LED/Laser indicator
                const on = stateVal > 500;
                const color = comp.type === ComponentType.LASER_CROSSHAIR ? 'red' : 'orange';
                return (
                    <div className={wrapperClass}>
                        <div className={`w-8 h-12 bg-gray-800 rounded border border-gray-600 shadow-md flex items-center justify-center`}>
                            <div className={`w-1 h-8 rounded-full transition-all ${on ? `bg-${color}-500 shadow-[0_0_10px_${color}]` : 'bg-gray-700'}`} style={{ backgroundColor: on ? color : '#333', boxShadow: on ? `0 0 10px ${color}` : 'none' }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{comp.type === ComponentType.LASER_CROSSHAIR ? 'LASER' : 'BULB'}</span>
                    </div>
                );
            }

            case ComponentType.FLEX_SENSOR: {
                // Flex/Bend Sensor
                const bend = (stateVal / 1023) * 45;
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#8b5cf6" />}
                        <div className="w-6 h-16 bg-gray-700 rounded-full border border-gray-600 shadow-md relative overflow-hidden" style={{ transform: `rotate(${bend}deg)` }}>
                            <div className="absolute inset-1 bg-gray-500 rounded-full"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(bend)}°</span>
                    </div>
                );
            }

            case ComponentType.FORCE_SENSOR: {
                // FSR Force Sensitive Resistor
                const force = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#ec4899" />}
                        <div className="w-10 h-10 bg-gray-800 rounded-full border-2 border-gray-600 shadow-md flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full transition-all" style={{ backgroundColor: `rgba(236, 72, 153, ${force / 100})`, boxShadow: force > 50 ? `0 0 ${force / 5}px rgb(236, 72, 153)` : 'none' }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(force)}%</span>
                    </div>
                );
            }

            case ComponentType.THERMISTOR: {
                // NTC/PTC Thermistor
                const temp = -20 + (stateVal / 1023) * 120;
                const color = temp < 20 ? 'blue' : temp < 40 ? 'green' : temp < 60 ? 'yellow' : 'red';
                return (
                    <div className={wrapperClass}>
                        <div className="w-8 h-10 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex items-center justify-center">
                            <div className={`w-4 h-6 rounded bg-${color}-600`} style={{ backgroundColor: color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'yellow' ? '#ca8a04' : '#dc2626' }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(temp)}°C</span>
                    </div>
                );
            }

            case ComponentType.HALL_SENSOR:
            case ComponentType.MAGNETIC_SENSOR: {
                // Hall Effect / Reed Switch
                const detected = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-10 h-10 rounded border-2 shadow-md flex items-center justify-center transition-all ${detected ? 'bg-blue-900 border-blue-500' : 'bg-gray-800 border-gray-600'}`}>
                            <span className="text-lg">{detected ? '🧲' : '○'}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${detected ? 'bg-blue-100 text-blue-600' : 'bg-white/90 text-gray-500'}`}>HALL</span>
                    </div>
                );
            }

            case ComponentType.ENCODER_OPTICAL: {
                // Optical Encoder
                const pulses = Math.floor(stateVal / 10);
                const rotation = (stateVal * 2) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-800 rounded-full border border-gray-600 shadow-md flex items-center justify-center relative">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-yellow-500 flex items-center justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                                <div className="w-2 h-4 bg-yellow-500/50"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{pulses}p</span>
                    </div>
                );
            }

            case ComponentType.PROXIMITY_SENSOR:
            case ComponentType.LASER_SENSOR: {
                // Proximity / Laser Break Beam
                const detected = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-10 h-12 rounded border-2 shadow-md flex flex-col items-center justify-center gap-1 transition-all ${detected ? 'bg-red-900 border-red-500' : 'bg-gray-800 border-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full ${detected ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-gray-600'}`}></div>
                            <div className="w-6 h-0.5 bg-gray-500"></div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${detected ? 'bg-red-100 text-red-600' : 'bg-white/90 text-gray-500'}`}>PROX</span>
                    </div>
                );
            }

            case ComponentType.BARCODE_SCANNER: {
                // Barcode/QR Reader
                const scanning = isActive && (stateVal % 500 < 100);
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex flex-col items-center justify-center gap-1 p-1">
                            <div className="w-10 h-6 bg-white flex items-center justify-center gap-px p-0.5">
                                {[2, 1, 3, 1, 2, 1, 1, 2].map((w, i) => <div key={i} className="h-full bg-black" style={{ width: `${w}px` }}></div>)}
                            </div>
                            {scanning && <div className="w-10 h-0.5 bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">SCAN</span>
                    </div>
                );
            }

            case ComponentType.TDS_SENSOR:
            case ComponentType.TURBIDITY_SENSOR: {
                // Water Quality Sensors
                const value = Math.round((stateVal / 1023) * 500);
                const label = comp.type === ComponentType.TDS_SENSOR ? 'TDS' : 'TURB';
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color="#06b6d4" />}
                        <div className="w-8 h-14 bg-cyan-900/50 rounded-b-lg border border-cyan-700 shadow-md relative overflow-hidden">
                            <div className="absolute top-0 w-full h-2 bg-gray-700 rounded-t"></div>
                            <div className="absolute bottom-0 w-full bg-cyan-500/30" style={{ height: `${(stateVal / 1023) * 80}%` }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{label}: {value}</span>
                    </div>
                );
            }

            case ComponentType.FLOW_SENSOR: {
                // Water/Gas Flow Meter
                const flow = (stateVal / 1023) * 30;
                const rotation = (stateVal * 10) % 360;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-10 bg-blue-900 rounded border border-blue-700 shadow-md flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full border border-blue-500 flex items-center justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                                <div className="w-1 h-3 bg-blue-400"></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{flow.toFixed(1)}L/m</span>
                    </div>
                );
            }

            case ComponentType.LEVEL_SENSOR: {
                // Float/Level Sensor
                const level = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        <div className="w-8 h-16 bg-gray-800 rounded border border-gray-600 shadow-md relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-blue-500/50 transition-all" style={{ height: `${level}%` }}></div>
                            <div className="absolute w-6 h-2 bg-orange-500 rounded left-1/2 -translate-x-1/2 transition-all" style={{ bottom: `${level}%` }}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(level)}%</span>
                    </div>
                );
            }

            case ComponentType.LOAD_SENSOR:
            case ComponentType.SHOCK_SENSOR: {
                // Strain Gauge / Impact Detector
                const value = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-8 bg-gray-700 rounded border shadow-md flex items-center justify-center ${value > 80 ? 'border-red-500 bg-red-900/50' : 'border-gray-600'}`}>
                            <div className="w-8 h-1 bg-gray-500 rounded relative">
                                <div className="absolute h-2 w-0.5 bg-gray-400 left-1/2 -translate-x-1/2 -top-0.5" style={{ transform: `translateX(-50%) rotate(${(value - 50) / 2}deg)` }}></div>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{Math.round(value)}%</span>
                    </div>
                );
            }

            case ComponentType.ALCOHOL_SENSOR:
            case ComponentType.SMOKE_SENSOR: {
                // MQ-3/MQ-2 Gas Sensors
                const level = (stateVal / 1023) * 100;
                const label = comp.type === ComponentType.ALCOHOL_SENSOR ? 'ALCO' : 'SMOKE';
                const danger = level > 60;
                return (
                    <div className={wrapperClass}>
                        {isRunning && <Sparkline data={history} max={1023} color={danger ? '#ef4444' : '#22c55e'} />}
                        <div className={`w-10 h-12 rounded border shadow-md flex flex-col items-center justify-center transition-all ${danger ? 'bg-red-900 border-red-500' : 'bg-gray-800 border-gray-600'}`}>
                            <div className="w-6 h-6 bg-gray-700 rounded-full border border-gray-500 flex items-center justify-center">
                                <div className="w-3 h-3 bg-gray-600 rounded mesh"></div>
                            </div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${danger ? 'bg-red-100 text-red-600' : 'bg-white/90 text-gray-500'}`}>{label}</span>
                    </div>
                );
            }

            case ComponentType.ZIGBEE:
            case ComponentType.ZWAVE:
            case ComponentType.THREAD: {
                // Smart Home Wireless Modules
                const connected = stateVal > 300;
                const label = comp.type === ComponentType.ZIGBEE ? 'ZIGBEE' : comp.type === ComponentType.ZWAVE ? 'Z-WAVE' : 'THREAD';
                const color = comp.type === ComponentType.ZIGBEE ? 'green' : comp.type === ComponentType.ZWAVE ? 'blue' : 'purple';
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-14 rounded border shadow-md flex flex-col items-center justify-center gap-1 p-1 ${connected ? `bg-${color}-900 border-${color}-500` : 'bg-gray-800 border-gray-600'}`} style={{ borderColor: connected ? (color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#a855f7') : '#4b5563' }}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${connected ? 'animate-pulse' : ''}`} style={{ backgroundColor: connected ? (color === 'green' ? '#166534' : color === 'blue' ? '#1e40af' : '#581c87') : '#374151' }}>
                                <span className="text-xs text-white">📡</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-500 bg-white/90 px-1 rounded shadow-sm">{label}</span>
                    </div>
                );
            }

            case ComponentType.RS485:
            case ComponentType.RS232: {
                // Serial Communication
                const active = stateVal > 0;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-8 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex items-center justify-center gap-1 p-1 ${active ? 'animate-pulse' : ''}`}>
                            <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                            <span className="text-[6px] text-gray-400">TX/RX</span>
                            <div className={`w-2 h-2 rounded-full ${active ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{comp.type === ComponentType.RS485 ? 'RS485' : 'RS232'}</span>
                    </div>
                );
            }

            case ComponentType.I2S_AUDIO:
            case ComponentType.DAC_AUDIO: {
                // Audio Modules
                const level = (stateVal / 1023) * 100;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-[#1a1a1a] rounded border border-gray-700 shadow-md flex items-center justify-center gap-0.5 p-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1.5 bg-green-500 rounded-t" style={{ height: `${Math.random() * level}%`, transition: 'height 0.1s' }}></div>
                            ))}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">AUDIO</span>
                    </div>
                );
            }

            case ComponentType.VOICE_MODULE: {
                // Voice Recognition
                const listening = isActive && (stateVal % 1000 < 500);
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded-full border-2 shadow-md flex items-center justify-center transition-all ${listening ? 'bg-blue-900 border-blue-500 shadow-[0_0_10px_blue]' : 'bg-gray-800 border-gray-600'}`}>
                            <span className="text-2xl">{listening ? '🎤' : '🎙️'}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${listening ? 'bg-blue-100 text-blue-600' : 'bg-white/90 text-gray-500'}`}>VOICE</span>
                    </div>
                );
            }

            case ComponentType.VFD_DISPLAY: {
                // Vacuum Fluorescent Display
                const text = isRunning ? stateVal.toString().padStart(4, '0') : '----';
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-10 bg-[#0a0a0a] rounded border border-gray-800 shadow-lg flex items-center justify-center">
                            <span className="text-sm font-mono text-cyan-400" style={{ textShadow: '0 0 5px cyan' }}>{text}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">VFD</span>
                    </div>
                );
            }

            case ComponentType.NIXIE_TUBE: {
                // Retro Nixie Tube Display
                const digit = Math.floor((stateVal / 1023) * 10);
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-14 bg-[#1a1a0a] rounded border border-orange-900 shadow-lg flex items-center justify-center relative">
                            <span className="text-2xl font-mono text-orange-500" style={{ textShadow: '0 0 10px orange, 0 0 20px orange' }}>{digit}</span>
                            <div className="absolute inset-0 bg-orange-500/5 rounded"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">NIXIE</span>
                    </div>
                );
            }

            case ComponentType.HUD_DISPLAY:
            case ComponentType.MATRIX_PANEL: {
                // Heads-Up / LED Matrix Panel
                return (
                    <div className={wrapperClass}>
                        <div className="w-18 h-12 bg-[#0a0a0a] rounded border border-green-900 shadow-lg p-1">
                            <div className="w-full h-full grid grid-cols-8 grid-rows-4 gap-px">
                                {[...Array(32)].map((_, i) => {
                                    const lit = (Math.floor(stateVal / 50) + i) % 4 === 0;
                                    return <div key={i} className={`rounded-sm ${lit ? 'bg-green-500' : 'bg-green-900/30'}`}></div>;
                                })}
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">MATRIX</span>
                    </div>
                );
            }

            case ComponentType.SEGMENT_DISPLAY: {
                // Multi-digit 7-Segment
                const num = Math.floor((stateVal / 1023) * 9999);
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-10 bg-[#0a0a0a] rounded border border-gray-800 shadow-lg flex items-center justify-center">
                            <span className="text-lg font-mono text-red-500" style={{ textShadow: '0 0 5px red' }}>{num.toString().padStart(4, '0')}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">7-SEG</span>
                    </div>
                );
            }

            case ComponentType.PLC_MODULE: {
                // PLC Expansion
                const status = stateVal > 0 ? 'RUN' : 'STOP';
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-[#1a3a1a] rounded border border-green-800 shadow-md flex flex-col items-center justify-center gap-1 p-1">
                            <div className="flex gap-1">
                                {[...Array(4)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${(stateVal >> i) & 1 ? 'bg-green-500' : 'bg-gray-700'}`}></div>)}
                            </div>
                            <span className="text-[6px] text-green-400">{status}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">PLC</span>
                    </div>
                );
            }

            case ComponentType.SSR_RELAY: {
                // Solid State Relay
                const on = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-10 rounded border-2 shadow-md flex items-center justify-center transition-all ${on ? 'bg-blue-900 border-blue-500' : 'bg-gray-800 border-gray-600'}`}>
                            <span className="text-xs text-white font-mono">{on ? 'ON' : 'OFF'}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">SSR</span>
                    </div>
                );
            }

            case ComponentType.CONTACTOR:
            case ComponentType.CIRCUIT_BREAKER: {
                // High Power Switch
                const closed = stateVal > 500;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-12 rounded border-2 shadow-md flex flex-col items-center justify-center transition-all ${closed ? 'bg-green-900 border-green-500' : 'bg-red-900 border-red-500'}`}>
                            <div className={`w-6 h-1 bg-gray-400 transition-transform ${closed ? '' : 'rotate-45'}`}></div>
                            <div className="w-6 h-1 bg-gray-400 mt-1"></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">{closed ? 'CLOSED' : 'OPEN'}</span>
                    </div>
                );
            }

            case ComponentType.FUSE: {
                // Fuse Holder
                const blown = stateVal < 100;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-6 rounded border shadow-md flex items-center justify-center ${blown ? 'bg-red-900 border-red-700' : 'bg-gray-700 border-gray-500'}`}>
                            <div className={`w-8 h-1 ${blown ? 'bg-transparent border-t border-dashed border-red-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 rounded shadow-sm ${blown ? 'bg-red-100 text-red-600' : 'bg-white/90 text-gray-500'}`}>{blown ? 'BLOWN' : 'FUSE'}</span>
                    </div>
                );
            }

            case ComponentType.TERMINAL_BLOCK: {
                // Screw Terminal
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-8 bg-green-800 rounded border border-green-700 shadow-md flex items-center justify-around p-1">
                            {[...Array(4)].map((_, i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full border border-gray-500"></div>)}
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm">TERM</span>
                    </div>
                );
            }

            case ComponentType.GENERIC:
                // Refined Universal Fallback
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-[#2d3748] rounded border border-gray-600 shadow-md relative flex flex-col p-1.5 gap-1.5">
                            <div className="w-full h-2 bg-gray-700 rounded-sm"></div>
                            <span className="text-[6px] font-mono text-white/50 uppercase truncate w-full text-center leading-tight">{comp.label}</span>
                            <div className="flex-1 bg-black/30 rounded grid grid-cols-3 gap-0.5 p-0.5 content-center">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="w-full h-1.5 bg-yellow-600/40 rounded-full"></div>
                                ))}
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full self-end transition-colors ${isActive ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-gray-800'}`}></div>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/90 px-1.5 rounded shadow-sm truncate max-w-[60px]">{comp.pin}</span>
                    </div>
                );

            default:
                return renderComponent({ ...comp, type: ComponentType.GENERIC });
        }
    };

    // ===== RASPBERRY PI COMPONENT RENDERER =====
    const renderRPiComponent = (comp: RaspberryPiComponent) => {
        const stateVal = activePinStates[String(comp.pin)] || 0;
        const isActive = stateVal > 0;
        const isPressed = localInteractions[comp.id];
        const wrapperClass = "flex flex-col items-center gap-2 group relative select-none transition-transform duration-200 z-20";

        switch (comp.type) {
            case RaspberryPiComponentType.GPIO_LED: {
                const ledColor = (comp.properties?.color as string) || '#22c55e'; // Default green for RPi
                return (
                    <div className={wrapperClass}>
                        <div className="relative">
                            <div
                                className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${isActive ? 'border-white/50' : 'border-gray-600 brightness-50'}`}
                                style={{
                                    backgroundColor: ledColor,
                                    boxShadow: isActive ? `0 0 20px 8px ${ledColor}, inset 0 -3px 6px rgba(0,0,0,0.3)` : 'none',
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                                }}
                            >
                                <div className="absolute top-1 right-1.5 w-2 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded border border-green-700">GPIO{comp.pin}</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.GPIO_BUTTON:
                return (
                    <div
                        className={`${wrapperClass} cursor-pointer active:scale-95`}
                        onMouseDown={() => toggleInteraction(comp.id, true)}
                        onMouseUp={() => toggleInteraction(comp.id, false)}
                        onMouseLeave={() => toggleInteraction(comp.id, false)}
                    >
                        <div className="w-10 h-10 bg-gray-800 rounded-lg border-2 border-gray-600 shadow-lg flex items-center justify-center">
                            <div className={`w-6 h-6 rounded transition-all duration-100 ${isPressed || isActive ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 'bg-gray-600 hover:bg-gray-500'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">BTN GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.GPIO_BUZZER:
                return (
                    <div className={wrapperClass}>
                        <div className={`w-10 h-10 rounded-full bg-black border-2 border-gray-600 shadow-md flex items-center justify-center relative ${isActive ? 'animate-pulse' : ''}`}>
                            <div className="w-5 h-5 rounded-full bg-gray-700 border border-gray-500"></div>
                            {isActive && (
                                <>
                                    <div className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-50"></div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 text-[6px] text-white bg-orange-500 rounded-full flex items-center justify-center">♪</div>
                                </>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-orange-400 bg-orange-900/50 px-1.5 py-0.5 rounded border border-orange-700">BUZZ GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.DHT_SENSOR: {
                const temp = isActive ? (22 + Math.random() * 3).toFixed(1) : '--';
                const hum = isActive ? (55 + Math.random() * 10).toFixed(0) : '--';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-[#1a365d] rounded-lg border-2 border-blue-700 shadow-lg p-1.5 flex flex-col gap-1">
                            <div className="text-[6px] text-blue-300 font-bold text-center">DHT22</div>
                            <div className="flex-1 bg-black/40 rounded p-1 flex flex-col justify-center">
                                <div className="text-[8px] text-cyan-400 font-mono">{temp}°C</div>
                                <div className="text-[8px] text-blue-400 font-mono">{hum}%</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full self-center ${isActive ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700">DHT GPIO{comp.pin}</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.PIR_SENSOR:
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-300 shadow-lg flex items-center justify-center relative overflow-hidden">
                            <div className={`w-8 h-8 rounded-full ${isActive ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-gray-200 to-gray-400'}`}>
                                <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full opacity-60"></div>
                            </div>
                            {isActive && (
                                <div className="absolute inset-1 rounded-full border-2 border-red-500 animate-ping opacity-40"></div>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">{isActive ? 'MOTION!' : 'PIR'} GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.GPIO_RELAY:
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-10 bg-blue-800 rounded border-2 border-blue-600 shadow-lg flex items-center justify-center gap-1">
                            <div className={`w-3 h-6 rounded ${isActive ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            <div className={`w-3 h-6 rounded ${!isActive ? 'bg-red-400' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-purple-400 bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-700">RELAY GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.PI_CAMERA:
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-green-700 rounded border-2 border-green-900 shadow-lg flex items-center justify-center relative">
                            <div className="w-8 h-8 rounded-full bg-black border-4 border-gray-600 flex items-center justify-center overflow-hidden">
                                <div className="w-4 h-4 rounded-full bg-blue-900 opacity-80 shadow-inner"></div>
                                {isActive && <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>}
                            </div>
                            {isActive && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>}
                        </div>
                        <span className="text-[8px] font-mono text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded border border-green-700">CAMERA CSI</span>
                    </div>
                );

            case RaspberryPiComponentType.SSD1306_OLED:
            case RaspberryPiComponentType.SH1106_OLED: {
                // More realistic OLED with pixel grid simulation
                const temp = isActive ? (22 + Math.random() * 3).toFixed(1) : '--.-';
                return (
                    <div className={wrapperClass}>
                        <div className="w-24 h-14 bg-black rounded-lg border-2 border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex flex-col p-1 relative overflow-hidden">
                            {/* OLED bezel */}
                            <div className="absolute inset-0 border-4 border-gray-800 rounded-lg pointer-events-none"></div>
                            {/* Display area */}
                            <div className="flex-1 rounded overflow-hidden relative" style={{ background: '#000814' }}>
                                {isActive ? (
                                    <div className="w-full h-full flex flex-col justify-center items-center text-center">
                                        <span className="text-[8px] text-cyan-400 font-mono" style={{ textShadow: '0 0 4px cyan' }}>TEMP: {temp}°C</span>
                                        <span className="text-[6px] text-blue-400 font-mono mt-0.5" style={{ textShadow: '0 0 3px blue' }}>128x64 SSD1306</span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[6px] text-gray-700">OFF</span>
                                    </div>
                                )}
                            </div>
                            {/* VCC/GND/SDA/SCL pins */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                                {['V', 'G', 'D', 'C'].map((p, i) => <div key={i} className="w-1 h-2 bg-yellow-600 rounded-b-sm"></div>)}
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700">OLED I2C 0x3C</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.SERVO:
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-8 bg-blue-600 rounded-sm border border-blue-800 shadow-lg relative flex justify-center">
                            <div className={`absolute -top-1 w-10 h-10 border-4 border-white/80 rounded-full transition-transform duration-500 origin-center ${isActive ? 'rotate-90' : 'rotate-0'}`}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-blue-600"></div>
                            </div>
                        </div>
                        <span className="mt-2 text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">SERVO GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.ULTRASONIC: {
                // HC-SR04 with distance reading
                const dist = isActive ? Math.floor(50 + Math.sin(stateVal / 10) * 50 + 100) : '---';
                return (
                    <div className={wrapperClass}>
                        <div className="bg-gradient-to-b from-blue-500 to-blue-700 rounded-lg p-1.5 flex flex-col items-center shadow-lg border border-blue-800">
                            {/* Transducers */}
                            <div className="flex gap-2 mb-1">
                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-4 border-gray-500 shadow-inner flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                                    <div className="w-3 h-3 bg-black rounded-full opacity-20"></div>
                                </div>
                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 border-4 border-gray-500 shadow-inner flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}>
                                    <div className="w-3 h-3 bg-black rounded-full opacity-20"></div>
                                </div>
                            </div>
                            {/* Distance reading */}
                            <div className="text-[9px] text-white font-mono font-bold" style={{ textShadow: '0 0 3px black' }}>{dist} cm</div>
                            {/* Ultrasonic waves animation */}
                            {isActive && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-3 h-3 border-t-2 border-blue-300 rounded-full animate-ping" style={{ animationDelay: `${i * 0.2}s`, opacity: 0.5 }}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">HC-SR04</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.DC_MOTOR:
                return (
                    <div className={wrapperClass}>
                        <div className="w-8 h-12 bg-gray-400 rounded-sm border border-gray-500 shadow-lg relative flex flex-col items-center">
                            <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 rounded-sm"></div>
                            <div className={`absolute -bottom-2 w-10 h-10 border-4 border-black rounded-full transition-transform duration-100 ${isActive ? 'animate-spin' : ''}`} style={{ borderStyle: 'dashed' }}></div>
                        </div>
                        <span className="mt-2 text-[8px] font-mono text-gray-400 bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-700">MOTOR GPIO{comp.pin}</span>
                    </div>
                );

            case RaspberryPiComponentType.LCD_I2C:
                return (
                    <div className={wrapperClass}>
                        <div className="w-32 h-12 bg-blue-600 rounded border-4 border-gray-800 shadow-lg flex items-center justify-center p-2 relative">
                            <div className="w-full h-full bg-[#3b82f6] shadow-inner grid grid-rows-2 gap-1 content-center px-1">
                                {isActive ? (
                                    <>
                                        <div className="bg-blue-800/20 h-3 w-3/4 rounded-sm animate-pulse"></div>
                                        <div className="bg-blue-800/20 h-3 w-1/2 rounded-sm animate-pulse delay-100"></div>
                                    </>
                                ) : (
                                    <div className="text-[8px] text-blue-900/50 text-center font-mono">16x2 LCD</div>
                                )}
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">LCD I2C</span>
                    </div>
                );

            case RaspberryPiComponentType.RGB_LED:
            case RaspberryPiComponentType.WS2812_NEOPIXEL:
                return (
                    <div className={wrapperClass}>
                        <div className="relative">
                            <div
                                className={`w-10 h-10 rounded-full border-2 border-gray-600 ${isActive ? 'animate-pulse' : 'bg-white/10'}`}
                                style={{
                                    background: isActive ? 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444)' : 'rgba(255,255,255,0.1)',
                                    boxShadow: isActive ? '0 0 25px rgba(255,255,255,0.6), inset 0 0 15px rgba(255,255,255,0.3)' : 'none'
                                }}
                            >
                                <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-pink-400 bg-pink-900/50 px-1.5 py-0.5 rounded border border-pink-700">
                            {comp.type === RaspberryPiComponentType.WS2812_NEOPIXEL ? 'NEOPIXEL' : 'RGB LED'}
                        </span>
                    </div>
                );

            // ===== ENVIRONMENTAL SENSORS =====
            case RaspberryPiComponentType.BME280:
            case RaspberryPiComponentType.BME680:
            case RaspberryPiComponentType.BMP280: {
                const temp = isActive ? (22 + Math.random() * 5).toFixed(1) : '--';
                const hum = isActive ? (45 + Math.random() * 20).toFixed(0) : '--';
                const pres = isActive ? (1013 + Math.random() * 10).toFixed(0) : '----';
                const isBME680 = comp.type === RaspberryPiComponentType.BME680;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-16 h-20 rounded-lg border-2 shadow-lg p-1.5 flex flex-col gap-0.5 ${isBME680 ? 'bg-gradient-to-br from-purple-800 to-purple-900 border-purple-600' : 'bg-gradient-to-br from-teal-800 to-teal-900 border-teal-600'}`}>
                            <div className="text-[6px] text-white/80 font-bold text-center">{comp.type.replace('RaspberryPiComponentType.', '')}</div>
                            <div className="flex-1 bg-black/40 rounded p-1 flex flex-col justify-center gap-0.5">
                                <div className="text-[7px] text-cyan-400 font-mono flex justify-between"><span>T</span><span>{temp}°C</span></div>
                                <div className="text-[7px] text-blue-400 font-mono flex justify-between"><span>H</span><span>{hum}%</span></div>
                                <div className="text-[7px] text-green-400 font-mono flex justify-between"><span>P</span><span>{pres}hPa</span></div>
                                {isBME680 && <div className="text-[7px] text-yellow-400 font-mono flex justify-between"><span>IAQ</span><span>{isActive ? Math.floor(50 + Math.random() * 100) : '--'}</span></div>}
                            </div>
                            <div className={`w-2 h-2 rounded-full self-center ${isActive ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-teal-400 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-700">I2C 0x76</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.DS18B20: {
                const temp = isActive ? (20 + Math.random() * 10).toFixed(2) : '--.-';
                return (
                    <div className={wrapperClass}>
                        <div className="w-10 h-14 bg-black rounded-lg border border-gray-700 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border border-gray-500"></div>
                            <div className="text-[8px] text-cyan-400 font-mono mt-1">{temp}°C</div>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700">1-Wire</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.CCS811: {
                const co2 = isActive ? Math.floor(400 + Math.random() * 1000) : '---';
                const tvoc = isActive ? Math.floor(10 + Math.random() * 100) : '--';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg border-2 border-amber-600 shadow-lg p-1.5 flex flex-col gap-0.5">
                            <div className="text-[6px] text-white/80 font-bold text-center">CCS811</div>
                            <div className="flex-1 bg-black/40 rounded p-1 flex flex-col justify-center gap-0.5">
                                <div className="text-[7px] text-green-400 font-mono">CO2: {co2}ppm</div>
                                <div className="text-[7px] text-purple-400 font-mono">TVOC: {tvoc}ppb</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full self-center ${isActive ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-amber-400 bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-700">AIR QUALITY</span>
                    </div>
                );
            }

            // ===== IMU & MOTION SENSORS =====
            case RaspberryPiComponentType.MPU6050:
            case RaspberryPiComponentType.MPU9250:
            case RaspberryPiComponentType.ADXL345: {
                const pitch = isActive ? (Math.random() * 30 - 15).toFixed(0) : '0';
                const roll = isActive ? (Math.random() * 30 - 15).toFixed(0) : '0';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-lg border-2 border-indigo-600 shadow-lg p-1 flex flex-col">
                            <div className="text-[6px] text-white/80 font-bold text-center">{comp.type.includes('9250') ? 'MPU9250' : comp.type.includes('ADXL') ? 'ADXL345' : 'MPU6050'}</div>
                            <div className="flex-1 flex items-center justify-center">
                                <div
                                    className="w-8 h-8 rounded border-2 border-indigo-400 bg-indigo-950 flex items-center justify-center relative"
                                    style={{ transform: isActive ? `rotateX(${pitch}deg) rotateY(${roll}deg)` : 'none', transition: 'transform 0.1s' }}
                                >
                                    <div className="w-4 h-0.5 bg-red-500 absolute"></div>
                                    <div className="w-0.5 h-4 bg-green-500 absolute"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute"></div>
                                </div>
                            </div>
                            <div className="text-[6px] text-indigo-300 font-mono text-center">{pitch}° / {roll}°</div>
                        </div>
                        <span className="text-[8px] font-mono text-indigo-400 bg-indigo-900/50 px-1.5 py-0.5 rounded border border-indigo-700">IMU I2C</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.VL53L0X:
            case RaspberryPiComponentType.VL53L1X: {
                const dist = isActive ? Math.floor(50 + Math.random() * 200) : '---';
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-gradient-to-br from-violet-800 to-violet-900 rounded-lg border-2 border-violet-600 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-violet-400 shadow-[0_0_10px_#a78bfa] animate-ping' : 'bg-gray-600'}`}></div>
                            <div className="text-[8px] text-violet-300 font-mono mt-1">{dist}mm</div>
                        </div>
                        <span className="text-[8px] font-mono text-violet-400 bg-violet-900/50 px-1.5 py-0.5 rounded border border-violet-700">ToF</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.APDS9960: {
                const gesture = isActive ? ['←', '→', '↑', '↓'][Math.floor(Math.random() * 4)] : '○';
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-gradient-to-br from-rose-800 to-rose-900 rounded-lg border-2 border-rose-600 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className={`text-lg ${isActive ? 'text-white animate-bounce' : 'text-gray-500'}`}>{gesture}</div>
                            <div className="text-[6px] text-rose-300 font-mono">GESTURE</div>
                        </div>
                        <span className="text-[8px] font-mono text-rose-400 bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-700">APDS</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.HMC5883L: {
                const heading = isActive ? Math.floor(Math.random() * 360) : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-600 shadow-lg flex items-center justify-center relative">
                            <div className="w-8 h-8 rounded-full border border-gray-500 relative">
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{ transform: `rotate(${heading}deg)`, transition: 'transform 0.3s' }}
                                >
                                    <div className="w-0.5 h-3 bg-red-500 rounded-full absolute -top-0.5"></div>
                                    <div className="w-0.5 h-3 bg-white rounded-full absolute -bottom-0.5"></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">{heading}°</span>
                    </div>
                );
            }

            // ===== COMMUNICATION MODULES =====
            case RaspberryPiComponentType.GPS_MODULE: {
                const lat = isActive ? (17.385 + Math.random() * 0.01).toFixed(4) : '--.-';
                const lon = isActive ? (78.486 + Math.random() * 0.01).toFixed(4) : '--.-';
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-18 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-lg border-2 border-emerald-600 shadow-lg p-1.5 flex flex-col">
                            <div className="text-[6px] text-white/80 font-bold text-center flex items-center justify-center gap-1">
                                <span className={`${isActive ? 'text-green-400' : 'text-gray-500'}`}>📍</span> GPS
                            </div>
                            <div className="flex-1 bg-black/40 rounded p-1 flex flex-col justify-center gap-0.5">
                                <div className="text-[6px] text-green-400 font-mono">LAT: {lat}°</div>
                                <div className="text-[6px] text-blue-400 font-mono">LON: {lon}°</div>
                                <div className="text-[6px] text-gray-400 font-mono">SAT: {isActive ? Math.floor(5 + Math.random() * 8) : 0}</div>
                            </div>
                            <div className={`w-2 h-2 rounded-full self-center ${isActive ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-red-500'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 rounded border border-emerald-700">NEO-6M</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.RFID_RC522:
            case RaspberryPiComponentType.PN532_NFC: {
                const cardPresent = isActive && Math.random() > 0.7;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-14 rounded-lg border-2 shadow-lg flex items-center justify-center relative transition-all ${cardPresent ? 'bg-green-800 border-green-500' : 'bg-gray-800 border-gray-600'}`}>
                            <div className="text-2xl">{comp.type.includes('NFC') ? '📱' : '💳'}</div>
                            {cardPresent && (
                                <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-ping opacity-50"></div>
                            )}
                            {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>}
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">
                            {comp.type.includes('NFC') ? 'NFC' : 'RFID'}
                        </span>
                    </div>
                );
            }

            case RaspberryPiComponentType.NRF24L01:
            case RaspberryPiComponentType.HC12_RADIO: {
                const signalStrength = isActive ? Math.floor(Math.random() * 4) + 1 : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-16 bg-gradient-to-br from-sky-800 to-sky-900 rounded-lg border-2 border-sky-600 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="flex gap-0.5 items-end h-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`w-1 rounded-t ${i <= signalStrength ? 'bg-green-400' : 'bg-gray-600'}`} style={{ height: `${i * 3}px` }}></div>
                                ))}
                            </div>
                            <div className="text-lg mt-1">📡</div>
                        </div>
                        <span className="text-[8px] font-mono text-sky-400 bg-sky-900/50 px-1.5 py-0.5 rounded border border-sky-700">
                            {comp.type.includes('NRF') ? '2.4GHz' : '433MHz'}
                        </span>
                    </div>
                );
            }

            case RaspberryPiComponentType.LORA_SX1276: {
                const rssi = isActive ? -50 - Math.floor(Math.random() * 60) : '---';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-gradient-to-br from-orange-800 to-orange-900 rounded-lg border-2 border-orange-600 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className={`text-lg ${isActive ? 'animate-bounce' : ''}`}>📻</div>
                            <div className="text-[6px] text-orange-300 font-mono">LoRa</div>
                            <div className="text-[7px] text-green-400 font-mono">{rssi}dBm</div>
                        </div>
                        <span className="text-[8px] font-mono text-orange-400 bg-orange-900/50 px-1.5 py-0.5 rounded border border-orange-700">915MHz</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.BLUETOOTH_HC05:
            case RaspberryPiComponentType.ESP_WIFI: {
                const connected = isActive && Math.random() > 0.3;
                const isWifi = comp.type === RaspberryPiComponentType.ESP_WIFI;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-14 rounded-lg border-2 shadow-lg flex flex-col items-center justify-center transition-all ${connected ? (isWifi ? 'bg-blue-700 border-blue-500' : 'bg-blue-800 border-blue-600') : 'bg-gray-800 border-gray-600'}`}>
                            <div className={`text-xl ${connected ? 'animate-pulse' : 'opacity-50'}`}>{isWifi ? '📶' : '🔵'}</div>
                            <div className={`text-[6px] font-mono mt-1 ${connected ? 'text-green-400' : 'text-gray-500'}`}>
                                {connected ? 'LINKED' : 'IDLE'}
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">
                            {isWifi ? 'WiFi' : 'BT'}
                        </span>
                    </div>
                );
            }

            // ===== DISPLAYS =====
            case RaspberryPiComponentType.ST7735_TFT:
            case RaspberryPiComponentType.ILI9341_TFT: {
                const isBig = comp.type === RaspberryPiComponentType.ILI9341_TFT;
                return (
                    <div className={wrapperClass}>
                        <div className={`${isBig ? 'w-24 h-18' : 'w-20 h-14'} bg-black rounded border-4 border-gray-800 shadow-lg flex items-center justify-center overflow-hidden`}>
                            {isActive ? (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">TFT DISPLAY</span>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                    <span className="text-gray-600 text-[6px]">{isBig ? '320x240' : '160x128'}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700">TFT SPI</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.MAX7219_MATRIX: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-16 bg-black rounded border-2 border-gray-700 shadow-lg p-1 grid grid-cols-8 grid-rows-8 gap-px">
                            {Array(64).fill(0).map((_, i) => {
                                const lit = isActive && (Math.floor(stateVal / 10 + i) % 5 === 0 || Math.random() > 0.8);
                                return <div key={i} className={`rounded-full ${lit ? 'bg-red-500 shadow-[0_0_3px_#ef4444]' : 'bg-red-900/30'}`}></div>;
                            })}
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">8x8 LED</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.TM1637_7SEG: {
                const value = isActive ? stateVal.toString().padStart(4, '0').slice(-4) : '----';
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-10 bg-black rounded border-2 border-gray-700 shadow-lg flex items-center justify-center gap-1 px-2">
                            {value.split('').map((digit, i) => (
                                <span key={i} className="text-lg font-mono text-red-500" style={{ textShadow: isActive ? '0 0 8px red' : 'none' }}>{digit}</span>
                            ))}
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">7-SEG</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.E_PAPER: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-24 h-16 bg-gray-100 rounded border-2 border-gray-400 shadow-lg flex items-center justify-center">
                            {isActive ? (
                                <div className="text-gray-800 text-center">
                                    <div className="text-[8px] font-bold">E-Paper</div>
                                    <div className="text-[6px]">Low Power</div>
                                </div>
                            ) : (
                                <div className="text-gray-400 text-[6px]">e-ink display</div>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded border border-gray-400">EPD SPI</span>
                    </div>
                );
            }

            // ===== INPUT DEVICES =====
            case RaspberryPiComponentType.KEYPAD: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-20 bg-gray-800 rounded border-2 border-gray-600 shadow-lg p-1 grid grid-cols-4 grid-rows-4 gap-0.5">
                            {['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'].map((key, i) => (
                                <button key={i} className="text-[6px] text-white bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center font-mono active:bg-gray-500">{key}</button>
                            ))}
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">4x4 KEYPAD</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.ROTARY_ENCODER: {
                const rotation = isActive ? (stateVal * 3) % 360 : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-700 rounded-full border-2 border-gray-500 shadow-lg flex items-center justify-center cursor-pointer">
                            <div
                                className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border border-gray-400 flex items-center justify-center"
                                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s' }}
                            >
                                <div className="w-1 h-3 bg-white rounded-full -mt-1"></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">ENCODER</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.JOYSTICK: {
                const x = isActive ? (Math.random() - 0.5) * 6 : 0;
                const y = isActive ? (Math.random() - 0.5) * 6 : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gray-800 rounded-lg border-2 border-gray-600 shadow-lg flex items-center justify-center">
                            <div className="w-10 h-10 bg-gray-700 rounded-full border border-gray-500 flex items-center justify-center">
                                <div
                                    className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg"
                                    style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 0.1s' }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">JOYSTICK</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.LOAD_CELL_HX711: {
                const weight = isActive ? (stateVal / 10).toFixed(1) : '0.0';
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded border-2 border-amber-600 shadow-lg flex flex-col items-center justify-center">
                            <div className="text-[8px] text-amber-200 font-mono">⚖️ {weight}kg</div>
                        </div>
                        <span className="text-[8px] font-mono text-amber-400 bg-amber-900/50 px-1.5 py-0.5 rounded border border-amber-700">LOAD CELL</span>
                    </div>
                );
            }

            // ===== HATs =====
            case RaspberryPiComponentType.SENSE_HAT: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-20 bg-gradient-to-br from-green-700 to-green-900 rounded-lg border-2 border-green-600 shadow-lg p-1 flex flex-col">
                            <div className="text-[6px] text-white font-bold text-center">SENSE HAT</div>
                            <div className="flex-1 grid grid-cols-8 grid-rows-8 gap-px bg-black/30 rounded">
                                {Array(64).fill(0).map((_, i) => {
                                    const hue = isActive ? (i * 5 + stateVal) % 360 : 0;
                                    return <div key={i} className="rounded-sm" style={{ backgroundColor: isActive ? `hsl(${hue}, 70%, 50%)` : '#1f2937' }}></div>;
                                })}
                            </div>
                            <div className="text-[5px] text-green-300 text-center mt-0.5">LED • GYRO • ACCEL</div>
                        </div>
                        <span className="text-[8px] font-mono text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded border border-green-700">HAT</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.MOTOR_HAT: {
                const motor1 = isActive && stateVal % 3 === 0;
                const motor2 = isActive && stateVal % 3 === 1;
                return (
                    <div className={wrapperClass}>
                        <div className="w-18 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg border-2 border-blue-600 shadow-lg p-1.5 flex flex-col">
                            <div className="text-[6px] text-white font-bold text-center">MOTOR HAT</div>
                            <div className="flex-1 flex items-center justify-around">
                                <div className={`w-5 h-5 rounded-full border-2 ${motor1 ? 'border-green-400 animate-spin' : 'border-gray-500'}`} style={{ borderStyle: 'dashed' }}></div>
                                <div className={`w-5 h-5 rounded-full border-2 ${motor2 ? 'border-green-400 animate-spin' : 'border-gray-500'}`} style={{ borderStyle: 'dashed' }}></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">DC/STEPPER</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.UNICORN_HAT: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-18 h-18 bg-black rounded-lg border-2 border-purple-600 shadow-lg p-1 grid grid-cols-8 grid-rows-8 gap-px">
                            {Array(64).fill(0).map((_, i) => {
                                const hue = isActive ? (i * 10 + stateVal * 5) % 360 : 0;
                                return <div key={i} className="rounded-sm" style={{ backgroundColor: isActive ? `hsl(${hue}, 100%, 50%)` : '#1f2937', boxShadow: isActive ? `0 0 4px hsl(${hue}, 100%, 50%)` : 'none' }}></div>;
                            })}
                        </div>
                        <span className="text-[8px] font-mono text-purple-400 bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-700">🦄 UNICORN</span>
                    </div>
                );
            }

            // ===== POWER & RTC =====
            case RaspberryPiComponentType.RTC_DS3231:
            case RaspberryPiComponentType.RTC_DS1307: {
                const now = new Date();
                const time = isActive ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` : '--:--';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg border-2 border-gray-600 shadow-lg flex flex-col items-center justify-center">
                            <div className="text-[6px] text-gray-400">🕐 RTC</div>
                            <div className="text-[10px] text-green-400 font-mono" style={{ textShadow: isActive ? '0 0 5px #4ade80' : 'none' }}>{time}</div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">I2C</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.INA219:
            case RaspberryPiComponentType.INA226: {
                const voltage = isActive ? (4.8 + Math.random() * 0.4).toFixed(2) : '-.-';
                const current = isActive ? (Math.random() * 500).toFixed(0) : '---';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-lg border-2 border-yellow-600 shadow-lg p-1 flex flex-col justify-center">
                            <div className="text-[6px] text-yellow-300 font-mono">{voltage}V</div>
                            <div className="text-[6px] text-cyan-300 font-mono">{current}mA</div>
                            <div className="text-[5px] text-gray-400 text-center mt-0.5">PWR MON</div>
                        </div>
                        <span className="text-[8px] font-mono text-yellow-400 bg-yellow-900/50 px-1.5 py-0.5 rounded border border-yellow-700">INA</span>
                    </div>
                );
            }

            // ===== CAMERA =====
            case RaspberryPiComponentType.PI_CAMERA_HQ:
            case RaspberryPiComponentType.AMG8833: {
                const isThermal = comp.type === RaspberryPiComponentType.AMG8833;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-14 rounded-lg border-2 shadow-lg flex items-center justify-center relative ${isThermal ? 'bg-gradient-to-br from-red-900 to-orange-900 border-red-600' : 'bg-gradient-to-br from-gray-700 to-gray-900 border-gray-600'}`}>
                            {isThermal ? (
                                <div className="w-10 h-10 grid grid-cols-8 grid-rows-8 gap-px">
                                    {Array(64).fill(0).map((_, i) => {
                                        const temp = isActive ? 20 + Math.random() * 15 : 20;
                                        const hue = Math.max(0, Math.min(60, 60 - (temp - 20) * 3));
                                        return <div key={i} className="rounded-sm" style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}></div>;
                                    })}
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-black border-4 border-gray-600 flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-gray-800 border-2 border-gray-500">
                                        <div className="w-2 h-2 bg-blue-900 rounded-full m-1"></div>
                                    </div>
                                </div>
                            )}
                            {isActive && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">
                            {isThermal ? 'THERMAL' : 'HQ CAM'}
                        </span>
                    </div>
                );
            }

            // ===== ADC & ANALOG =====
            case RaspberryPiComponentType.MCP3008:
            case RaspberryPiComponentType.ADS1115: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-gray-800 rounded border-2 border-gray-600 shadow-lg p-1 flex flex-col">
                            <div className="text-[5px] text-gray-400 text-center">{comp.type.includes('MCP') ? 'MCP3008' : 'ADS1115'}</div>
                            <div className="flex-1 flex items-center justify-center gap-0.5">
                                {[0, 1, 2, 3].map(ch => (
                                    <div key={ch} className="w-2 h-full bg-gray-700 rounded-sm relative overflow-hidden">
                                        <div className="absolute bottom-0 w-full bg-green-500" style={{ height: isActive ? `${30 + Math.random() * 60}%` : '0%', transition: 'height 0.2s' }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded border border-green-700">ADC</span>
                    </div>
                );
            }

            // ===== STEPPER & MOTOR DRIVERS =====
            case RaspberryPiComponentType.L298N:
            case RaspberryPiComponentType.TB6612:
            case RaspberryPiComponentType.PCA9685: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-red-900 rounded border-2 border-red-700 shadow-lg p-1 flex flex-col">
                            <div className="text-[5px] text-white text-center font-bold">{comp.type.includes('L298') ? 'L298N' : comp.type.includes('TB') ? 'TB6612' : 'PCA9685'}</div>
                            <div className="flex-1 flex items-center justify-around">
                                <div className={`w-4 h-4 rounded-full border-2 border-dashed ${isActive ? 'border-green-400 animate-spin' : 'border-gray-500'}`}></div>
                                <div className={`w-4 h-4 rounded-full border-2 border-dashed ${isActive ? 'border-green-400 animate-spin' : 'border-gray-500'}`} style={{ animationDirection: 'reverse' }}></div>
                            </div>
                            <div className="text-[4px] text-red-300 text-center">MOTOR DRIVER</div>
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">H-BRIDGE</span>
                    </div>
                );
            }

            case RaspberryPiComponentType.STEPPER: {
                const angle = isActive ? (stateVal * 1.8) % 360 : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-16 bg-gray-700 rounded border-2 border-gray-500 shadow-lg flex flex-col items-center justify-center">
                            <div className="w-10 h-10 bg-gray-600 rounded-full border-2 border-gray-400 flex items-center justify-center relative">
                                <div
                                    className="w-6 h-1 bg-gray-400 rounded absolute"
                                    style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.1s' }}
                                ></div>
                            </div>
                            <div className="text-[5px] text-gray-400 mt-0.5">STEPPER</div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">{Math.floor(angle)}°</span>
                    </div>
                );
            }

            // ===== RELAY & INDUSTRIAL =====
            case RaspberryPiComponentType.RELAY_MODULE:
            case RaspberryPiComponentType.SSR_RELAY:
            case RaspberryPiComponentType.OPTOCOUPLER: {
                const isOn = isActive && stateVal > 0;
                const isSSR = comp.type === RaspberryPiComponentType.SSR_RELAY;
                return (
                    <div className={wrapperClass}>
                        <div className={`w-14 h-10 rounded border-2 shadow-lg flex items-center justify-center gap-1 transition-all ${isOn ? 'bg-blue-800 border-blue-500' : 'bg-gray-800 border-gray-600'}`}>
                            <div className={`w-3 h-6 rounded ${isOn ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            <div className={`w-3 h-6 rounded ${!isOn ? 'bg-red-400' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-[8px] font-mono text-purple-400 bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-700">
                            {isSSR ? 'SSR' : 'RELAY'}
                        </span>
                    </div>
                );
            }

            // ===== FAN =====
            case RaspberryPiComponentType.FAN:
            case RaspberryPiComponentType.FAN_PWM: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gray-800 rounded-lg border-2 border-gray-600 shadow-lg flex items-center justify-center">
                            <div
                                className={`w-8 h-8 rounded-full border-2 border-gray-500 flex items-center justify-center ${isActive ? 'animate-spin' : ''}`}
                                style={{ animationDuration: '0.3s' }}
                            >
                                <div className="w-6 h-0.5 bg-gray-400 absolute"></div>
                                <div className="w-0.5 h-6 bg-gray-400 absolute"></div>
                                <div className="w-6 h-0.5 bg-gray-400 absolute rotate-45"></div>
                                <div className="w-0.5 h-6 bg-gray-400 absolute rotate-45"></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-cyan-400 bg-cyan-900/50 px-1.5 py-0.5 rounded border border-cyan-700">FAN</span>
                    </div>
                );
            }

            // AI Camera (Sony IMX500)
            case RaspberryPiComponentType.AI_CAMERA: {
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg border-2 border-purple-500 shadow-lg flex flex-col items-center justify-center relative">
                            <div className="w-10 h-10 rounded-lg bg-black border-4 border-gray-600 flex items-center justify-center overflow-hidden">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                                {isActive && <div className="absolute inset-2 rounded-lg border border-green-400 animate-pulse"></div>}
                            </div>
                            <div className="absolute top-1 right-1 text-[5px] text-purple-300 font-bold">AI</div>
                            {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] text-green-400 animate-pulse">DETECTING</div>}
                        </div>
                        <span className="text-[8px] font-mono text-purple-400 bg-purple-900/50 px-1.5 py-0.5 rounded border border-purple-700">IMX500 AI</span>
                    </div>
                );
            }

            // AI HAT (Hailo)
            case RaspberryPiComponentType.AI_HAT_HAILO: {
                const tops = isActive ? '26' : '13';
                return (
                    <div className={wrapperClass}>
                        <div className="w-20 h-12 bg-gradient-to-r from-orange-600 to-red-700 rounded-lg border-2 border-orange-400 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="text-[10px] text-white font-bold">Hailo-8L</div>
                            <div className="flex items-center gap-1 mt-1">
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-gray-500'}`}></div>
                                <span className="text-[8px] text-orange-200">{tops} TOPS</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-orange-400 bg-orange-900/50 px-1.5 py-0.5 rounded border border-orange-700">AI HAT+</span>
                    </div>
                );
            }

            // Camera Module 3
            case RaspberryPiComponentType.CAMERA_MODULE_3:
            case RaspberryPiComponentType.CAMERA_MODULE_3_WIDE:
            case RaspberryPiComponentType.CAMERA_MODULE_3_NOIR: {
                const isNoIR = String(comp.type).includes('NOIR');
                const isWide = String(comp.type).includes('WIDE');
                return (
                    <div className={wrapperClass}>
                        <div className={`w-12 h-12 rounded-lg border-2 shadow-lg flex items-center justify-center relative ${isNoIR ? 'bg-red-900 border-red-700' : 'bg-green-700 border-green-900'}`}>
                            <div className={`w-8 h-8 rounded-full bg-black border-4 border-gray-600 flex items-center justify-center ${isWide ? 'w-9 h-9' : ''}`}>
                                <div className={`rounded-full bg-blue-900 ${isWide ? 'w-5 h-5' : 'w-4 h-4'}`}></div>
                            </div>
                            {isActive && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_red]"></div>}
                            <div className="absolute bottom-0.5 text-[5px] text-white font-bold">12MP</div>
                        </div>
                        <span className="text-[8px] font-mono text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded border border-green-700">
                            CAM3{isWide ? ' W' : ''}{isNoIR ? ' IR' : ''}
                        </span>
                    </div>
                );
            }

            // NVMe HAT
            case RaspberryPiComponentType.NVME_HAT:
            case RaspberryPiComponentType.NVME_HAT_DUAL: {
                const isDual = String(comp.type).includes('DUAL');
                return (
                    <div className={wrapperClass}>
                        <div className="w-24 h-10 bg-gradient-to-r from-gray-700 to-gray-800 rounded border-2 border-gray-500 shadow-lg flex items-center justify-center gap-2 p-1">
                            <div className="w-16 h-6 bg-black rounded-sm flex items-center justify-center relative">
                                <div className={`absolute left-1 w-1.5 h-4 rounded-sm ${isActive ? 'bg-green-400 shadow-[0_0_4px_#4ade80]' : 'bg-gray-600'}`}></div>
                                <span className="text-[6px] text-blue-400 font-mono">NVMe</span>
                            </div>
                            {isDual && (
                                <div className="w-16 h-6 bg-black rounded-sm flex items-center justify-center relative">
                                    <div className={`absolute left-1 w-1.5 h-4 rounded-sm ${isActive ? 'bg-blue-400 shadow-[0_0_4px_#60a5fa]' : 'bg-gray-600'}`}></div>
                                    <span className="text-[6px] text-blue-400 font-mono">NVMe</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">M.2 HAT{isDual ? ' x2' : ''}</span>
                    </div>
                );
            }

            // CO2 Sensors
            case RaspberryPiComponentType.SCD30:
            case RaspberryPiComponentType.SCD40: {
                const co2 = isActive ? Math.floor(400 + stateVal * 10) : '---';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-lg border-2 border-teal-500 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="text-[6px] text-teal-200">CO₂</div>
                            <div className="text-[10px] text-white font-mono font-bold">{co2}</div>
                            <div className="text-[5px] text-teal-300">ppm</div>
                        </div>
                        <span className="text-[8px] font-mono text-teal-400 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-700">SCD{String(comp.type).includes('40') ? '40' : '30'}</span>
                    </div>
                );
            }

            // PM2.5 Air Quality
            case RaspberryPiComponentType.PMS5003:
            case RaspberryPiComponentType.PMSA003I: {
                const pm = isActive ? Math.floor(10 + stateVal % 50) : 0;
                const pmDisplay = isActive ? pm : '--';
                const quality = isActive ? (pm < 25 ? 'Good' : pm < 50 ? 'Fair' : 'Poor') : '';
                const qColor = quality === 'Good' ? 'text-green-400' : quality === 'Fair' ? 'text-yellow-400' : 'text-red-400';
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg border-2 border-gray-500 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="text-[6px] text-gray-300">PM2.5</div>
                            <div className="text-[12px] text-white font-mono font-bold">{pmDisplay}</div>
                            <div className={`text-[6px] ${qColor}`}>{isActive ? quality : ''}</div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">PM2.5</span>
                    </div>
                );
            }

            // Rain Gauge
            case RaspberryPiComponentType.RAIN_GAUGE: {
                const rain = isActive ? (stateVal % 10 * 0.2).toFixed(1) : '0.0';
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-gradient-to-b from-blue-400 to-blue-700 rounded-lg border-2 border-blue-500 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-blue-300" style={{ height: `${Math.min(Number(rain) * 10, 100)}%`, transition: 'height 0.5s' }}></div>
                            <div className="text-[10px] text-white font-bold z-10">{rain}</div>
                            <div className="text-[6px] text-blue-200 z-10">mm</div>
                        </div>
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700">RAIN</span>
                    </div>
                );
            }

            // Anemometer (Wind Speed)
            case RaspberryPiComponentType.ANEMOMETER: {
                const windSpeed = isActive ? Math.floor(stateVal % 30) : 0;
                return (
                    <div className={wrapperClass}>
                        <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-700 rounded-full border-2 border-sky-400 shadow-lg flex items-center justify-center relative">
                            <div className={`w-10 h-10 flex items-center justify-center ${isActive ? 'animate-spin' : ''}`} style={{ animationDuration: `${Math.max(0.2, 3 - windSpeed / 10)}s` }}>
                                {[0, 120, 240].map(deg => (
                                    <div key={deg} className="absolute w-1 h-5 bg-white rounded-full" style={{ transform: `rotate(${deg}deg) translateY(-8px)` }}></div>
                                ))}
                            </div>
                            <div className="absolute bottom-1 text-[8px] text-white font-bold">{windSpeed}</div>
                        </div>
                        <span className="text-[8px] font-mono text-sky-400 bg-sky-900/50 px-1.5 py-0.5 rounded border border-sky-700">{windSpeed} km/h</span>
                    </div>
                );
            }

            // Wind Vane
            case RaspberryPiComponentType.WIND_VANE: {
                const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                const dirIdx = isActive ? stateVal % 8 : 0;
                const rotation = dirIdx * 45;
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full border-2 border-gray-400 shadow-lg flex items-center justify-center relative">
                            <div className="absolute w-full h-full flex items-center justify-center text-[6px] text-gray-300">
                                <span className="absolute top-0.5">N</span>
                                <span className="absolute bottom-0.5">S</span>
                                <span className="absolute left-1">W</span>
                                <span className="absolute right-1">E</span>
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center transition-transform duration-500" style={{ transform: `rotate(${rotation}deg)` }}>
                                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">WIND {directions[dirIdx]}</span>
                    </div>
                );
            }

            // Heart Rate / Pulse Oximeter
            case RaspberryPiComponentType.HEART_RATE:
            case RaspberryPiComponentType.PULSE_OXIMETER: {
                const bpm = isActive ? 60 + (stateVal % 40) : '--';
                const spo2 = isActive ? 95 + (stateVal % 5) : '--';
                const isPulseOx = String(comp.type).includes('OXIMETER');
                return (
                    <div className={wrapperClass}>
                        <div className="w-16 h-14 bg-gradient-to-br from-red-600 to-pink-700 rounded-lg border-2 border-red-400 shadow-lg flex flex-col items-center justify-center p-1 relative overflow-hidden">
                            <div className="text-[16px] animate-pulse" style={{ animationDuration: isActive ? `${60 / Number(bpm)}s` : '1s' }}>❤️</div>
                            <div className="flex gap-2 text-[8px] text-white font-mono mt-1">
                                <span>{bpm} BPM</span>
                                {isPulseOx && <span>{spo2}%</span>}
                            </div>
                        </div>
                        <span className="text-[8px] font-mono text-red-400 bg-red-900/50 px-1.5 py-0.5 rounded border border-red-700">{isPulseOx ? 'SpO2' : 'HR'}</span>
                    </div>
                );
            }

            // HiFi DAC
            case RaspberryPiComponentType.HIFI_DAC:
            case RaspberryPiComponentType.HIFI_AMP: {
                const isAmp = String(comp.type).includes('AMP');
                return (
                    <div className={wrapperClass}>
                        <div className={`w-20 h-10 rounded-lg border-2 shadow-lg flex items-center justify-center gap-1 p-1 ${isAmp ? 'bg-gradient-to-r from-amber-700 to-amber-900 border-amber-500' : 'bg-gradient-to-r from-indigo-700 to-indigo-900 border-indigo-500'}`}>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1.5 rounded-t-sm bg-green-400 ${isActive ? 'animate-pulse' : 'opacity-30'}`} style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <div className="text-[8px] text-white font-bold">{isAmp ? 'AMP' : 'DAC'}</div>
                        </div>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${isAmp ? 'text-amber-400 bg-amber-900/50 border-amber-700' : 'text-indigo-400 bg-indigo-900/50 border-indigo-700'}`}>HiFi {isAmp ? 'AMP' : 'DAC'}</span>
                    </div>
                );
            }

            default:
                // Enhanced Generic RPi component with better styling
                return (
                    <div className={wrapperClass}>
                        <div className="w-12 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border-2 border-gray-500 shadow-lg flex flex-col items-center justify-center p-1">
                            <div className="text-[5px] text-gray-400 text-center truncate w-full">{comp.label.split(' ')[0]}</div>
                            <div className={`w-5 h-5 rounded-full mt-1 ${isActive ? 'bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse' : 'bg-gray-600'}`}></div>
                            <div className="text-[6px] text-gray-500 font-mono mt-0.5">GPIO{comp.pin}</div>
                        </div>
                        <span className="text-[8px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600 truncate max-w-[60px]">
                            {String(comp.type).replace('RaspberryPiComponentType.', '').substring(0, 8)}
                        </span>
                    </div>
                );
        }

    };
    // Raspberry Pi Board - Enhanced Visualization
    const renderBoard = () => {
        if (deviceMode === 'raspberry-pi') {
            const boardName = wiring.board;
            const isPico = boardName.includes('Pico');
            const isPi5 = boardName.includes('5');
            const isZero = boardName.includes('Zero');

            // Pico Board Rendering
            if (isPico) {
                const picoGpioLabels = [
                    'GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7',
                    'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'
                ];
                const hasWifi = boardName.includes('W');

                return (
                    <div className="relative w-[280px] h-[80px] bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.6)] border-b-[4px] border-r-[3px] border-green-800 group">
                        {/* PCB Texture */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                        {/* RP2040 Chip */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gray-800 rounded border border-gray-600">
                            <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center">
                                <span className="text-[5px] text-gray-400 font-mono">RP2040</span>
                            </div>
                        </div>

                        {/* USB Micro Port */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-4 h-6 bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-500 rounded-r-sm shadow-md"></div>
                        <span className="absolute left-2 -bottom-4 text-[6px] text-white/40">USB</span>

                        {/* GPIO Pins - Top Row */}
                        <div className="absolute top-1 left-8 right-8 flex justify-between">
                            {picoGpioLabels.slice(0, 10).map((label, i) => {
                                const isGND = label === 'GND';
                                const isActive = !isGND && activePinStates[label.replace('GP', '')] > 0;
                                return (
                                    <div
                                        key={`pico-top-${i}`}
                                        className={`w-2 h-2 rounded-full border cursor-pointer transition-all hover:scale-150 group/pin relative ${isGND ? 'bg-gray-800 border-gray-600' :
                                            isActive ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_#facc15] animate-pulse' :
                                                'bg-yellow-600 border-yellow-500'
                                            }`}
                                        title={label}
                                    >
                                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[5px] text-white bg-black/80 px-0.5 rounded opacity-0 group-hover/pin:opacity-100 whitespace-nowrap z-20">{label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* GPIO Pins - Bottom Row */}
                        <div className="absolute bottom-1 left-8 right-8 flex justify-between">
                            {picoGpioLabels.slice(10, 20).map((label, i) => {
                                const isGND = label === 'GND';
                                const isActive = !isGND && activePinStates[label.replace('GP', '')] > 0;
                                return (
                                    <div
                                        key={`pico-bot-${i}`}
                                        className={`w-2 h-2 rounded-full border cursor-pointer transition-all hover:scale-150 group/pin relative ${isGND ? 'bg-gray-800 border-gray-600' :
                                            isActive ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_#facc15] animate-pulse' :
                                                'bg-yellow-600 border-yellow-500'
                                            }`}
                                        title={label}
                                    >
                                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[5px] text-white bg-black/80 px-0.5 rounded opacity-0 group-hover/pin:opacity-100 whitespace-nowrap z-20">{label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* BOOTSEL Button */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-sm border border-gray-300 shadow-inner flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
                        </div>
                        <span className="absolute right-1 -bottom-4 text-[5px] text-white/40">BOOT</span>

                        {/* LED */}
                        <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse' : 'bg-green-900'}`}></div>

                        {/* WiFi indicator for Pico W */}
                        {hasWifi && (
                            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-blue-400 shadow-[0_0_4px_#60a5fa]' : 'bg-blue-900'}`}></div>
                                <span className="text-[5px] text-white/50">WiFi</span>
                            </div>
                        )}

                        {/* Branding */}
                        <div className="absolute top-1/2 right-16 -translate-y-1/2 pointer-events-none">
                            <span className="text-[8px] text-white/60 font-bold">Pico{hasWifi ? ' W' : ''}</span>
                        </div>
                    </div>
                );
            }

            // Standard GPIO Labels for full-size boards
            const gpioLabels = [
                '3V3', '5V', 'GPIO2', '5V', 'GPIO3', 'GND', 'GPIO4', 'GPIO14',
                'GND', 'GPIO15', 'GPIO17', 'GPIO18', 'GPIO27', 'GND', 'GPIO22', 'GPIO23',
                '3V3', 'GPIO24', 'GPIO10', 'GND', 'GPIO9', 'GPIO25', 'GPIO11', 'GPIO8',
                'GND', 'GPIO7', 'ID_SD', 'ID_SC', 'GPIO5', 'GND', 'GPIO6', 'GPIO12',
                'GPIO13', 'GND', 'GPIO19', 'GPIO16', 'GPIO26', 'GPIO20', 'GND', 'GPIO21'
            ];

            // Raspberry Pi 5 Specific Rendering
            if (isPi5) {
                return (
                    <div className="relative w-[420px] h-[280px] bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-lg shadow-[0_25px_60px_rgba(0,0,0,0.7)] border-b-[8px] border-r-[5px] border-green-900 group overflow-visible">
                        {/* PCB Texture */}
                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent"></div>

                        {/* Raspberry Pi 5 Logo & Text */}
                        <div className="absolute top-[25%] left-[20%] flex flex-col items-center opacity-95 pointer-events-none">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-pink-400">
                                <span className="text-white text-3xl">🍓</span>
                            </div>
                            <span className="font-bold text-white text-lg tracking-wider mt-2 drop-shadow-lg">Raspberry Pi 5</span>
                            <span className="font-mono text-[10px] text-white/70 bg-pink-600/30 px-2 py-0.5 rounded mt-1">4GB / 8GB</span>
                        </div>

                        {/* BCM2712 SoC (Pi 5) */}
                        <div className="absolute bottom-20 left-12 w-16 h-16 bg-gray-800 rounded border border-gray-600 shadow-inner">
                            <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center">
                                <span className="text-[7px] text-gray-400 font-mono text-center leading-tight">BCM2712<br />2.4GHz</span>
                            </div>
                        </div>

                        {/* RP1 Southbridge Chip (Pi 5 specific) */}
                        <div className="absolute bottom-20 left-32 w-10 h-10 bg-gray-700 rounded border border-gray-500 shadow-inner">
                            <div className="absolute inset-0.5 bg-gradient-to-br from-gray-600 to-gray-800 rounded flex items-center justify-center">
                                <span className="text-[5px] text-gray-300 font-mono">RP1</span>
                            </div>
                        </div>

                        {/* 40-Pin GPIO Header */}
                        <div className="absolute top-4 right-6">
                            <div className="text-[9px] text-white/60 font-mono mb-1 text-center">GPIO Header</div>
                            <div className="grid grid-cols-2 gap-[3px] bg-black/40 p-1.5 rounded-sm border border-gray-600">
                                {gpioLabels.map((label, i) => {
                                    const isPower = ['3V3', '5V'].includes(label);
                                    const isGND = label === 'GND';
                                    const isSpecial = label.startsWith('ID_');
                                    const isActive = activePinStates[label.replace('GPIO', '')] > 0;

                                    return (
                                        <div
                                            key={`gpio-${i}`}
                                            className={`w-3 h-3 rounded-sm border cursor-pointer transition-all duration-150 hover:scale-125 hover:z-10 group/pin relative ${isPower ? 'bg-red-500 border-red-400 shadow-[0_0_6px_#ef4444]' :
                                                isGND ? 'bg-gray-800 border-gray-600' :
                                                    isSpecial ? 'bg-purple-500 border-purple-400' :
                                                        isActive ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_8px_#facc15] animate-pulse' :
                                                            'bg-yellow-600 border-yellow-500 hover:bg-yellow-500'
                                                }`}
                                            title={`Pin ${i + 1}: ${label}`}
                                        >
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-white bg-black/80 px-1 rounded opacity-0 group-hover/pin:opacity-100 whitespace-nowrap z-20">{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* USB-C Power (Pi 5 has USB-C PD) */}
                        <div className="absolute -left-3 top-8 flex flex-col items-center">
                            <div className="w-6 h-12 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-500 rounded-sm shadow-lg relative">
                                <div className="absolute inset-1 flex items-center justify-center">
                                    <div className="w-3 h-1 bg-gray-600 rounded"></div>
                                </div>
                            </div>
                            <span className="text-[7px] text-white/50 mt-1">USB-C PD</span>
                        </div>

                        {/* Dual HDMI (full-size on Pi 5) */}
                        <div className="absolute -left-2 top-28 flex flex-col gap-2">
                            <div className="w-5 h-8 bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-500 rounded-sm shadow-md flex items-center justify-center">
                                <div className="w-3 h-5 bg-gray-700 rounded-sm"></div>
                            </div>
                            <div className="w-5 h-8 bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-500 rounded-sm shadow-md flex items-center justify-center">
                                <div className="w-3 h-5 bg-gray-700 rounded-sm"></div>
                            </div>
                            <span className="text-[6px] text-white/40 -rotate-90 -ml-3">HDMI</span>
                        </div>

                        {/* USB 3.0 Ports (Blue) */}
                        <div className="absolute bottom-2 left-8 flex gap-3">
                            <div className="w-7 h-14 bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 rounded-sm shadow-lg">
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-10 bg-black/30 rounded-sm"></div>
                            </div>
                            <div className="w-7 h-14 bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 rounded-sm shadow-lg">
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-10 bg-black/30 rounded-sm"></div>
                            </div>
                        </div>
                        <span className="absolute bottom-0 left-12 text-[6px] text-white/40">USB 3.0</span>

                        {/* Gigabit Ethernet */}
                        <div className="absolute bottom-0 right-6 w-18 h-8 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-500 rounded-sm shadow-lg">
                            <div className="absolute inset-1 bg-gray-700 rounded-sm flex items-center justify-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-green-900'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-amber-900'}`}></div>
                            </div>
                        </div>
                        <span className="absolute -bottom-4 right-8 text-[6px] text-white/40">2.5G Ethernet</span>

                        {/* PCIe FFC Connector (Pi 5 specific) */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-16 bg-gray-600 border border-gray-500 rounded-sm">
                            <div className="absolute inset-0.5 bg-gray-700 flex flex-col justify-around items-center py-1">
                                {[...Array(8)].map((_, i) => <div key={i} className="w-1.5 h-0.5 bg-yellow-500 rounded-full"></div>)}
                            </div>
                        </div>
                        <span className="absolute right-0 top-1/2 translate-y-10 text-[5px] text-white/40 -rotate-90">PCIe</span>

                        {/* Fan Header (Pi 5 specific) */}
                        <div className="absolute top-4 left-4 flex gap-0.5">
                            {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-2 bg-white border border-gray-400 rounded-sm"></div>)}
                        </div>
                        <span className="absolute top-7 left-3 text-[5px] text-white/40">FAN</span>

                        {/* Status LEDs */}
                        <div className="absolute bottom-6 left-4 flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isRunning ? 'bg-green-400 shadow-[0_0_12px_#4ade80,0_0_20px_#4ade80] animate-pulse' : 'bg-green-900/50 border border-green-800'}`}></div>
                                <span className="text-[7px] text-white/50 font-mono">PWR</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isRunning ? 'bg-red-400 shadow-[0_0_12px_#f87171,0_0_20px_#f87171]' : 'bg-red-900/50 border border-red-800'}`} style={{ animation: isRunning ? 'pulse 0.5s infinite' : 'none' }}></div>
                                <span className="text-[7px] text-white/50 font-mono">ACT</span>
                            </div>
                        </div>

                        {/* WiFi/BT */}
                        <div className="absolute top-12 left-4 flex flex-col items-center gap-0.5">
                            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-blue-900'}`}></div>
                            <span className="text-[6px] text-white/40">WiFi 6</span>
                        </div>
                    </div>
                );
            }

            // Standard Pi 4B / 3B+ / Zero Rendering
            return (
                <div className={`relative ${isZero ? 'w-[320px] h-[160px]' : 'w-[400px] h-[260px]'} bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-lg shadow-[0_25px_60px_rgba(0,0,0,0.7)] border-b-[8px] border-r-[5px] border-green-900 group overflow-visible`}>
                    {/* PCB Texture & Pattern */}
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent"></div>

                    {/* Circuit Traces (Decorative) */}
                    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                        <path d="M50 50 L100 50 L100 100 L150 100" stroke="#fff" strokeWidth="1" fill="none" />
                        <path d="M200 30 L200 80 L250 80" stroke="#fff" strokeWidth="1" fill="none" />
                        <path d="M80 150 L130 150 L130 200" stroke="#fff" strokeWidth="1" fill="none" />
                    </svg>

                    {/* Raspberry Pi Logo & Text */}
                    <div className={`absolute ${isZero ? 'top-[20%] left-[30%]' : 'top-[30%] left-[25%]'} flex flex-col items-center opacity-95 pointer-events-none`}>
                        <div className={`${isZero ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg`}>
                            <span className={`text-white ${isZero ? 'text-lg' : 'text-2xl'}`}>🍓</span>
                        </div>
                        <span className={`font-bold text-white ${isZero ? 'text-sm' : 'text-base'} tracking-wider mt-2 drop-shadow-lg`}>Raspberry Pi</span>
                        <span className="font-mono text-[11px] text-white/80 tracking-wider bg-black/30 px-2 py-0.5 rounded mt-1">{wiring.board}</span>
                    </div>

                    {/* BCM2711/2710 Chip (SoC) */}
                    {!isZero && (
                        <div className="absolute bottom-16 left-16 w-14 h-14 bg-gray-800 rounded-sm border border-gray-600 shadow-inner">
                            <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm flex items-center justify-center">
                                <span className="text-[6px] text-gray-400 font-mono">{boardName.includes('4') ? 'BCM2711' : 'BCM2710'}</span>
                            </div>
                        </div>
                    )}

                    {/* 40-Pin GPIO Header - Enhanced */}
                    <div className={`absolute ${isZero ? 'top-2 right-2' : 'top-4 right-6'}`}>
                        <div className="text-[9px] text-white/60 font-mono mb-1 text-center">GPIO Header</div>
                        <div className={`grid grid-cols-2 gap-[3px] bg-black/40 p-1.5 rounded-sm border border-gray-600 ${isZero ? 'scale-75 origin-top-right' : ''}`}>
                            {gpioLabels.map((label, i) => {
                                const pinNum = i + 1;
                                const isPower = ['3V3', '5V'].includes(label);
                                const isGND = label === 'GND' || label.includes('GND');
                                const isSpecial = label.startsWith('ID_');
                                const isActive = activePinStates[label.replace('GPIO', '')] > 0;

                                return (
                                    <div
                                        key={`gpio-${i}`}
                                        className={`w-3 h-3 rounded-sm border cursor-pointer transition-all duration-150 hover:scale-125 hover:z-10 group/pin relative ${isPower ? 'bg-red-500 border-red-400 shadow-[0_0_6px_#ef4444]' :
                                            isGND ? 'bg-gray-800 border-gray-600' :
                                                isSpecial ? 'bg-purple-500 border-purple-400' :
                                                    isActive ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_8px_#facc15] animate-pulse' :
                                                        'bg-yellow-600 border-yellow-500 hover:bg-yellow-500'
                                            }`}
                                        title={`Pin ${pinNum}: ${label}`}
                                    >
                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] text-white bg-black/80 px-1 rounded opacity-0 group-hover/pin:opacity-100 whitespace-nowrap z-20">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* USB-C/Micro Power Port */}
                    <div className={`absolute -left-3 ${isZero ? 'top-4' : 'top-10'} flex flex-col items-center`}>
                        <div className={`${isZero ? 'w-4 h-6' : 'w-5 h-10'} bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-500 rounded-sm shadow-lg`}></div>
                        <span className="text-[7px] text-white/50 mt-1 rotate-0">{isZero ? 'μUSB' : 'USB-C'}</span>
                    </div>

                    {/* HDMI Ports */}
                    {!isZero && (
                        <div className="absolute -left-2 top-28 flex flex-col gap-2">
                            <div className="w-4 h-6 bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-500 rounded-sm shadow-md flex items-center justify-center">
                                <div className="w-2 h-3 bg-gray-700 rounded-sm"></div>
                            </div>
                            <div className="w-4 h-6 bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-500 rounded-sm shadow-md flex items-center justify-center">
                                <div className="w-2 h-3 bg-gray-700 rounded-sm"></div>
                            </div>
                            <span className="text-[6px] text-white/40 -rotate-90 -ml-2">HDMI</span>
                        </div>
                    )}

                    {/* USB 3.0 Ports (Blue) - Not on Zero */}
                    {!isZero && (
                        <>
                            <div className="absolute bottom-2 left-10 flex gap-3">
                                <div className="w-6 h-12 bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 rounded-sm shadow-lg transform -rotate-0">
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-8 bg-black/30 rounded-sm"></div>
                                </div>
                                <div className="w-6 h-12 bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 rounded-sm shadow-lg">
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-8 bg-black/30 rounded-sm"></div>
                                </div>
                            </div>
                            <span className="absolute bottom-0 left-14 text-[6px] text-white/40">USB 3.0</span>
                        </>
                    )}

                    {/* Ethernet Port - Not on Zero */}
                    {!isZero && (
                        <>
                            <div className="absolute bottom-0 right-6 w-16 h-7 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-500 rounded-sm shadow-lg">
                                <div className="absolute inset-1 bg-gray-700 rounded-sm flex items-center justify-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]' : 'bg-green-900'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-amber-900'}`}></div>
                                </div>
                            </div>
                            <span className="absolute -bottom-4 right-8 text-[6px] text-white/40">Ethernet</span>
                        </>
                    )}

                    {/* SD Card Slot */}
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 ${isZero ? 'h-8' : 'h-12'} bg-gradient-to-r from-gray-500 to-gray-600 border border-gray-700 rounded-l-sm shadow-inner`}>
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 ${isZero ? 'h-5' : 'h-8'} bg-gray-800 rounded-l-sm`}></div>
                    </div>
                    <span className="absolute right-5 top-1/2 text-[6px] text-white/40 -rotate-90">SD</span>

                    {/* Status LEDs - Enhanced */}
                    <div className={`absolute ${isZero ? 'bottom-2 left-2' : 'bottom-4 left-4'} flex items-center gap-3`}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isRunning ? 'bg-green-400 shadow-[0_0_12px_#4ade80,0_0_20px_#4ade80] animate-pulse' : 'bg-green-900/50 border border-green-800'}`}></div>
                            <span className="text-[7px] text-white/50 font-mono">PWR</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isRunning ? 'bg-red-400 shadow-[0_0_12px_#f87171,0_0_20px_#f87171]' : 'bg-red-900/50 border border-red-800'}`} style={{ animation: isRunning ? 'pulse 0.5s infinite' : 'none' }}></div>
                            <span className="text-[7px] text-white/50 font-mono">ACT</span>
                        </div>
                    </div>

                    {/* WiFi/BT Indicator (for supported boards) */}
                    {(wiring.board.includes('4B') || wiring.board.includes('5') || wiring.board.includes('W')) && (
                        <div className={`absolute ${isZero ? 'top-2 left-2' : 'top-4 left-4'} flex flex-col items-center gap-0.5`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-blue-900'}`}></div>
                            <span className="text-[6px] text-white/40">WiFi</span>
                        </div>
                    )}
                </div>
            );
        }



        // Arduino UNO (Default)
        return (
            <div className="relative w-[340px] h-[220px] bg-teal-700 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-b-[6px] border-r-[4px] border-teal-900 group">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute -left-3 top-4 w-6 h-12 bg-gray-300 border border-gray-400 rounded-sm shadow-md"></div>
                <div className="absolute -left-2 bottom-2 w-8 h-10 bg-black border border-gray-700 rounded-sm shadow-md"></div>
                <div className="absolute top-[40%] left-[35%] flex flex-col items-center opacity-80 pointer-events-none">
                    <span className="font-serif italic font-bold text-white text-lg tracking-wider">Arduino</span>
                    <span className="font-sans text-xs text-white tracking-[0.3em] font-light mt-0.5">UNO</span>
                </div>
                {/* Headers */}
                <div className="absolute top-2 right-8 flex gap-[1px]">
                    {['SCL', 'SDA', 'AREF', 'GND', '13', '12', '11', '10', '9', '8'].map((p, i) => <div key={`top1-${i}`} className="w-3.5 h-3.5 bg-black border border-gray-700"></div>)}
                </div>
                <div className="absolute top-2 right-[125px] flex gap-[1px]">
                    {['7', '6', '5', '4', '3', '2', '1', '0'].map((p, i) => <div key={`top2-${i}`} className="w-3.5 h-3.5 bg-black border border-gray-700"></div>)}
                </div>
                <div className="absolute bottom-2 right-[110px] flex gap-[1px]">
                    {['RST', '3V3', '5V', 'GND1', 'GND2', 'VIN'].map((p, i) => <div key={`pwr-${i}`} className="w-3.5 h-3.5 bg-black border border-gray-700"></div>)}
                </div>
                <div className="absolute bottom-2 right-8 flex gap-[1px]">
                    {['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((p, i) => <div key={`ana-${i}`} className="w-3.5 h-3.5 bg-black border border-gray-700"></div>)}
                </div>
            </div>
        );
    };

    return (
        <div className="relative w-full h-full bg-[#0f172a] flex flex-col overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none"></div>
            <style>{`
         .mesh-pattern { background-image: radial-gradient(#4b5563 1px, transparent 1px); background-size: 2px 2px; }
         @keyframes matrix-rain { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
         .animate-matrix-rain { animation: matrix-rain 2s linear infinite; }
       `}</style>

            <div className="flex-1 overflow-auto relative custom-scrollbar z-20">
                <div className="min-w-[600px] min-h-[600px] w-full h-full flex flex-col p-8 items-center relative" ref={contentRef}>

                    {/* Wiring Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <defs>
                            <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {wirePaths.map((wire, idx) => (
                            <g key={wire.id + idx}>
                                <path d={wire.path} fill="none" stroke={wire.color} strokeWidth="5" strokeOpacity="0.3" filter="url(#wire-glow)" />
                                <path d={wire.path} fill="none" stroke={wire.color} strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx={wire.path.split(' ')[1]} cy={wire.path.split(' ')[2]} r="3" fill="#fff" fillOpacity="0.5" />
                            </g>
                        ))}
                    </svg>

                    {/* Dynamic Breadboard Container */}
                    <div className="relative z-20 mb-20 p-6 bg-[#f3f4f6] rounded-xl shadow-2xl border-b-[8px] border-[#d1d5db] inline-flex flex-wrap justify-center gap-10 min-w-[320px] max-w-[800px]">
                        {/* Decorative Power Rails */}
                        <div className="absolute top-2 left-2 right-2 h-1 flex justify-between"><div className="w-full h-px bg-red-500/30"></div></div>
                        <div className="absolute bottom-2 left-2 right-2 h-1 flex justify-between"><div className="w-full h-px bg-blue-500/30"></div></div>

                        {/* Breadboard Holes Pattern (Visual Only) */}
                        <div className="absolute inset-4 opacity-10 pointer-events-none flex flex-wrap gap-1 justify-center content-center -z-10">
                            {Array(200).fill(0).map((_, i) => <div key={i} className="w-1 h-1 bg-black rounded-full"></div>)}
                        </div>

                        {wiring.components.map((comp) => (
                            <div key={comp.id} ref={(el) => { componentRefs.current[comp.id] = el; }} className="relative z-30">
                                {deviceMode === 'raspberry-pi'
                                    ? renderRPiComponent(comp as RaspberryPiComponent)
                                    : renderComponent(comp as ArduinoComponent)
                                }
                            </div>
                        ))}

                        {wiring.components.length === 0 && (
                            <div className="text-gray-400 p-8 flex flex-col items-center gap-2">
                                <span className="text-sm font-medium">Empty Circuit</span>
                                <span className="text-xs opacity-50">Add components via AI chat</span>
                            </div>
                        )}
                    </div>

                    {/* Board Area */}
                    <div className="mt-auto relative z-20 transition-all scale-100" ref={boardRef}>
                        {renderBoard()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulationPanel;

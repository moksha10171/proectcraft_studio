"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Eraser, ChevronUp, ChevronDown, Download, Clock } from 'lucide-react';

interface SerialConsoleProps {
    logs: string;
    onClear: () => void;
    height: number;
    isOpen: boolean;
    onToggle: () => void;
    onResizeStart?: (e: React.MouseEvent) => void;
}

const SerialConsole: React.FC<SerialConsoleProps> = ({ logs, onClear, height, isOpen, onToggle, onResizeStart }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    return (
        <div
            className={`flex flex-col bg-[#0d1117] border-t border-[#333] shrink-0 transition-all duration-200 ease-in-out ${isOpen ? '' : 'h-12'}`}
            style={{ height: isOpen ? height : undefined }}
        >
            {/* Resize Handle (only active when open) */}
            {isOpen && (
                <div
                    className="h-1 -mt-0.5 w-full cursor-row-resize hover:bg-sky-500/50 absolute top-0 left-0 z-20 group"
                    onMouseDown={onResizeStart}
                >
                    <div className="mx-auto w-12 h-0.5 bg-gray-700 group-hover:bg-sky-400 rounded-full mt-px opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}

            {/* Header */}
            <div
                className="flex items-center justify-between px-3 h-12 bg-[#161b22] border-b border-[#333] select-none cursor-pointer hover:bg-[#1f242c] transition-colors relative z-10"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    <TerminalIcon size={16} className="text-emerald-500" />
                    <span className="text-gray-300">Serial Monitor</span>
                </div>

                <div className="flex items-center gap-2">
                    {isOpen && (
                        <>
                            <span className="text-[10px] text-gray-600 font-mono hidden sm:inline border-r border-[#333] pr-2 mr-1">9600 baud</span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const blob = new Blob([logs], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `serial-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"
                                title="Export Logs"
                            >
                                <Download size={14} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); onClear(); }}
                                className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-white transition-colors"
                                title="Clear Output"
                            >
                                <Eraser size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {isOpen && (
                <div className="flex-1 p-2 font-mono text-xs overflow-y-auto custom-scrollbar relative bg-[#0d1117]" ref={logContainerRef}>
                    {logs ? (
                        <div className="flex flex-col gap-0.5 pb-2">
                            {logs.split('\n').map((line, i) => {
                                if (!line) return null;
                                if (line.includes('[SYSTEM]')) return <span key={i} className="text-amber-500 opacity-80 border-l-2 border-amber-900/50 pl-2 my-0.5 block break-all">{line}</span>;
                                if (line.includes('[COMPILER]')) return <span key={i} className="text-sky-400 opacity-90 pl-1 my-0.5 block break-all">{line}</span>;
                                if (line.includes('Error') || line.includes('Fail')) return <span key={i} className="text-red-400 font-bold bg-red-900/10 block px-1 rounded break-all">{line}</span>;
                                return <span key={i} className="text-emerald-400/90 block break-all">{line}</span>;
                            })}
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 italic opacity-50 pointer-events-none select-none">
                            <span>No serial output</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SerialConsole;

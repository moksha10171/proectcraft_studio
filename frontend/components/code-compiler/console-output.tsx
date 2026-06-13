'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ConsoleMessage, ConsoleMessageType } from '@/lib/code-compiler/types';
import { Terminal, Trash2, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ConsoleOutputProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function ConsoleOutput({ isOpen, onToggle }: ConsoleOutputProps) {
    const [messages, setMessages] = useState<ConsoleMessage[]>([]);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Listen for console messages from preview iframe
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'console-log') {
                addMessage('log', event.data.args.join(' '));
            } else if (event.data.type === 'console-error') {
                addMessage('error', event.data.args.join(' '));
            } else if (event.data.type === 'console-warn') {
                addMessage('warn', event.data.args.join(' '));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (consoleEndRef.current && isOpen) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const addMessage = (type: ConsoleMessageType, message: string) => {
        setMessages(prev => [...prev, {
            type,
            message,
            timestamp: Date.now()
        }]);
    };

    const clearConsole = () => {
        setMessages([]);
    };

    const getMessageIcon = (type: ConsoleMessageType) => {
        switch (type) {
            case 'error':
                return <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />;
            case 'warn':
                return <AlertTriangle size={12} className="text-yellow-500 mt-0.5 shrink-0" />;
            case 'info':
                return <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />;
            case 'log':
            default:
                return <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5 shrink-0" />;
        }
    };

    const getMessageStyles = (type: ConsoleMessageType) => {
        switch (type) {
            case 'error':
                return 'bg-red-500/5 text-red-200 border-l-2 border-red-500/40';
            case 'warn':
                return 'bg-yellow-500/5 text-yellow-200 border-l-2 border-yellow-500/40';
            case 'info':
                return 'bg-blue-500/5 text-blue-200 border-l-2 border-blue-500/40';
            case 'log':
            default:
                return 'hover:bg-white/5 text-gray-300 border-l-2 border-transparent';
        }
    };

    return (
        <div className={`flex flex-col bg-[#0c0c0e] border-t border-white/10 transition-all duration-300 ease-in-out ${isOpen ? 'h-48 md:h-64' : 'h-9'
            } shrink-0 relative z-30`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-white/5 cursor-pointer hover:bg-[#202025] transition-colors h-9"
                onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-teal-500" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Console</span>
                    </div>
                    {messages.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px] font-mono font-medium border border-teal-500/20">
                            {messages.length} msg
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {isOpen && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearConsole();
                            }}
                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors mr-2"
                            title="Clear Console"
                            aria-label="Clear console output"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                    <button className="text-gray-500 hover:text-white transition-colors">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
            </div>

            {/* Console Messages */}
            {isOpen && (
                <div className="flex-1 overflow-y-auto font-mono text-sm p-0 space-y-0 custom-scrollbar bg-[#0c0c0e]">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-60">
                            <Terminal size={24} className="mb-2" />
                            <p className="text-xs font-medium">No output to display</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 px-4 py-1.5 text-xs font-medium ${getMessageStyles(msg.type)}`}
                                >
                                    {getMessageIcon(msg.type)}
                                    <span className="flex-1 break-all leading-relaxed opacity-90">{msg.message}</span>
                                    <span className="text-[10px] text-gray-600 whitespace-nowrap mt-0.5 select-none opacity-50">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={consoleEndRef} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

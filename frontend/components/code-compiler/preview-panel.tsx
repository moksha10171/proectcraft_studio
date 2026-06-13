'use client';

import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { RefreshCw, Smartphone, Tablet, Monitor, Maximize2, Minimize2 } from 'lucide-react';

interface PreviewPanelProps {
    htmlContent: string;
    isLoading: boolean;
    onFullscreenToggle?: () => void;
    isFullscreen?: boolean;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const PreviewPanel = forwardRef<HTMLDivElement, PreviewPanelProps>(({ htmlContent, isLoading, onFullscreenToggle, isFullscreen = false }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [viewport, setViewport] = useState<ViewportSize>('desktop');
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (!iframeRef.current) return;

        const iframe = iframeRef.current;

        // Handle empty content
        if (!htmlContent || htmlContent.trim() === '') {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                    iframeDoc.open();
                    iframeDoc.write(`
                        <!DOCTYPE html>
                        <html>
                        <head><title>Preview</title></head>
                        <body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #ccc;">
                            <h2>No content to preview</h2>
                            <p>Add some files and code to see the preview here.</p>
                        </body>
                        </html>
                    `);
                    iframeDoc.close();
                }
            } catch (err) {
                console.error('Error setting empty content:', err);
            }
            return;
        }

        // Wait for iframe to load before accessing document
        const loadIframe = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

                if (iframeDoc) {
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();

                    // Wait a bit for scripts to load, then capture console
                    setTimeout(() => {
                        if (iframe.contentWindow) {
                            try {
                                const originalConsole = {
                                    log: iframe.contentWindow.console.log.bind(iframe.contentWindow.console),
                                    error: iframe.contentWindow.console.error.bind(iframe.contentWindow.console),
                                    warn: iframe.contentWindow.console.warn.bind(iframe.contentWindow.console),
                                };

                                // Override console methods to capture output
                                iframe.contentWindow.console.log = (...args: any[]) => {
                                    originalConsole.log(...args);
                                    window.postMessage({ type: 'console-log', args: args.map(a => String(a)) }, '*');
                                };

                                iframe.contentWindow.console.error = (...args: any[]) => {
                                    originalConsole.error(...args);
                                    window.postMessage({ type: 'console-error', args: args.map(a => String(a)) }, '*');
                                };

                                iframe.contentWindow.console.warn = (...args: any[]) => {
                                    originalConsole.warn(...args);
                                    window.postMessage({ type: 'console-warn', args: args.map(a => String(a)) }, '*');
                                };

                                // Capture runtime errors
                                iframe.contentWindow.onerror = (message, source, lineno, colno, error) => {
                                    window.postMessage({
                                        type: 'console-error',
                                        args: [`Runtime Error at line ${lineno}: ${String(message)}`]
                                    }, '*');
                                    return false;
                                };

                                // Capture unhandled promise rejections
                                iframe.contentWindow.addEventListener('unhandledrejection', (event: any) => {
                                    window.postMessage({
                                        type: 'console-error',
                                        args: [`Unhandled Promise Rejection: ${String(event.reason)}`]
                                    }, '*');
                                });
                            } catch (err) {
                                console.warn('Failed to set up console capture:', err);
                            }
                        }
                    }, 200); // Increased timeout for React/Babel to load
                }
            } catch (err) {
                console.error('Error loading iframe content:', err);
                // Show error in iframe
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        iframeDoc.open();
                        iframeDoc.write(`
                            <!DOCTYPE html>
                            <html>
                            <head><title>Preview Error</title></head>
                            <body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #ff6b6b;">
                                <h2>Preview Error</h2>
                                <p>Failed to load preview content.</p>
                                <pre>${String(err)}</pre>
                            </body>
                            </html>
                        `);
                        iframeDoc.close();
                    }
                } catch (writeErr) {
                    console.error('Failed to write error to iframe:', writeErr);
                }
            }
        };

        // If iframe is already loaded, execute immediately
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            loadIframe();
        } else {
            // Wait for iframe to load
            iframe.onload = loadIframe;
            // Also try immediately in case it's already loaded
            if (iframe.contentDocument) {
                loadIframe();
            }
        }
    }, [htmlContent, key]); // Include key to reload on refresh

    const handleRefresh = () => {
        setKey(prev => prev + 1);
    };

    const getViewportWidth = (): string => {
        switch (viewport) {
            case 'mobile':
                return '375px';
            case 'tablet':
                return '768px';
            case 'desktop':
            default:
                return '100%';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-black">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview</span>
                    {isLoading && (
                        <span className="text-xs text-teal-500 animate-pulse">Compiling...</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Viewport Controls */}
                    <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-md p-1">
                        <button
                            onClick={() => setViewport('mobile')}
                            className={`p-1.5 rounded transition-colors ${viewport === 'mobile' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                }`}
                            title="Mobile (375px)"
                        >
                            <Smartphone size={16} />
                        </button>
                        <button
                            onClick={() => setViewport('tablet')}
                            className={`p-1.5 rounded transition-colors ${viewport === 'tablet' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                }`}
                            title="Tablet (768px)"
                        >
                            <Tablet size={16} />
                        </button>
                        <button
                            onClick={() => setViewport('desktop')}
                            className={`p-1.5 rounded transition-colors ${viewport === 'desktop' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#333]'
                                }`}
                            title="Desktop (100%)"
                        >
                            <Monitor size={16} />
                        </button>
                    </div>

                    {/* Fullscreen Button */}
                    {onFullscreenToggle && (
                        <button
                            onClick={onFullscreenToggle}
                            className="p-1.5 hover:bg-[#333] rounded text-purple-500 hover:text-purple-400 transition-colors"
                            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen preview"}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                        title="Refresh Preview"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div ref={ref} className="flex-1 overflow-auto bg-white flex justify-center">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: getViewportWidth() }}
                >
                    <iframe
                        key={key}
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-modals allow-forms allow-popups"
                        title="Live code preview"
                        aria-label="Live preview of your code"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                    // Security: Removed allow-same-origin to prevent parent window access
                    // Security: Removed allow-popups-to-escape-sandbox to prevent sandbox escape
                    // Security: CSP is added via meta tag in compiled HTML
                    />
                </div>
            </div>
        </div>
    );
});

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;

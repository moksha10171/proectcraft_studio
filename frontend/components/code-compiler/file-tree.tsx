'use client';

import React, { useState } from 'react';
import { CodeFile } from '@/lib/code-compiler/types';
import { FileCode, FilePlus, Edit2, Trash2, MoreVertical, X, FolderOpen } from 'lucide-react';

interface FileTreeProps {
    files: CodeFile[];
    activeFileName: string;
    onSelectFile: (fileName: string) => void;
    onAddFile: () => void;
    onRenameFile: (oldName: string, newName: string) => void;
    onDeleteFile: (fileName: string) => void;
}

export default function FileTree({
    files,
    activeFileName,
    onSelectFile,
    onAddFile,
    onRenameFile,
    onDeleteFile
}: FileTreeProps) {
    const [contextMenu, setContextMenu] = useState<{ fileName: string; x: number; y: number } | null>(null);

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();

        const iconMap: Record<string, string> = {
            html: '🌐',
            css: '🎨',
            js: '📜',
            jsx: '⚛️',
            ts: '📘',
            tsx: '⚛️',
            json: '📋',
        };

        return iconMap[ext || ''] || '📄';
    };

    const handleRename = (fileName: string) => {
        const newName = prompt(`Rename "${fileName}" to:`, fileName);
        if (newName && newName !== fileName) {
            onRenameFile(fileName, newName);
        }
        setContextMenu(null);
    };

    const handleDelete = (fileName: string) => {
        if (confirm(`Delete "${fileName}"?`)) {
            onDeleteFile(fileName);
        }
        setContextMenu(null);
    };

    const handleContextMenu = (e: React.MouseEvent, fileName: string) => {
        e.preventDefault();
        setContextMenu({ fileName, x: e.clientX, y: e.clientY });
    };

    return (
        <>
            <div className="flex flex-col h-full bg-transparent text-gray-300">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen size={14} className="text-teal-500" />
                        Explorer
                    </span>
                    <button
                        onClick={onAddFile}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95"
                        title="Add File"
                        aria-label="Add new file"
                    >
                        <FilePlus size={16} />
                    </button>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                    {files.map((file) => (
                        <button
                            key={file.name}
                            onClick={() => onSelectFile(file.name)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onSelectFile(file.name);
                                }
                            }}
                            onContextMenu={(e) => handleContextMenu(e, file.name)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group relative ${activeFileName === file.name
                                    ? 'bg-teal-500/10 text-teal-100 border border-teal-500/20'
                                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                                }`}
                            tabIndex={0}
                            aria-current={activeFileName === file.name ? 'page' : undefined}
                            aria-label={`File: ${file.name}`}
                        >
                            <span className="text-lg shrink-0 transform group-hover:scale-110 transition-transform">{getFileIcon(file.name)}</span>
                            <span className="text-sm font-medium truncate flex-1">
                                {file.name}
                            </span>

                            {/* Hover Actions (Desktop) */}
                            <div className={`absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${activeFileName === file.name ? 'text-teal-200' : 'text-gray-400'}`}>
                                <span
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); handleRename(file.name); }}
                                    className="p-1 hover:bg-black/20 rounded"
                                    title="Rename"
                                >
                                    <Edit2 size={12} />
                                </span>
                                <span
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </span>
                            </div>
                        </button>
                    ))}

                    {files.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 opacity-50">
                            <FileCode size={40} className="mb-3" />
                            <p className="text-sm font-medium">No files</p>
                            <p className="text-xs mt-1">Click + to start</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-3 border-t border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                    {files.length} file{files.length !== 1 ? 's' : ''} in project
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setContextMenu(null)}
                    />
                    <div
                        className="fixed z-50 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl min-w-[160px] overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-100"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                            {contextMenu.fileName}
                        </div>
                        <button
                            onClick={() => handleRename(contextMenu.fileName)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                        >
                            <Edit2 size={14} className="text-blue-400" />
                            Rename
                        </button>
                        <button
                            onClick={() => handleDelete(contextMenu.fileName)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

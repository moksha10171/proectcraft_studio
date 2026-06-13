"use client";

import React, { useState } from 'react';
import { FolderOpen, FileCode, Settings, FileText, ChevronDown, ChevronLeft, Trash2, Edit2, FilePlus, Search, Copy, Check } from 'lucide-react';
import { ProjectFile } from '@/lib/arduino-studio/types';

interface FileExplorerProps {
    files: ProjectFile[];
    activeFileName: string;
    onSelectFile: (name: string) => void;
    onAddFile: () => void;
    onDeleteFile: (name: string) => void;
    onRenameFile: (oldName: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    activeFileContent?: string; // For adding unsaved indicator logic later
}

// Helper to format file size
const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// Get file icon based on extension
const getFileIcon = (name: string) => {
    if (name.endsWith('.ino')) return <FileCode size={14} className="text-teal-400" />;
    if (name.endsWith('.h') || name.endsWith('.cpp')) return <FileCode size={14} className="text-purple-400" />;
    if (name.endsWith('.py')) return <FileCode size={14} className="text-yellow-400" />; // Python
    if (name.endsWith('.json')) return <Settings size={14} className="text-amber-400" />;
    if (name.endsWith('.md')) return <FileText size={14} className="text-blue-400" />;
    return <FileText size={14} className="text-gray-400" />;
};

// Get language label
const getLanguageLabel = (name: string): string => {
    if (name.endsWith('.ino')) return 'Arduino';
    if (name.endsWith('.h')) return 'Header';
    if (name.endsWith('.cpp')) return 'C++';
    if (name.endsWith('.py')) return 'Python';
    if (name.endsWith('.json')) return 'JSON';
    if (name.endsWith('.md')) return 'Markdown';
    return 'Text';
};

const FileExplorer: React.FC<FileExplorerProps> = ({
    files,
    activeFileName,
    onSelectFile,
    onAddFile,
    onDeleteFile,
    onRenameFile,
    isOpen,
    onToggle
}) => {
    const [isFolderOpen, setIsFolderOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedFile, setCopiedFile] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // Core files that cannot be renamed or deleted to ensure system stability
    const PROTECTED_FILES = [
        'sketch.ino', 'config.h', // Arduino
        'main.py', 'config.py',   // Raspberry Pi
        'README.md'               // Documentation
    ];

    // Filter files by search
    const filteredFiles = searchQuery
        ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : files;

    // Copy file name to clipboard
    const handleCopyName = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(name);
        setCopiedFile(name);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    // Collapsed State
    if (!isOpen) {
        return (
            <div className="w-12 h-full bg-[#252526] border-r border-[#1a1a1a] flex flex-col items-center pt-3 gap-4 z-50 select-none">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-[#383838] rounded-md text-gray-400 hover:text-white transition-all active:scale-95"
                    title="Expand Explorer"
                >
                    <FolderOpen size={20} />
                </button>
                <div className="w-6 h-[1px] bg-[#333]"></div>
                <div className="flex flex-col gap-2">
                    {files.map(f => (
                        <button
                            key={f.name}
                            onClick={() => { onToggle(); onSelectFile(f.name); }}
                            className={`w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-[#383838] ${activeFileName === f.name ? 'bg-[#37373d] ring-1 ring-sky-500/50' : ''}`}
                            title={f.name}
                        >
                            {getFileIcon(f.name)}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const fileCount = files.length;
    const maxFiles = 10;
    const canAdd = fileCount < maxFiles;
    const totalSize = files.reduce((sum, f) => sum + (f.content?.length || 0), 0);

    return (
        <div className="h-full flex flex-col bg-[#252526] border-r border-[#1a1a1a] select-none text-gray-300 w-full overflow-hidden">
            {/* Sidebar Header */}
            <div className="h-12 flex items-center justify-between px-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-[#252526] shrink-0 border-b border-[#1a1a1a]">
                <span className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-sky-500" />
                    <span className="text-gray-200">Explorer</span>
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddFile}
                        disabled={!canAdd}
                        className={`p-1.5 rounded-lg transition-all ${!canAdd ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#383838] text-gray-400 hover:text-emerald-400'}`}
                        title="New File (Ctrl+N)"
                    >
                        <FilePlus size={16} />
                    </button>
                    <button
                        onClick={onToggle}
                        className="p-1.5 hover:bg-[#383838] rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Collapse (Ctrl+Shift+E)"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2 border-b border-[#1a1a1a]">
                <div className="relative group">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sky-500 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar">
                <div className="px-2">
                    {/* Project Folder Header */}
                    <div className="flex items-center justify-between group/folder mb-1 select-none">
                        <div
                            className="flex items-center gap-1.5 text-sm text-gray-300 py-1.5 px-2 hover:bg-[#2a2d2e] cursor-pointer rounded flex-1 truncate transition-colors"
                            onClick={() => setIsFolderOpen(!isFolderOpen)}
                        >
                            <div className="text-gray-500 transition-transform duration-200" style={{ transform: isFolderOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                <ChevronDown size={14} />
                            </div>
                            <FolderOpen size={16} className="text-amber-500" />
                            <span className="font-semibold truncate text-xs tracking-wide">src</span>
                            <span className="text-[10px] text-gray-500 ml-auto">{filteredFiles.length} files</span>
                        </div>
                    </div>

                    {/* File List */}
                    {isFolderOpen && (
                        <div className="pl-2 flex flex-col gap-0.5 ml-2 border-l border-[#333]/50 transition-all duration-300">
                            {filteredFiles.length === 0 ? (
                                <div className="text-xs text-gray-500 py-4 text-center">
                                    {searchQuery ? 'No files match your search' : 'No files in project'}
                                </div>
                            ) : (
                                filteredFiles.map(file => {
                                    const isProtected = PROTECTED_FILES.includes(file.name);
                                    const isActive = activeFileName === file.name;
                                    const fileSize = file.content?.length || 0;

                                    return (
                                        <button
                                            key={file.name}
                                            className={`group flex items-center justify-between gap-2 px-3 py-2 text-xs rounded w-full text-left transition-all cursor-pointer border focus:outline-none focus:ring-1 focus:ring-sky-500/50 ${isActive
                                                ? 'bg-[#37373d] text-white border-sky-500/30'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e] border-transparent'
                                                }`}
                                            onClick={() => onSelectFile(file.name)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onSelectFile(file.name);
                                                }
                                            }}
                                            aria-current={isActive ? 'page' : undefined}
                                            aria-label={`Select ${file.name}`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="shrink-0" aria-hidden="true">{getFileIcon(file.name)}</span>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="truncate font-medium">{file.name}</span>
                                                    <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                                        <span>{getLanguageLabel(file.name)}</span>
                                                        <span aria-hidden="true">•</span>
                                                        <span>{formatSize(fileSize)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                                                {confirmDelete === file.name ? (
                                                    <div
                                                        className="flex items-center gap-1 bg-red-900/50 p-0.5 rounded animate-in fade-in slide-in-from-right-4 duration-200"
                                                        onClick={e => e.stopPropagation()}
                                                        role="group"
                                                        aria-label="Confirm deletion"
                                                    >
                                                        <span className="text-[10px] text-red-200 px-1">Sure?</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteFile(file.name); setConfirmDelete(null); }}
                                                            className="p-1 hover:bg-red-500 text-red-200 hover:text-white rounded transition-colors focus:outline-none focus:bg-red-500 focus:text-white"
                                                            title="Confirm Create"
                                                            aria-label="Confirm Delete"
                                                        >
                                                            <Check size={10} aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                                            className="p-1 hover:bg-[#555] text-gray-400 hover:text-white rounded transition-colors focus:outline-none focus:bg-[#555]"
                                                            title="Cancel"
                                                            aria-label="Cancel Delete"
                                                        >
                                                            <Trash2 size={10} className="rotate-45" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleCopyName(e, file.name)}
                                                            className="p-1 hover:bg-[#555] text-gray-400 hover:text-white rounded transition-colors focus:outline-none focus:bg-[#555]"
                                                            title="Copy filename"
                                                            aria-label={`Copy filename ${file.name}`}
                                                        >
                                                            {copiedFile === file.name ? <Check size={10} className="text-emerald-400" aria-hidden="true" /> : <Copy size={10} aria-hidden="true" />}
                                                        </button>
                                                        {!isProtected && !file.readOnly && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onRenameFile(file.name); }}
                                                                    className="p-1 hover:bg-[#555] text-gray-400 hover:text-sky-400 rounded transition-colors focus:outline-none focus:bg-[#555]"
                                                                    title="Rename"
                                                                    aria-label={`Rename ${file.name}`}
                                                                >
                                                                    <Edit2 size={10} aria-hidden="true" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(file.name); }}
                                                                    className="p-1 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded transition-colors focus:outline-none focus:bg-red-900/40"
                                                                    title="Delete"
                                                                    aria-label={`Delete ${file.name}`}
                                                                >
                                                                    <Trash2 size={10} aria-hidden="true" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Stats */}
            <div className="p-2 border-t border-[#1a1a1a] text-[10px] text-gray-500 flex justify-between items-center bg-[#252526]">
                <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${fileCount >= maxFiles ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    {fileCount}/{maxFiles} Files
                </span>
                <span>{formatSize(totalSize)} used</span>
            </div>
        </div>
    );
};

export default FileExplorer;

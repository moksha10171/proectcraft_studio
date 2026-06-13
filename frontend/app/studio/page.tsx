"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Zap, RefreshCw, Sparkles, MonitorPlay, Play, Square, Menu, GripVertical, ChevronDown, Home, GitCompare, PanelRightClose, PanelRightOpen, X, Bot, Plus, Check, Maximize2, Minimize2, Server, Activity } from 'lucide-react';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import { generateBreadcrumbs } from '@/lib/metadata-utils';
import { INITIAL_FILES, INITIAL_MANIFEST, RPI_INITIAL_FILES, RPI_INITIAL_MANIFEST } from '@/lib/arduino-studio/constants';
import { ProjectFile, WiringManifest, SimulationFrame, DeviceMode, RaspberryPiWiringManifest, RaspberryPiComponentType } from '@/lib/arduino-studio/types';
import MonacoCodeEditor from '@/components/arduino-studio/monaco-editor';
import dynamic from 'next/dynamic';

const SimulationPanel = dynamic(
  () => import('@/components/arduino-studio/simulation-panel'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[200px] items-center justify-center bg-[#0d1117] text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
      </div>
    ),
  }
);

const SerialConsole = dynamic(
  () => import('@/components/arduino-studio/serial-console'),
  { ssr: false }
);

const FileExplorer = dynamic(
  () => import('@/components/arduino-studio/file-explorer'),
  { ssr: false, loading: () => <div className="p-4 text-xs text-gray-500">Loading files…</div> }
);

import Terminal from '@/components/arduino-studio/terminal';
import DiffPreview, { FileChange } from '@/components/arduino-studio/diff-preview';
import ErrorBoundary from '@/components/arduino-studio/error-boundary';
import VerificationReminder from '@/components/arduino-studio/verification-reminder';
import ModelCard from '@/components/studio/ModelCard';
import AgentPanel from '@/components/studio/AgentPanel';
import ModelManager from '@/components/studio/ModelManager';
import { generateArduinoProject, simulateExecution, deriveWiringFromCode, verifyArduinoCode, generateRaspberryPiProject, verifyPythonCode } from '@/lib/arduino-studio/services/gemini-service';
import { safeStorage } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAgentEngine } from '@/hooks/useAgentEngine';
import styles from './studio.module.css';
import type { ModelSection, ToolCall, AgentState } from '@/lib/arduino-studio/agent-types';
import { createModelSection } from '@/lib/arduino-studio/agent-types';
import { buildToolContextPrompt, getSlashCommands } from '@/lib/arduino-studio/tool-registry';
import { buildWorkspaceSystemPrompt } from '@/lib/agent/workspace-agent';
import { buildSlashToolMessage } from '@/lib/agent/device-tools';
import {
  mapToolCallEntryToPanel,
  buildAgentStateFromEngine,
} from '@/lib/agent/agent-panel-bridge';
import { useStudioPersistence } from '@/hooks/useStudioPersistence';
import type { ToolResultPayload } from '@/hooks/useAgentEngine';

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const PROTECTED_FILES = ['sketch.ino', 'config.h', 'README.md'];

export default function StudioPage() {
  const persistence = useStudioPersistence();
  const codebaseHydratedRef = useRef(false);

  // ===== DEVICE MODE STATE =====
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('arduino');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // ... (keeping state the same)
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activeFileName, setActiveFileName] = useState<string | null>('sketch.ino');
  const [wiring, setWiring] = useState<WiringManifest | RaspberryPiWiringManifest>(INITIAL_MANIFEST);

  // Logic State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean, errors: string[] } | null>(null);
  const [simulationLogs, setSimulationLogs] = useState('');

  // Simulation Playback State
  const [simulationFrames, setSimulationFrames] = useState<SimulationFrame[]>([]);
  const playbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('studio-sidebar-open', true);
  const [sidebarWidth, setSidebarWidth] = useLocalStorage('studio-sidebar-width', 240);
  const [activeRightTab, setActiveRightTab] = useLocalStorage<'ai' | 'visualizer' | 'agent' | 'models'>('studio-active-right-tab', 'ai');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useLocalStorage('studio-right-panel-open', true);
  const hasInitialized = useRef(false);

  // ===== AGENT STATE =====
  const [modelSections, setModelSections] = useLocalStorage<ModelSection[]>('studio-model-sections', []);
  const activeModelSection = modelSections.find(m => m.isActive) ?? null;

  const activeModelConfig = activeModelSection?.apiKey && activeModelSection.apiKey.length > 10
    ? {
        provider: activeModelSection.provider as 'gemini' | 'groq' | 'openai' | 'anthropic' | 'custom',
        apiKey: activeModelSection.apiKey,
        model: activeModelSection.model,
        baseUrl: activeModelSection.baseUrl,
        temperature: activeModelSection.temperature,
        maxTokens: activeModelSection.maxTokens,
        systemPromptOverride: activeModelSection.systemPromptOverride,
        supportsNativeTools: activeModelSection.supportsNativeTools,
      }
    : undefined;

  const modelConfigured = !!activeModelConfig;

  const [rightPanelPercent, setRightPanelPercent] = useLocalStorage('studio-right-panel-percent', 45);
  const [serialHeight, setSerialHeight] = useLocalStorage('studio-serial-height', 200);
  const [isSerialOpen, setIsSerialOpen] = useLocalStorage('studio-serial-open', true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingSplit = useRef(false);
  const isResizingSerial = useRef(false);

  // Active Visual State
  const [activePinStates, setActivePinStates] = useState<Record<string, number>>({});

  // Selection State for AI Context
  const [currentSelection, setCurrentSelection] = useState<{ text: string; startLine: number; endLine: number } | null>(null);

  // Diff Preview State
  const [pendingChanges, setPendingChanges] = useState<FileChange[]>([]);
  const [showDiffPreview, setShowDiffPreview] = useState(false);

  // Code Quality Tracking
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [lastVerifiedHash, setLastVerifiedHash] = useState<string>('');
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  const [showModelCard, setShowModelCard] = useState(false);

  // Restore codebase from local persistence once loaded
  useEffect(() => {
    if (!persistence.isLoaded || codebaseHydratedRef.current) return;
    const saved = persistence.initialCodebase;
    if (saved) {
      setDeviceMode(saved.deviceMode);
      setFiles(saved.files);
      setWiring(saved.wiring);
      if (saved.activeFileName) setActiveFileName(saved.activeFileName);
    }
    codebaseHydratedRef.current = true;
  }, [persistence.isLoaded, persistence.initialCodebase]);

  // Persist codebase changes
  useEffect(() => {
    if (!persistence.isLoaded || !codebaseHydratedRef.current) return;
    persistence.saveCodebase({
      deviceMode,
      activeFileName,
      files,
      wiring,
    });
  }, [deviceMode, activeFileName, files, wiring, persistence.isLoaded, persistence.saveCodebase]);

  // Visualizer Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const activeFile = useMemo(() =>
    activeFileName ? files.find(f => f.name === activeFileName) : null,
    [activeFileName, files]
  );

  const agentSystemPrompt = useMemo(
    () => buildWorkspaceSystemPrompt(buildToolContextPrompt(), deviceMode),
    [deviceMode]
  );

  const applyAgentToolResult = useCallback((payload: ToolResultPayload) => {
    if (payload.files?.length) {
      setFiles(prev => {
        const changes: FileChange[] = [];
        const next = [...prev];
        for (const nf of payload.files!) {
          const idx = next.findIndex(f => f.name === nf.name);
          const existing = idx >= 0 ? next[idx] : null;
          if (existing && existing.content !== nf.content) {
            changes.push({
              path: nf.name,
              originalContent: existing.content,
              modifiedContent: nf.content,
              language: nf.name.split('.').pop(),
            });
          } else if (!existing) {
            changes.push({
              path: nf.name,
              originalContent: '',
              modifiedContent: nf.content,
              language: nf.name.split('.').pop(),
            });
          }
          if (idx >= 0) {
            next[idx] = { ...next[idx], content: nf.content };
          } else if (next.length < MAX_FILES) {
            next.push({
              name: nf.name,
              content: nf.content,
              type: nf.type === 'config' || nf.type === 'doc' ? nf.type : 'code',
            });
          }
        }
        if (changes.length > 0) {
          setPendingChanges(changes);
          setShowVerificationReminder(true);
        }
        return next;
      });
      setIsAIGenerated(true);
      const first = payload.files[0];
      if (first?.name) setActiveFileName(first.name);
    }
    if (payload.wiring) {
      setWiring(payload.wiring);
    }
  }, []);

  const agent = useAgentEngine(agentSystemPrompt, {
    getContext: () => ({
      files,
      deviceMode,
      currentCode: activeFile?.content,
      currentSelection: currentSelection?.text,
    }),
    modelConfig: activeModelConfig,
    onToolResult: applyAgentToolResult,
    initialMessages: persistence.initialChat?.messages,
    initialToolCalls: persistence.initialChat?.toolCalls,
    onPersist: (data) =>
      persistence.saveChat({
        messages: data.messages,
        agentHistory: persistence.initialChat?.agentHistory ?? [],
        toolCalls: data.toolCalls,
      }),
    onClearPersist: persistence.clearChatPersistence,
  });

  const agentPanelToolCalls = useMemo((): ToolCall[] =>
    agent.allToolCalls.map(entry =>
      mapToolCallEntryToPanel(
        entry,
        agentSystemPrompt,
        activeModelSection?.provider,
        activeModelSection?.model
      )
    ),
    [agent.allToolCalls, agentSystemPrompt, activeModelSection]
  );

  const agentPanelState = useMemo((): AgentState =>
    buildAgentStateFromEngine(agent.status, agent.activeToolCall),
    [agent.status, agent.activeToolCall]
  );

  const handleAgentMessage = useCallback((text: string) => {
    const slashCmds = getSlashCommands(deviceMode);
    for (const cmd of slashCmds) {
      if (!cmd.tool) continue;
      if (text === cmd.key || text.startsWith(cmd.key + ' ')) {
        const userPrompt = text.slice(cmd.key.length).trim() || (
          cmd.key === '/verify'
            ? 'Verify the current project code'
            : cmd.key === '/wiring'
              ? 'Derive wiring from current code'
              : cmd.key === '/optimize'
                  ? 'Optimize the current code'
                  : 'Build a project from the current context'
        );
        const summary = cmd.label.replace('/', '');
        agent.sendMessage(buildSlashToolMessage(cmd.tool, userPrompt, summary));
        return;
      }
    }
    agent.sendMessage(text);
  }, [deviceMode, agent, agent.sendMessage]);

  // ===== MODE SWITCHING HANDLER =====
  const handleModeSwitch = useCallback((newMode: DeviceMode) => {
    if (newMode === deviceMode) {
      setShowModeDropdown(false);
      return;
    }

    // Stop any running simulation
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
      playbackTimer.current = null;
    }

    // Reset state for new mode
    if (newMode === 'arduino') {
      setFiles(INITIAL_FILES);
      setActiveFileName('sketch.ino');
      setWiring(INITIAL_MANIFEST);
    } else {
      setFiles(RPI_INITIAL_FILES);
      setActiveFileName('main.py');
      setWiring(RPI_INITIAL_MANIFEST);
    }

    // Reset simulation and validation
    setSimulationFrames([]);
    setSimulationLogs('');
    setValidationResult(null);
    setActivePinStates({});
    setIsRunning(false);

    agent.clearHistory();

    setDeviceMode(newMode);
    setShowModeDropdown(false);
  }, [deviceMode, agent.clearHistory]);

  // Responsive Init & Global Resize Listeners
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const desktop = window.innerWidth >= 1024;
      const wasMobile = isMobile;
      const wasTablet = isTablet;
      const isSwitchingFromDesktop = !wasMobile && !wasTablet && (mobile || tablet);
      const isSwitchingToDesktop = (wasMobile || wasTablet) && !mobile && !tablet;
      const isInitialLoad = !hasInitialized.current;

      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        // Mobile: Stack vertically
        setRightPanelPercent(100);
        setSerialHeight(150); // Smaller serial console on mobile

        // Set defaults on initial load or when switching from desktop/tablet
        if (isInitialLoad || isSwitchingFromDesktop) {
          if (sidebarOpen) setSidebarOpen(false);
          if (rightPanelOpen) setRightPanelOpen(false); // Hide right panel on mobile by default
        }
      } else if (tablet) {
        // Tablet: Adjust panel sizes
        setRightPanelPercent(50);
        setSerialHeight(180);

        // Set defaults on initial load or when switching from desktop
        if (isInitialLoad || isSwitchingFromDesktop) {
          if (rightPanelOpen) setRightPanelOpen(false); // Hide right panel on tablet by default
        }
      } else {
        // Desktop: Full layout
        setRightPanelPercent(45);
        setSerialHeight(200);

        // Set defaults on initial load or when switching from mobile/tablet
        if (isInitialLoad || isSwitchingToDesktop) {
          if (!sidebarOpen) setSidebarOpen(true);
          if (!rightPanelOpen) setRightPanelOpen(true); // Show right panel on desktop
        }
      }

      hasInitialized.current = true;
    };

    // Initial check
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isResizingSplit.current && containerRef.current) {
        e.preventDefault();
        const containerRect = containerRef.current.getBoundingClientRect();
        const newRightWidth = containerRect.right - e.clientX;
        const totalWidth = containerRect.width;
        const rawPercent = (newRightWidth / totalWidth) * 100;
        const clampedPercent = Math.max(20, Math.min(80, rawPercent));
        setRightPanelPercent(clampedPercent);
      }

      if (isResizingSerial.current) {
        e.preventDefault();
        const newHeight = window.innerHeight - e.clientY;
        setSerialHeight(Math.max(100, Math.min(600, newHeight)));
      }
    };

    const handleGlobalMouseUp = () => {
      if (isResizingSplit.current || isResizingSerial.current) {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        isResizingSplit.current = false;
        isResizingSerial.current = false;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResizingSidebar = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      setSidebarWidth(Math.max(180, Math.min(newWidth, 400)));
    };
    const onMouseUp = () => {
      document.body.style.cursor = 'default';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const startResizingSplit = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSplit.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startResizingSerial = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingSerial.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // ... File Ops ...
  const handleFileChange = useCallback((newContent: string) => {
    if (!activeFileName) return;
    if (newContent.length > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds limit of 2MB.`);
      return;
    }
    setValidationResult(null);
    setFiles(prev => prev.map(f => f.name === activeFileName ? { ...f, content: newContent } : f));
  }, [activeFileName]);

  const validateFileName = (name: string): string | null => {
    const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '');
    return sanitized || null;
  };

  const handleAddFile = useCallback(() => {
    if (files.length >= MAX_FILES) { alert(`Maximum of ${MAX_FILES} files allowed.`); return; }
    const fileName = window.prompt("Enter new file name (e.g., helper.cpp):");
    if (!fileName) return;

    const sanitized = validateFileName(fileName);
    if (!sanitized) { alert("Invalid file name. Use letters, numbers, dots, dashes, or underscores."); return; }
    if (files.some(f => f.name === sanitized)) { alert("File already exists."); return; }

    const newFile: ProjectFile = {
      name: sanitized,
      content: sanitized.endsWith('.h') ? '#ifndef HEADER_H\n#define HEADER_H\n\n#endif' : '// New file\n',
      type: sanitized.endsWith('.h') || sanitized.endsWith('.json') ? 'config' : 'code'
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileName(sanitized);
  }, [files]);

  const handleRenameFile = useCallback((oldName: string) => {
    if (PROTECTED_FILES.includes(oldName)) { alert(`Cannot rename system file: ${oldName}`); return; }

    const newName = window.prompt(`Rename ${oldName} to:`, oldName);
    if (!newName || newName === oldName) return;

    const sanitized = validateFileName(newName);
    if (!sanitized) { alert("Invalid file name."); return; }
    if (files.some(f => f.name === sanitized)) { alert("File already exists."); return; }

    setFiles(prev => prev.map(f => f.name === oldName ? { ...f, name: sanitized } : f));
    if (activeFileName === oldName) setActiveFileName(sanitized);
  }, [files, activeFileName]);

  const handleDeleteFile = useCallback((name: string) => {
    if (PROTECTED_FILES.includes(name)) { alert(`Cannot delete system file: ${name}`); return; }

    if (confirm(`Delete ${name}?`)) {
      const newFiles = files.filter(f => f.name !== name);
      setFiles(newFiles);
      if (activeFileName === name) setActiveFileName(newFiles.length > 0 ? newFiles[0].name : null);
    }
  }, [files, activeFileName]);

  // ... AI & Sim Ops ...
  const handleVerify = useCallback(async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setSimulationLogs(prev => prev + `\n[COMPILER] Verifying ${deviceMode === 'arduino' ? 'sketch' : 'Python code'}...\n`);
    try {
      const result = deviceMode === 'arduino'
        ? await verifyArduinoCode(files)
        : await verifyPythonCode(files);
      setValidationResult({ valid: result.valid, errors: result.errors });
      setSimulationLogs(prev => prev + (result.valid ? `[COMPILER] ✓ Success: ${deviceMode === 'arduino' ? 'Sketch compiled' : 'Python syntax valid'}.\n` : `[COMPILER] ✗ Failed. See problems panel.\n`));

      // Mark as verified if successful
      if (result.valid) {
        setShowVerificationReminder(false);
        // Create hash of current code for tracking
        const codeHash = files.map(f => f.content).join('').length.toString();
        setLastVerifiedHash(codeHash);
      }
    } catch {
      setSimulationLogs(prev => prev + "[COMPILER] Verification failed due to network error.\n");
      setValidationResult({ valid: false, errors: ["Network Error: Could not verify code."] });
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, deviceMode, files]);

  const handleSyncWiring = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const newWiring = await deriveWiringFromCode(files);
      if (newWiring && newWiring.components.length > 0) {
        setWiring(newWiring);
        setSimulationLogs(prev => prev + `\n[SYSTEM] Wiring synced from code.\n`);
      } else {
        setSimulationLogs(prev => prev + `\n[SYSTEM] No components detected or API unavailable. Retaining current wiring.\n`);
      }
    } catch {
      setSimulationLogs(prev => prev + `\n[ERROR] Sync failed.\n`);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, files]);

  // Fullscreen Handler
  const toggleFullscreen = useCallback(async () => {
    if (!visualizerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await visualizerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const stopSimulation = useCallback(() => {
    if (playbackTimer.current) clearInterval(playbackTimer.current);
    playbackTimer.current = null;
    setIsRunning(false);
    setActivePinStates({});
    setSimulationFrames([]);
    setSimulationLogs(prev => prev + "\n[SYSTEM] Simulation stopped.\n");
  }, []);

  const handleRunSimulation = async () => {
    if (isRunning) {
      stopSimulation();
      return;
    }

    // Validate that we have components to simulate
    if (!wiring.components || wiring.components.length === 0) {
      setSimulationLogs("[ERROR] No components detected. Use AI chat to create a circuit first.\n");
      return;
    }

    // Init UI
    setActiveRightTab('visualizer');
    setIsRunning(true);
    setSimulationLogs("[SYSTEM] Initializing Physics Engine...\n");
    setIsSerialOpen(true);

    // Initialize default pin states for all components
    const defaultPinStates: Record<string, number> = {};
    wiring.components.forEach(comp => {
      defaultPinStates[String(comp.pin)] = 0;
    });
    setActivePinStates(defaultPinStates);

    setTimeout(async () => {
      try {
        // Raspberry Pi mode - show message and animate board
        if (deviceMode === 'raspberry-pi') {
          setSimulationLogs(prev => prev + "[SYSTEM] Raspberry Pi simulation mode active.\n");
          setSimulationLogs(prev => prev + "[INFO] Python GPIO simulation started.\n");

          // Generate realistic mock frames based on actual components in wiring
          const frames: SimulationFrame[] = [];
          const components = (wiring as RaspberryPiWiringManifest).components || [];

          setSimulationLogs(prev => prev + `[INFO] Simulating ${components.length} connected components...\n`);

          // Generate frames in chunks to avoid blocking UI
          const CHUNK_SIZE = 50; // Generate 50 frames at a time
          const TOTAL_FRAMES = 300;
          let frameIndex = 0;

          const generateChunk = () => {
            const chunkEnd = Math.min(frameIndex + CHUNK_SIZE, TOTAL_FRAMES);
            
            for (let i = frameIndex; i < chunkEnd; i++) {
              const pinStates: Record<string, number> = {};
              let logOutput: string | null = null;
              const timestamp = new Date(Date.now() + i * 50);
              const timeStr = timestamp.toTimeString().split(' ')[0];

              components.forEach(comp => {
              const pin = String(comp.pin);

              switch (comp.type) {
                // GPIO Basics
                case RaspberryPiComponentType.GPIO_LED:
                case RaspberryPiComponentType.RGB_LED:
                case RaspberryPiComponentType.WS2812_NEOPIXEL:
                  pinStates[pin] = i % 20 < 10 ? 1 : 0; // Blink 1Hz
                  break;
                case RaspberryPiComponentType.GPIO_BUZZER:
                  pinStates[pin] = i % 60 < 10 ? 1 : 0; // Beep every 3s
                  break;
                case RaspberryPiComponentType.GPIO_BUTTON:
                case RaspberryPiComponentType.TOUCH_SENSOR:
                  pinStates[pin] = Math.random() > 0.9 ? 1 : 0;
                  break;
                case RaspberryPiComponentType.GPIO_RELAY:
                case RaspberryPiComponentType.RELAY_MODULE:
                case RaspberryPiComponentType.SSR_RELAY:
                  pinStates[pin] = i % 100 < 50 ? 1 : 0; // Toggle every 5s
                  break;

                // Environmental Sensors - always powered, emit readings
                case RaspberryPiComponentType.BME280:
                case RaspberryPiComponentType.BME680:
                case RaspberryPiComponentType.BMP280:
                case RaspberryPiComponentType.DHT_SENSOR:
                case RaspberryPiComponentType.DS18B20:
                case RaspberryPiComponentType.SHT31:
                case RaspberryPiComponentType.AHT20:
                  pinStates[pin] = 1;
                  if (i % 40 === 0) {
                    const temp = (22 + Math.random() * 5).toFixed(1);
                    const hum = (45 + Math.random() * 20).toFixed(0);
                    const pres = (1013 + Math.random() * 10).toFixed(0);
                    logOutput = `[${timeStr}] ${comp.label}: T=${temp}°C H=${hum}% P=${pres}hPa\n`;
                  }
                  break;
                case RaspberryPiComponentType.CCS811:
                  pinStates[pin] = 1;
                  if (i % 50 === 0) {
                    const co2 = Math.floor(400 + Math.random() * 600);
                    const tvoc = Math.floor(10 + Math.random() * 100);
                    logOutput = `[${timeStr}] Air Quality: CO2=${co2}ppm TVOC=${tvoc}ppb\n`;
                  }
                  break;

                // Motion Sensors
                case RaspberryPiComponentType.PIR_SENSOR:
                  pinStates[pin] = Math.random() > 0.95 ? 1 : 0;
                  if (pinStates[pin] === 1) logOutput = `[${timeStr}] MOTION DETECTED!\n`;
                  break;
                case RaspberryPiComponentType.ULTRASONIC:
                case RaspberryPiComponentType.VL53L0X:
                case RaspberryPiComponentType.VL53L1X:
                  pinStates[pin] = Math.floor(50 + Math.sin(i / 20) * 100 + 100);
                  if (i % 30 === 0) logOutput = `[${timeStr}] Distance: ${pinStates[pin]}mm\n`;
                  break;

                // IMU Sensors
                case RaspberryPiComponentType.MPU6050:
                case RaspberryPiComponentType.MPU9250:
                case RaspberryPiComponentType.ADXL345:
                case RaspberryPiComponentType.HMC5883L:
                  pinStates[pin] = Math.floor(Math.random() * 360);
                  break;
                case RaspberryPiComponentType.APDS9960:
                  pinStates[pin] = Math.floor(Math.random() * 5); // Gesture index
                  break;

                // Motors & Actuators
                case RaspberryPiComponentType.SERVO:
                case RaspberryPiComponentType.PCA9685:
                  pinStates[pin] = i % 40 < 20 ? 1 : 0;
                  break;
                case RaspberryPiComponentType.DC_MOTOR:
                case RaspberryPiComponentType.STEPPER:
                case RaspberryPiComponentType.L298N:
                case RaspberryPiComponentType.TB6612:
                  pinStates[pin] = 1;
                  break;

                // Displays - always on
                case RaspberryPiComponentType.SSD1306_OLED:
                case RaspberryPiComponentType.SH1106_OLED:
                case RaspberryPiComponentType.LCD_I2C:
                case RaspberryPiComponentType.ST7735_TFT:
                case RaspberryPiComponentType.ILI9341_TFT:
                case RaspberryPiComponentType.MAX7219_MATRIX:
                case RaspberryPiComponentType.TM1637_7SEG:
                case RaspberryPiComponentType.E_PAPER:
                  pinStates[pin] = i; // Use frame index for animations
                  break;

                // Communication - connection simulation
                case RaspberryPiComponentType.GPS_MODULE:
                  pinStates[pin] = 1;
                  if (i % 20 === 0) {
                    const lat = (17.385 + Math.random() * 0.01).toFixed(6);
                    const lon = (78.486 + Math.random() * 0.01).toFixed(6);
                    logOutput = `[${timeStr}] GPS: ${lat},${lon} SAT:${Math.floor(6 + Math.random() * 6)}\n`;
                  }
                  break;
                case RaspberryPiComponentType.RFID_RC522:
                case RaspberryPiComponentType.PN532_NFC:
                  pinStates[pin] = Math.random() > 0.8 ? 1 : 0;
                  if (pinStates[pin] === 1 && i % 10 === 0) {
                    logOutput = `[${timeStr}] Card detected: ${Math.random().toString(16).substring(2, 10).toUpperCase()}\n`;
                  }
                  break;
                case RaspberryPiComponentType.NRF24L01:
                case RaspberryPiComponentType.HC12_RADIO:
                case RaspberryPiComponentType.LORA_SX1276:
                  pinStates[pin] = Math.floor(Math.random() * 5); // Signal strength
                  break;
                case RaspberryPiComponentType.BLUETOOTH_HC05:
                case RaspberryPiComponentType.ESP_WIFI:
                  pinStates[pin] = Math.random() > 0.3 ? 1 : 0; // Connected status
                  break;

                // HATs
                case RaspberryPiComponentType.SENSE_HAT:
                case RaspberryPiComponentType.UNICORN_HAT:
                  pinStates[pin] = i; // Animation frame
                  break;
                case RaspberryPiComponentType.MOTOR_HAT:
                  pinStates[pin] = i % 3;
                  break;

                // Input
                case RaspberryPiComponentType.KEYPAD:
                case RaspberryPiComponentType.ROTARY_ENCODER:
                case RaspberryPiComponentType.JOYSTICK:
                  pinStates[pin] = i % 360;
                  break;
                case RaspberryPiComponentType.LOAD_CELL_HX711:
                  pinStates[pin] = Math.floor(Math.random() * 1000);
                  break;

                // Power & RTC
                case RaspberryPiComponentType.RTC_DS3231:
                case RaspberryPiComponentType.RTC_DS1307:
                case RaspberryPiComponentType.INA219:
                case RaspberryPiComponentType.INA226:
                  pinStates[pin] = 1;
                  break;

                // Camera
                case RaspberryPiComponentType.PI_CAMERA:
                case RaspberryPiComponentType.PI_CAMERA_HQ:
                case RaspberryPiComponentType.AMG8833:
                  pinStates[pin] = 1;
                  break;

                // ADC
                case RaspberryPiComponentType.MCP3008:
                case RaspberryPiComponentType.ADS1115:
                case RaspberryPiComponentType.LDR:
                case RaspberryPiComponentType.SOIL_MOISTURE:
                case RaspberryPiComponentType.WATER_SENSOR:
                case RaspberryPiComponentType.GAS_SENSOR:
                  pinStates[pin] = Math.floor(Math.random() * 1024);
                  break;

                // Fan
                case RaspberryPiComponentType.FAN:
                case RaspberryPiComponentType.FAN_PWM:
                  pinStates[pin] = 1;
                  break;

                default:
                  // Generic handling
                  if (String(comp.type).includes('SENSOR') || String(comp.type).includes('MODULE')) {
                    pinStates[pin] = 1;
                  } else {
                    pinStates[pin] = i % 20 < 10 ? 1 : 0;
                  }
              }
            });

              frames.push({
                timestamp: i * 50,
                pinStates: pinStates,
                serialOutput: logOutput,
                log: null
              });
            }

            frameIndex = chunkEnd;

            // Continue generating chunks if not done
            if (frameIndex < TOTAL_FRAMES) {
              // Use setTimeout to yield to browser, allowing UI updates
              setTimeout(generateChunk, 0);
            } else {
              // All frames generated, start playback
              setSimulationFrames(frames);
              let currentIndex = 0;
              playbackTimer.current = setInterval(() => {
                if (currentIndex >= frames.length) currentIndex = 0;
                setActivePinStates(frames[currentIndex].pinStates || {});
                if (frames[currentIndex].serialOutput) {
                  setSimulationLogs(prev => prev + frames[currentIndex].serialOutput);
                }
                currentIndex++;
              }, 50);
            }
          };

          // Start generating frames
          generateChunk();
          return;
        }

        // If we reach here, we need to set up playback for Arduino mode
        // (keeping existing Arduino logic below)


        // Arduino mode - use existing wiring, skip detection if issues
        let detectedWiring = wiring as WiringManifest;

        // Only try to detect wiring if we have code files
        const codeFiles = files.filter(f => f.type === 'code' && (f.name.endsWith('.ino') || f.name.endsWith('.h')));
        if (codeFiles.length > 0) {
          try {
            setSimulationLogs(prev => prev + "[SYSTEM] Analyzing code for components...\n");
            const result = await deriveWiringFromCode(files);
            if (result && result.components && result.components.length > 0) {
              detectedWiring = result;
              setWiring(result);
              setSimulationLogs(prev => prev + `[SYSTEM] Detected ${result.components.length} components.\n`);
            } else {
              setSimulationLogs(prev => prev + "[SYSTEM] No components detected in code. Using existing configuration.\n");
            }
          } catch (error) {
            setSimulationLogs(prev => prev + "[WARN] Wiring detection failed. Using existing configuration.\n");
            console.warn('Wiring detection error:', error);
          }
        } else {
          setSimulationLogs(prev => prev + "[SYSTEM] No Arduino code files found. Using existing wiring.\n");
        }

        // Validate we still have components after detection
        if (!detectedWiring.components || detectedWiring.components.length === 0) {
          setSimulationLogs(prev => prev + "[ERROR] No components configured. Use AI to generate a circuit.\n");
          setIsRunning(false);
          return;
        }

        // Run simulation with detected or existing wiring
        setSimulationLogs(prev => prev + `[SYSTEM] Starting simulation with ${detectedWiring.components.length} component(s)...\n`);
        const result = await simulateExecution(files, detectedWiring);

        if (!result.success) {
          setSimulationLogs(prev => prev + `[ERROR] Simulation Error: ${result.error || 'Unknown error occurred'}\n`);
          setIsRunning(false);
          return;
        }

        if (!result.frames || result.frames.length === 0) {
          setSimulationLogs(prev => prev + "[WARN] No simulation frames generated. Check your code and wiring configuration.\n");
          setIsRunning(false);
          return;
        }

        setSimulationFrames(result.frames);
        setSimulationLogs(prev => prev + `[SYSTEM] Engine Ready. Executing ${result.frames.length} ticks...\n`);

        let currentIndex = 0;
        const STEP_TIME_MS = 50;

        playbackTimer.current = setInterval(() => {
          if (currentIndex >= result.frames.length) {
            currentIndex = 0;
            setSimulationLogs(prev => prev + "[SYSTEM] Loop Reset.\n");
          }

          const frame = result.frames[currentIndex];
          setActivePinStates(frame.pinStates || {});

          if (frame.serialOutput) {
            setSimulationLogs(prev => prev + frame.serialOutput);
          }

          currentIndex++;

        }, STEP_TIME_MS);

      } catch (err) {
        console.error(err);
        setSimulationLogs(prev => prev + "\n[CRITICAL] Runtime Exception. Check console.\n");

        // Fixed: Cleanup timer on error
        if (playbackTimer.current) {
          clearInterval(playbackTimer.current);
          playbackTimer.current = null;
        }

        setIsRunning(false);
      }
    }, 10);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Verify
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleVerify();
      }
      // Ctrl+Shift+E: Toggle Explorer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl+Shift+P: Toggle Right Panel (AI/Visualizer)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setRightPanelOpen(prev => !prev);
      }
      // Ctrl+N: Add File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleVerify, handleAddFile]);

  // Responsive layout styles
  const splitStyle = !isMobile
    ? { width: rightPanelOpen ? `${100 - rightPanelPercent}%` : '100%', minWidth: '300px', transition: 'width 0.3s ease' }
    : { height: rightPanelOpen ? '45%' : '100%', width: '100%', minHeight: '250px', transition: 'height 0.3s ease' };
  const rightStyle = !isMobile && !isTablet
    ? {
      width: rightPanelOpen ? `${rightPanelPercent}%` : '0%',
      minWidth: rightPanelOpen ? '320px' : '0px',
      maxWidth: rightPanelOpen ? '50%' : '0px',
      overflow: rightPanelOpen ? 'visible' : 'hidden',
      borderLeft: rightPanelOpen ? '1px solid #333' : 'none',
      opacity: rightPanelOpen ? 1 : 0,
      pointerEvents: (rightPanelOpen ? 'auto' : 'none') as 'auto' | 'none',
      transition: 'width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease'
    }
    : {};

  // Determine sidebar visual width
  const currentSidebarWidth = isMobile
    ? (sidebarOpen ? sidebarWidth : 0)
    : (sidebarOpen ? sidebarWidth : 48); // 48px = w-12

  // Check for API key
  const hasApiKey = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Diff Preview Handlers
  const handleAcceptChange = (path: string) => {
    const change = pendingChanges.find(c => c.path === path);
    if (!change) return;

    setFiles(prev => {
      const newFiles = [...prev];
      const idx = newFiles.findIndex(f => f.name === path);
      if (idx >= 0) {
        newFiles[idx] = { ...newFiles[idx], content: change.modifiedContent };
      } else if (newFiles.length < MAX_FILES) {
        newFiles.push({
          name: path,
          content: change.modifiedContent,
          type: path.endsWith('.h') || path.endsWith('.json') ? 'config' : 'code'
        });
      }
      return newFiles;
    });

    setPendingChanges(prev => prev.filter(c => c.path !== path));
    if (pendingChanges.length === 1) setShowDiffPreview(false);
  };

  const handleAcceptAllChanges = () => {
    pendingChanges.forEach(change => {
      setFiles(prev => {
        const newFiles = [...prev];
        const idx = newFiles.findIndex(f => f.name === change.path);
        if (idx >= 0) {
          newFiles[idx] = { ...newFiles[idx], content: change.modifiedContent };
        } else if (newFiles.length < MAX_FILES) {
          newFiles.push({
            name: change.path,
            content: change.modifiedContent,
            type: change.path.endsWith('.h') || change.path.endsWith('.json') ? 'config' : 'code'
          });
        }
        return newFiles;
      });
    });
    setPendingChanges([]);
    setShowDiffPreview(false);
  };

  const handleRejectChange = (path: string) => {
    setPendingChanges(prev => prev.filter(c => c.path !== path));
    if (pendingChanges.length === 1) setShowDiffPreview(false);
  };

  const handleRejectAllChanges = () => {
    setPendingChanges([]);
    setShowDiffPreview(false);
  };

  return (
    <ErrorBoundary fallbackTitle="Studio Error" fallbackMessage="The Studio encountered an error. Your code should still be saved in your browser.">
      <BreadcrumbSchema items={generateBreadcrumbs('/studio')} />
      <div className={`${styles.studioContainer} flex flex-col h-screen w-full bg-[#1e1e1e] text-gray-300 overflow-hidden font-sans`}>

        {/* Diff Preview Modal */}
        {showDiffPreview && pendingChanges.length > 0 && (
          <DiffPreview
            changes={pendingChanges}
            onAccept={handleAcceptChange}
            onAcceptAll={handleAcceptAllChanges}
            onReject={handleRejectChange}
            onRejectAll={handleRejectAllChanges}
            onClose={() => setShowDiffPreview(false)}
          />
        )}

        {/* Header */}
        <header className="h-12 bg-[#1e1e1e]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 justify-between select-none shrink-0 z-20 shadow-sm relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/10 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-3 relative z-10">
            {/* Back to Main Site */}
            <Link
              href="/"
              className="p-1.5 -ml-1 hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Back to ProjectCraft"
            >
              <Home size={16} />
            </Link>

            {/* Model Info Trigger */}
            <button
              onClick={() => setShowModelCard(true)}
              className="p-1.5 hover:bg-[#333] rounded-lg text-teal-500 hover:text-teal-400 transition-colors"
              title="View AI Model Info"
            >
              <Bot size={18} />
            </button>

            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-[#333] rounded text-gray-400">
                <Menu size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-100 tracking-tight text-sm md:text-base">
                ProjectCraft <span className="text-teal-500 font-normal">Studio</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded uppercase tracking-wider shadow-sm">BETA</span>
              </h1>

              {/* Mode Selector - Functional Dropdown */}
              <div className="hidden md:flex items-center ml-6 relative z-50">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="flex items-center bg-[#1a1a1a] rounded-md border border-[#333] px-3 py-1.5 gap-2 cursor-pointer hover:border-[#444] transition-all group"
                >
                  <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${deviceMode === 'arduino' ? 'bg-teal-500 text-teal-500' : 'bg-pink-500 text-pink-500'}`}></span>
                  <span className="text-xs font-semibold text-gray-200">Mode: {deviceMode === 'arduino' ? 'Arduino' : 'Raspberry Pi'}</span>
                  <ChevronDown size={14} className={`text-gray-500 group-hover:text-gray-300 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showModeDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#333] rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden">
                    <button
                      onClick={() => handleModeSwitch('arduino')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#333] transition-colors ${deviceMode === 'arduino' ? 'bg-[#333]' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      <span className="text-sm text-gray-200">Arduino</span>
                      {deviceMode === 'arduino' && <span className="ml-auto text-teal-500 text-xs">✓</span>}
                    </button>
                    <button
                      onClick={() => handleModeSwitch('raspberry-pi')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#333] transition-colors ${deviceMode === 'raspberry-pi' ? 'bg-[#333]' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      <span className="text-sm text-gray-200">Raspberry Pi</span>
                      {deviceMode === 'raspberry-pi' && <span className="ml-auto text-pink-500 text-xs">✓</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            {/* Right Panel Toggle - Show on all screen sizes */}
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-2 hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors"
              title={rightPanelOpen ? "Hide AI/Visualizer" : "Show AI/Visualizer"}
              aria-label={rightPanelOpen ? "Hide right panel" : "Show right panel"}
            >
              {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>

            {/* Powered By & Version Badge */}
            <div className="hidden md:flex items-center gap-3">

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 rounded-full border border-teal-500/20">
                <span className="text-teal-400 font-bold">v0.5</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Backdrop for Mobile Sidebar */}
          {isMobile && sidebarOpen && (
            <div className="absolute inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Backdrop for Right Panel on Mobile/Tablet */}
          {(isMobile || isTablet) && rightPanelOpen && (
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setRightPanelOpen(false)}
              style={{ zIndex: 45 }}
            />
          )}

          {/* Sidebar Container */}
          <div
            className={`flex flex-col shrink-0 bg-[#1e1e1e]/90 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out shadow-xl ${isMobile ? 'absolute top-0 bottom-0 left-0' : 'relative'}`}
            style={{
              width: currentSidebarWidth,
              transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'none',
              overflow: 'hidden', // Ensures collapsed content doesn't bleed
              borderRight: '1px solid #111'
            }}
          >
            <FileExplorer
              files={files}
              activeFileName={activeFileName || ''}
              onSelectFile={setActiveFileName}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            {/* Sidebar Footer / New File */}
            {sidebarOpen && (
              <div className="p-2 border-t border-white/5">
                <button
                  onClick={handleAddFile}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-900/30 to-teal-800/30 hover:from-teal-800/40 hover:to-teal-700/40 border border-teal-500/20 text-teal-400 hover:text-teal-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-teal-900/10"
                >
                  <Plus size={14} /> New File
                </button>
              </div>
            )}
            {/* Resizer Overlay */}
            {sidebarOpen && !isMobile && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-sky-600/50 z-50 flex items-center justify-center group"
                onMouseDown={startResizingSidebar}
              >
                <div className="h-8 w-0.5 bg-gray-600 group-hover:bg-sky-400 rounded-full transition-colors"></div>
              </div>
            )}
          </div>

          {/* Workspace Area - Resizable Split */}
          <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row min-w-0 bg-[#1e1e1e] relative overflow-hidden">

            {/* LEFT PANEL: Code Editor */}
            <div className="flex flex-col relative min-w-[200px]" style={splitStyle}>
              {/* Verification Reminder */}
              {showVerificationReminder && isAIGenerated && !validationResult?.valid && (
                <VerificationReminder
                  isAIGenerated={isAIGenerated}
                  isVerified={validationResult?.valid || false}
                  onVerify={handleVerify}
                  onDismiss={() => setShowVerificationReminder(false)}
                />
              )}

              <ErrorBoundary fallbackTitle="Editor Error" fallbackMessage="The code editor encountered an error. Try refreshing the page.">
                {React.useMemo(() => {
                  if (!activeFile) {
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e]">
                        <div className="w-20 h-20 bg-[#252526] rounded-full flex items-center justify-center mb-4 border border-[#333]">
                          <Zap size={32} className="text-teal-600 opacity-50" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-400">No File Selected</h2>
                        <button onClick={handleAddFile} className="mt-4 px-4 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] rounded text-sm transition-colors text-sky-500">
                          Create New File
                        </button>
                      </div>
                    );
                  }

                  // Determine language based on file extension
                  const ext = activeFile.name.split('.').pop()?.toLowerCase() || '';
                  const languageMap: Record<string, string> = {
                    'py': 'python',
                    'ino': 'ino',
                    'h': 'cpp',
                    'cpp': 'cpp',
                    'c': 'cpp',
                    'json': 'json',
                    'md': 'markdown'
                  };
                  const language = languageMap[ext] || 'ino';

                  // Determine if verifiable
                  const isVerifiable = deviceMode === 'arduino'
                    ? ['ino', 'h', 'cpp', 'c'].includes(ext)
                    : ext === 'py';

                  return (
                    <MonacoCodeEditor
                      code={activeFile.content}
                      onChange={handleFileChange}
                      language={language}
                      readOnly={activeFile.readOnly}
                      onVerify={isVerifiable ? handleVerify : undefined}
                      isVerifying={isVerifying}
                      errors={validationResult?.valid === false ? validationResult.errors : null}
                      onSelectionChange={setCurrentSelection}
                    />
                  );
                }, [activeFile, handleFileChange, deviceMode, handleVerify, isVerifying, validationResult, handleAddFile])}
              </ErrorBoundary>

              {/* Floating Actions for AI Changes */}
              {pendingChanges.length > 0 && (
                <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <button
                    onClick={handleAcceptAllChanges}
                    className="flex items-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-teal-900/50 transition-all transform hover:scale-105"
                  >
                    <Check size={18} />
                    Accept All Changes
                  </button>
                  <button
                    onClick={() => setShowDiffPreview(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#252526] hover:bg-[#333] text-gray-300 font-medium text-xs rounded-lg border border-white/10 shadow-lg backdrop-blur"
                  >
                    <GitCompare size={14} /> Review Diff
                  </button>
                </div>
              )}
            </div>

            {/* SPLIT RESIZER */}
            {!isMobile && !isTablet && rightPanelOpen && (
              <div
                className="w-1.5 bg-[#18181b] hover:bg-sky-600/50 cursor-col-resize z-20 flex flex-col justify-center items-center group transition-colors select-none"
                onMouseDown={startResizingSplit}
              >
                <GripVertical size={12} className="text-gray-600 group-hover:text-white transition-colors" />
              </div>
            )}

            {/* RIGHT PANEL: AI & Visualizer */}
            <div
              className={`flex flex-col border-l border-[#333] transition-all duration-300 ease-in-out ${(isMobile || isTablet)
                ? 'absolute top-0 bottom-0 right-0 shadow-2xl'
                : 'relative'
                }`}
              style={{
                ...rightStyle,
                ...((isMobile || isTablet) ? {
                  zIndex: 50,
                  ...(rightPanelOpen ? {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: '100%',
                    transform: 'translateX(0)',
                    pointerEvents: 'auto' as const
                  } : {
                    transform: 'translateX(100%)',
                    width: '0%',
                    minWidth: '0px',
                    overflow: 'hidden',
                    pointerEvents: 'none' as const
                  })
                } : {})
              }}
            >

              {/* Tabs */}
              <div className="h-12 bg-[#252526] border-b border-[#333] flex items-end px-2 gap-1 shrink-0 select-none justify-between">
                <div className="flex gap-1 h-full pt-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveRightTab('ai')}
                    className={`px-4 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-all whitespace-nowrap uppercase tracking-wide ${activeRightTab === 'ai' ? 'bg-[#1e1e1e] text-white border-t border-x border-[#333] h-full relative top-[1px] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#333] h-[calc(100%-4px)] mt-[4px]'}`}
                  >
                    <Sparkles size={14} className={activeRightTab === 'ai' ? "text-sky-500" : "text-gray-500"} /> AI Architect
                  </button>
                  <button
                    onClick={() => setActiveRightTab('visualizer')}
                    className={`px-4 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-all whitespace-nowrap uppercase tracking-wide ${activeRightTab === 'visualizer' ? 'bg-[#1e1e1e] text-white border-t border-x border-[#333] h-full relative top-[1px] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#333] h-[calc(100%-4px)] mt-[4px]'}`}
                  >
                    <MonitorPlay size={14} className={activeRightTab === 'visualizer' ? "text-teal-500" : "text-gray-500"} /> Visualizer
                  </button>
                  <button
                    onClick={() => setActiveRightTab('agent')}
                    className={`px-4 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-all whitespace-nowrap uppercase tracking-wide ${activeRightTab === 'agent' ? 'bg-[#1e1e1e] text-white border-t border-x border-[#333] h-full relative top-[1px] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#333] h-[calc(100%-4px)] mt-[4px]'}`}
                  >
                    <Activity size={14} className={activeRightTab === 'agent' ? "text-teal-400" : "text-gray-500"} />
                    Agent
                    {agentPanelToolCalls.filter(tc => tc.status === 'running').length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    )}
                    {agentPanelToolCalls.length > 0 && (
                      <span className="text-[10px] bg-teal-500/20 text-teal-400 rounded-full px-1 font-mono leading-none py-0.5">
                        {agentPanelToolCalls.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveRightTab('models')}
                    className={`px-4 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-all whitespace-nowrap uppercase tracking-wide ${activeRightTab === 'models' ? 'bg-[#1e1e1e] text-white border-t border-x border-[#333] h-full relative top-[1px] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-[#333] h-[calc(100%-4px)] mt-[4px]'}`}
                  >
                    <Server size={14} className={activeRightTab === 'models' ? "text-violet-400" : "text-gray-500"} />
                    Models
                    {modelSections.length > 0 && (
                      <span className="text-[10px] bg-violet-500/20 text-violet-400 rounded-full px-1 font-mono leading-none py-0.5">
                        {modelSections.length}
                      </span>
                    )}
                  </button>
                </div>


                <div className="flex items-center pb-1.5 pr-1 gap-2">
                  {/* Close button for mobile/tablet */}
                  {(isMobile || isTablet) && (
                    <button
                      onClick={() => setRightPanelOpen(false)}
                      className="p-1.5 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
                      title="Close panel"
                      aria-label="Close panel"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleRunSimulation}
                    disabled={agent.isThinking}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all ${isRunning ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80' : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'}`}
                  >
                    {isRunning ? (
                      <> <Square size={10} fill="currentColor" /> Stop </>
                    ) : (
                      <> <Play size={10} fill="currentColor" /> Run </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 relative overflow-hidden flex flex-col bg-[#1e1e1e] min-h-0">
                {activeRightTab === 'ai' && (
                  <ErrorBoundary fallbackTitle="AI Chat Error" fallbackMessage="The AI chat encountered an error. Try refreshing to continue.">
                    <Terminal
                      // Agent engine state
                      messages={agent.messages}
                      isThinking={agent.isThinking}
                      contextUsage={agent.contextUsage}
                      queuedMessages={agent.queuedMessages}
                      steerMode={agent.steerMode}
                      onSendMessage={handleAgentMessage}
                      onStopGeneration={agent.stopGeneration}
                      onCancelQueuedMessage={agent.cancelQueuedMessage}
                      onSetSteerMode={agent.setSteerMode}
                      onClearHistory={agent.clearHistory}
                      onOpenModelManager={() => setActiveRightTab('models')}
                      modelConfigured={modelConfigured}
                      draftInput={persistence.draftInput}
                      onDraftChange={persistence.setDraftInput}
                      isProcessing={agent.isThinking}
                      // Code editor integration
                      onApplyCode={(code, fileName) => {
                        const targetFile = fileName || activeFileName;
                        if (targetFile) {
                          setFiles(prev => prev.map(f =>
                            f.name === targetFile ? { ...f, content: code } : f
                          ));
                          if (targetFile !== activeFileName) setActiveFileName(targetFile);
                        }
                      }}
                      selectedCode={currentSelection}
                      activeFileName={activeFileName || undefined}
                      deviceMode={deviceMode}
                      onOpenDiffPreview={() => {
                        if (pendingChanges.length > 0) setShowDiffPreview(true);
                      }}
                    />
                  </ErrorBoundary>
                )}

                {activeRightTab === 'visualizer' && (
                  <ErrorBoundary fallbackTitle="Visualizer Error" fallbackMessage="The simulation visualizer encountered an error. Try stopping and restarting the simulation.">
                    <div ref={visualizerRef} className="visualizer-panel flex-1 flex flex-col h-full relative" data-running={isRunning ? "true" : "false"}>
                      {/* Visualizer Toolbar */}
                      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2 flex justify-between items-center pointer-events-none">
                        <div className="pointer-events-auto bg-[#252526]/80 backdrop-blur rounded-full px-3 py-1 border border-[#333] flex items-center gap-2 shadow-sm">
                          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-gray-500"}`}></div>
                          <span className="text-[10px] font-mono font-bold text-gray-300">
                            {isRunning ? "SIMULATION RUNNING" : "SIMULATION STOPPED"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleFullscreen}
                            className="pointer-events-auto bg-[#252526]/80 backdrop-blur rounded px-2 py-1 border border-[#333] flex items-center gap-1.5 text-purple-500 hover:text-purple-400 hover:bg-[#333] transition-colors shadow-sm"
                            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                          >
                            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                            <span className="text-[10px] font-bold">
                              {isFullscreen ? 'Exit' : 'Full'}
                            </span>
                          </button>
                          <button
                            onClick={handleSyncWiring}
                            disabled={isSyncing}
                            className="pointer-events-auto bg-[#252526]/80 backdrop-blur rounded px-2 py-1 border border-[#333] flex items-center gap-1.5 text-sky-500 hover:text-sky-400 hover:bg-[#333] transition-colors disabled:opacity-50 shadow-sm"
                            title="Sync wiring from code"
                            aria-label="Sync wiring from code"
                          >
                            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                            <span className="text-[10px] font-bold">Sync</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 relative overflow-hidden bg-[#1e293b]">
                        <SimulationPanel
                          wiring={wiring}
                          isRunning={isRunning}
                          activePinStates={activePinStates}
                          deviceMode={deviceMode}
                        />
                      </div>

                      <SerialConsole
                        logs={simulationLogs}
                        onClear={() => setSimulationLogs('')}
                        height={serialHeight}
                        isOpen={isSerialOpen}
                        onToggle={() => setIsSerialOpen(!isSerialOpen)}
                        onResizeStart={startResizingSerial}
                      />
                    </div>
                  </ErrorBoundary>
                )}

                {/* Agent Tool Call Log Panel */}
                {activeRightTab === 'agent' && (
                  <AgentPanel
                    status={agent.status}
                    activeModel={activeModelSection}
                    toolCalls={agent.allToolCalls}
                    modelConfigured={modelConfigured}
                    onClearHistory={agent.clearHistory}
                    onOpenModelManager={() => setActiveRightTab('models')}
                  />
                )}

                {/* Model Manager Panel */}
                {activeRightTab === 'models' && (
                  <ModelManager
                    models={modelSections}
                    onModelsChange={setModelSections}
                  />
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Model Card Modal */}
        <ModelCard
          isOpen={showModelCard}
          onClose={() => setShowModelCard(false)}
          deviceMode={deviceMode}
          activeModel={activeModelSection}
          modelConfigured={modelConfigured}
          toolCalls={agentPanelToolCalls}
          agentStatus={agentPanelState.status}
          onOpenModelManager={() => { setShowModelCard(false); setActiveRightTab('models'); }}
        />
      </div>
    </ErrorBoundary>
  );
}

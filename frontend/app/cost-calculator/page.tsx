"use client";

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Minus,
    ShoppingCart,
    Trash2,
    ShieldCheck,
    Globe,
    TrendingUp,
    TrendingDown,
    Zap,
    Layers,
    Info,
    ArrowLeft,
    Cpu,
    Search,
    ExternalLink,
    Calculator,
    Download
} from 'lucide-react';

import {
    COMPONENTS,
    Component,
    CALCULATOR_META,
    Region,
    Complexity,
    REGION_MODIFIERS,
    COMPLEXITY_BUFFERS,
    PROJECT_TEMPLATES
} from '@/lib/cost-calculator/data';
import { generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';

import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function CostCalculatorPage() {
    const [activePlatform, setActivePlatform] = useState<'arduino' | 'raspberry-pi'>('arduino');
    const [selectedRegion, setSelectedRegion] = useState<Region>('global');
    const [selectedComplexity, setSelectedComplexity] = useState<Complexity>('basic');
    const [cart, setCart] = useLocalStorage<{ componentId: string; quantity: number }[]>('cost-calculator-cart', []);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter components based on platform and search
    const availableComponents = useMemo(() =>
        COMPONENTS.filter(c =>
            (c.platform === activePlatform || c.platform === 'both') &&
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.category.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
        [activePlatform, searchQuery]);

    const addToCart = useCallback((componentId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.componentId === componentId);
            if (existing) {
                return prev.map(item =>
                    item.componentId === componentId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { componentId, quantity: 1 }];
        });
    }, []);

    const updateQuantity = useCallback((componentId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.componentId === componentId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    }, []);

    const removeFromCart = useCallback((componentId: string) => {
        setCart(prev => prev.filter(item => item.componentId !== componentId));
    }, []);

    const applyTemplate = useCallback((templateId: string) => {
        const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setActivePlatform(template.platform);
            const templateItems = template.components.map(c => ({ componentId: c.id, quantity: c.quantity }));
            setCart(templateItems);
        }
    }, []);

    // Calculations with Modifiers
    const modifiers = useMemo(() => ({
        region: REGION_MODIFIERS[selectedRegion],
        complexity: COMPLEXITY_BUFFERS[selectedComplexity]
    }), [selectedRegion, selectedComplexity]);

    const cartDetails = useMemo(() => {
        return cart.map(item => {
            const component = COMPONENTS.find(c => c.id === item.componentId);
            if (!component) {
                // Skip invalid component IDs to prevent crashes
                console.warn(`Component not found: ${item.componentId}`);
                return null;
            }
            const baseLow = component.prices.low * item.quantity;
            const baseAvg = component.prices.avg * item.quantity;
            const baseHigh = component.prices.high * item.quantity;

            // Tools don't usually scale with project complexity, but boards/sensors do
            const complexityMod = component.category === 'tool' ? 1.0 : modifiers.complexity;
            const finalModifier = modifiers.region * complexityMod;

            return {
                ...item,
                component,
                totalLow: baseLow * finalModifier,
                totalAvg: baseAvg * finalModifier,
                totalHigh: baseHigh * finalModifier
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [cart, modifiers]);

    const grandTotals = useMemo(() => {
        return cartDetails.reduce((totals, item) => ({
            low: totals.low + item.totalLow,
            avg: totals.avg + item.totalAvg,
            high: totals.high + item.totalHigh
        }), { low: 0, avg: 0, high: 0 });
    }, [cartDetails]);

    const breadcrumbs = generateBreadcrumbs('/cost-calculator');

    return (
        <>
            <BreadcrumbSchema items={breadcrumbs} />
            <Header />
            <main role="main" aria-label="Project Cost Calculator" className="min-h-screen bg-background text-foreground font-sans pb-20 selection:bg-primary/30">
                {/* Dynamic Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8">
                    {/* Header Section */}
                    <div className="mb-12">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-4">
                                    <Calculator size={14} className="text-primary" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Project Planning Tool V2.0</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4 leading-tight">
                                    Budget <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-500">Forecaster</span>
                                </h1>
                                <p className="text-muted-foreground max-w-2xl text-lg font-medium">
                                    Estimate total project costs including <span className="text-primary font-bold">regional taxes</span>,
                                    <span className="text-primary font-bold"> complexity buffers</span>, and 2026 market logistics.
                                </p>
                            </div>

                            {/* Platform Toggle */}
                            <div className="bg-muted/80 backdrop-blur border border-border p-1.5 rounded-2xl flex gap-1 shadow-2xl">
                                <button
                                    onClick={() => { setActivePlatform('arduino'); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activePlatform === 'arduino'
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Cpu size={18} />
                                    Arduino Ecosystem
                                </button>
                                <button
                                    onClick={() => { setActivePlatform('raspberry-pi'); }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activePlatform === 'raspberry-pi'
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Layers size={18} />
                                    Raspberry Pi
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Global Settings Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-xl">
                            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] min-w-[140px]">
                                <Globe size={16} className="text-blue-500" /> Target Region
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(['global', 'us', 'eu', 'india'] as Region[]).map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setSelectedRegion(r)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border ${selectedRegion === r
                                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                                            : 'bg-muted border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-xl">
                            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] min-w-[140px]">
                                <Zap size={16} className="text-orange-500" /> Complexity
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(['basic', 'advanced', 'prototype'] as Complexity[]).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedComplexity(c)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border ${selectedComplexity === c
                                            ? 'bg-orange-500/20 border-orange-500/40 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10'
                                            : 'bg-muted border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        {c.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Project Templates (Quick Start) */}
                    <div className="mb-12">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-4">
                            <Zap size={12} className="text-orange-500" />
                            Quick Start Templates
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {PROJECT_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template.id)}
                                    className="flex flex-col text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all hover:bg-accent/50 group focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                                    aria-label={`Apply ${template.name} template`}
                                >
                                    <span className="text-foreground font-bold group-hover:text-primary transition-colors uppercase text-[10px] tracking-widest mb-1">{template.name}</span>
                                    <span className="text-[11px] text-muted-foreground line-clamp-1">{template.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Component Catalog */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search components or categories (e.g. WiFi, Sensor...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                />
                            </div>

                            {['controller', 'sensor', 'actuator', 'accessory', 'power', 'tool'].map(cat => {
                                const catItems = availableComponents.filter(c => c.category === cat);
                                if (catItems.length === 0) return null;

                                return (
                                    <section key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-4">
                                            <span className="p-1 rounded bg-muted">
                                                <Layers size={12} className="text-primary" />
                                            </span>
                                            {cat}s
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {catItems.map(comp => (
                                                <div
                                                    key={comp.id}
                                                    className="group bg-card hover:bg-accent/30 border border-border hover:border-primary/30 p-5 rounded-2xl transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] shadow-sm"
                                                    onClick={() => addToCart(comp.id)}
                                                >
                                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                        <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                                                            <Plus size={16} />
                                                        </div>
                                                    </div>
                                                    <h4 className="text-foreground font-bold mb-1.5 group-hover:text-primary transition-colors">{comp.name}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">
                                                        {comp.description}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Base Cost</span>
                                                            <span className="text-lg font-black text-foreground">
                                                                ${comp.prices.avg}
                                                            </span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                                            {activePlatform === 'arduino' && comp.platform === 'arduino' ? 'Uno/Nano/ESP' : 'Pi/Pico'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>

                        {/* Right: Budget Dashboard */}
                        <div className="lg:col-span-5 sticky top-24">
                            <div className="bg-card/95 backdrop-blur-2xl border border-border rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col min-h-[600px]">
                                {/* Cart Header */}
                                <div className="p-8 border-b border-border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                                <ShoppingCart size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-foreground">Project Cart</h2>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                                    Budgeting for {selectedRegion.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-4 py-1.5 bg-muted rounded-full text-[10px] font-black text-muted-foreground border border-border">
                                            {cart.reduce((acc, i) => acc + i.quantity, 0)} TOTAL
                                        </span>
                                    </div>
                                </div>

                                {/* Cart Items List */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin">
                                    {cart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 py-20 grayscale">
                                            <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-muted-foreground flex items-center justify-center rotate-6">
                                                <Calculator size={32} />
                                            </div>
                                            <div className="max-w-[200px]">
                                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-2">Workbench Empty</h3>
                                                <p className="text-[11px] font-medium leading-relaxed">Add components to predict your project hardware budget and risk buffers.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        cartDetails.map(item => (
                                            <div key={item.componentId} className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border group hover:bg-muted/60 transition-all">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-foreground mb-1">{item.component.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">${item.component.prices.avg.toFixed(2)} unit</span>
                                                        <span className="w-1 h-1 bg-border rounded-full"></span>
                                                        <span className="text-[10px] text-primary font-bold">Base</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-background p-1.5 rounded-xl border border-border shadow-inner">
                                                    <button
                                                        onClick={() => updateQuantity(item.componentId, -1)}
                                                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-rose-500"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-xs font-mono font-black w-8 text-center text-foreground">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.componentId, 1)}
                                                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-primary"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.componentId)}
                                                    className="p-2 text-muted-foreground/30 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Price Estimation Algorithm Display */}
                                <div className="p-8 bg-muted/30 border-t border-border space-y-8 backdrop-blur-md">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estimated Total Budget</span>
                                            <div className="flex items-center gap-1.5 text-[9px] text-primary font-black bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                                <ShieldCheck size={11} />
                                                SMART ESTIMATE
                                            </div>
                                        </div>
                                        <div className="text-6xl font-black text-foreground tracking-tighter mb-6 flex items-baseline gap-1">
                                            <span className="text-3xl text-muted-foreground font-black">$</span>
                                            {grandTotals.avg.toFixed(2)}
                                        </div>

                                        {/* Range Table */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-background/50 p-4 rounded-2xl border border-border flex flex-col gap-1 shadow-sm">
                                                <div className="flex items-center gap-1 text-[9px] text-blue-500 font-black uppercase tracking-tighter">
                                                    <TrendingDown size={12} /> Low
                                                </div>
                                                <div className="text-base font-black text-foreground">${grandTotals.low.toFixed(0)}</div>
                                            </div>
                                            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/30 flex flex-col gap-1 shadow-lg shadow-primary/5">
                                                <div className="flex items-center gap-1 text-[9px] text-primary font-black uppercase tracking-tighter">
                                                    <Layers size={12} /> Avg
                                                </div>
                                                <div className="text-base font-black text-foreground">${grandTotals.avg.toFixed(0)}</div>
                                            </div>
                                            <div className="bg-background/50 p-4 rounded-2xl border border-border flex flex-col gap-1 shadow-sm">
                                                <div className="flex items-center gap-1 text-[9px] text-rose-500 font-black uppercase tracking-tighter">
                                                    <TrendingUp size={12} /> High
                                                </div>
                                                <div className="text-base font-black text-foreground">${grandTotals.high.toFixed(0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Guidance */}
                                    <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl">
                                        <h5 className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-300 mb-2 uppercase italic tracking-wider">
                                            <Info size={14} /> Intelligence Insight
                                        </h5>
                                        <p className="text-[11px] leading-relaxed text-blue-800/60 dark:text-blue-200/60 font-medium">
                                            {cart.length === 0
                                                ? "Pick a controller below to unlock specific build advice and hardware warnings."
                                                : `${selectedRegion.toUpperCase()} pricing includes estimated local sales tax/VAT (${(REGION_MODIFIERS[selectedRegion] * 100 - 100).toFixed(0)}%). ${selectedComplexity === 'prototype' ? "45% buffer added for potential hardware failure and R&D iterations." : "Standard buffer applied for wiring and consumables."}`
                                            }
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            disabled={cart.length === 0}
                                            className="w-full py-5 bg-foreground hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground text-background font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            <Download size={16} /> Export Technical BOM
                                        </button>
                                        <button
                                            disabled={cart.length === 0}
                                            onClick={() => setCart([])}
                                            className="w-full py-2 hover:bg-rose-500/10 text-rose-500/60 hover:text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all"
                                        >
                                            Reset Forecast
                                        </button>
                                    </div>

                                    <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-widest pt-2">
                                        Dataset {CALCULATOR_META.lastUpdated} • {CALCULATOR_META.sourceName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Comparison Table (Lower Section) */}
                    {cart.length > 0 && (
                        <div className="mt-32 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                                <div>
                                    <h3 className="text-3xl font-black text-foreground mb-2">Detailed <span className="text-primary">Budget Analysis</span></h3>
                                    <p className="text-muted-foreground text-sm font-medium">A granular breakdown of costs including regional and complexity adjustments.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Multiplier</span>
                                        <span className="text-sm font-mono font-bold text-foreground">x{(modifiers.region * (selectedComplexity === 'prototype' ? 1.45 : selectedComplexity === 'advanced' ? 1.25 : 1.1)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-[2.5rem] border border-border bg-card/40 backdrop-blur-xl shadow-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/80 border-b border-border">
                                            <th className="px-6 md:px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Component Details</th>
                                            <th className="px-6 md:px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Qty</th>
                                            <th className="hidden md:table-cell px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Market Low</th>
                                            <th className="px-6 md:px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estimated Avg</th>
                                            <th className="hidden lg:table-cell px-10 py-7 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Official Shop</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {cartDetails.map(item => (
                                            <tr key={item.componentId} className="hover:bg-accent/10 transition-colors group">
                                                <td className="px-6 md:px-10 py-8">
                                                    <div className="font-black text-foreground text-base group-hover:text-primary transition-colors">{item.component.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                                        {item.component.category}
                                                        <span className="w-1 h-1 bg-border rounded-full"></span>
                                                        {item.component.platform === 'both' ? 'Hybrid' : item.component.platform.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-6 md:px-10 py-8 text-center">
                                                    <span className="font-mono text-sm font-black bg-muted px-3 py-1.5 rounded-xl text-foreground border border-border">x{item.quantity}</span>
                                                </td>
                                                <td className="hidden md:table-cell px-10 py-8">
                                                    <span className="text-sm font-bold text-muted-foreground">${item.totalLow.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 md:px-10 py-8">
                                                    <span className="px-5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm md:text-base font-black border border-emerald-500/20 shadow-lg shadow-emerald-500/5 whitespace-nowrap">
                                                        ${item.totalAvg.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="hidden lg:table-cell px-10 py-8 text-right">
                                                    {item.component.officialSource ? (
                                                        <a
                                                            href={item.component.officialSource}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-[10px] font-black text-primary hover:text-foreground transition-all uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 hover:border-primary/30"
                                                        >
                                                            Verify Price <ExternalLink size={12} />
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-muted-foreground italic uppercase tracking-widest group-hover:text-foreground transition-colors">Third Party Only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/60 font-black">
                                            <td colSpan={3} className="px-10 py-12 text-foreground uppercase tracking-[0.3em] text-sm md:table-cell hidden">Aggregated Project Estimate</td>
                                            <td colSpan={1} className="px-6 md:px-10 py-12 md:hidden text-foreground uppercase tracking-[0.3em] text-[10px]">Total Est.</td>
                                            <td colSpan={1} className="px-10 py-12">
                                                <div className="text-4xl text-primary tracking-tighter font-black shadow-primary/20 text-glow">
                                                    ${grandTotals.avg.toFixed(2)}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground uppercase tracking-widest mt-2">{selectedRegion.toUpperCase()} • {selectedComplexity.toUpperCase()}</div>
                                            </td>
                                            <td className="px-10 py-12 text-right hidden lg:table-cell">
                                                <div className="text-[10px] text-muted-foreground leading-relaxed font-medium max-w-[200px] ml-auto">
                                                    *Includes tax buffers, regional shipping adjustments, and technical complexity contingency.
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 p-8 bg-card border border-border rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                        <ShieldCheck size={32} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-black text-lg">Purchase Disclaimer</h4>
                                        <p className="text-xs text-muted-foreground font-medium max-w-md mt-1">Estimates are based on 2026 market trends. Actual prices may vary by specific vendor stock and local delivery fees.</p>
                                    </div>
                                </div>
                                <Button size="lg" asChild className="w-full md:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-teal-600/20">
                                    <Link href="/build">
                                        Start Building in Studio
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </main>
        </>
    );
}

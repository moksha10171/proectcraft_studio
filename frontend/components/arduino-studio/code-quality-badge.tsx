"use client";

import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface CodeQualityBadgeProps {
  hasErrors: boolean;
  isVerified: boolean;
  isAIGenerated?: boolean;
  className?: string;
}

export default function CodeQualityBadge({ 
  hasErrors, 
  isVerified, 
  isAIGenerated = false,
  className = '' 
}: CodeQualityBadgeProps) {
  
  // Determine badge state
  const getBadgeState = () => {
    if (hasErrors) {
      return {
        icon: AlertTriangle,
        text: 'Errors Found',
        color: 'bg-red-900/30 text-red-400 border-red-500/30',
        iconColor: 'text-red-500'
      };
    }
    
    if (isVerified) {
      return {
        icon: CheckCircle2,
        text: isAIGenerated ? 'AI Generated - Verified' : 'Verified',
        color: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
        iconColor: 'text-emerald-500'
      };
    }
    
    if (isAIGenerated) {
      return {
        icon: Info,
        text: 'AI Generated - Review Needed',
        color: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
        iconColor: 'text-amber-500'
      };
    }
    
    return {
      icon: Shield,
      text: 'Not Verified',
      color: 'bg-gray-700/30 text-gray-400 border-gray-600/30',
      iconColor: 'text-gray-500'
    };
  };

  const state = getBadgeState();
  const Icon = state.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${state.color} ${className}`}>
      <Icon size={14} className={state.iconColor} />
      <span className="text-xs font-medium">{state.text}</span>
    </div>
  );
}

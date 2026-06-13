"use client";

import React, { useState, useEffect } from 'react';
import { Shield, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface VerificationReminderProps {
  isAIGenerated: boolean;
  isVerified: boolean;
  onVerify: () => void;
  onDismiss: () => void;
}

export default function VerificationReminder({ 
  isAIGenerated, 
  isVerified, 
  onVerify, 
  onDismiss 
}: VerificationReminderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show reminder if AI generated code hasn't been verified
    if (isAIGenerated && !isVerified) {
      // Delay showing to avoid immediate popup
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isAIGenerated, isVerified]);

  if (!show) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-gradient-to-r from-amber-900/95 to-orange-900/95 backdrop-blur-sm border border-amber-500/30 rounded-lg shadow-2xl p-4 animate-in slide-in-from-top duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Shield size={14} />
              Verify AI-Generated Code
            </h3>
            <p className="text-xs text-amber-100 leading-relaxed mb-3">
              Research shows AI code has 1.7x more bugs. Always verify before running!
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onVerify();
                  setShow(false);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 size={14} />
                Verify Now
              </button>
              <button
                onClick={() => {
                  onDismiss();
                  setShow(false);
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close reminder"
          >
            <X size={16} className="text-amber-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

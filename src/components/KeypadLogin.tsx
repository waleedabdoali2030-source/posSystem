/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Lock, Delete, ArrowRight, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KeypadLoginProps {
  onUnlock: () => void;
}

export default function KeypadLogin({ onUnlock }: KeypadLoginProps) {
  const [pin, setPin] = useState<string>("");
  const [errorCount, setErrorCount] = useState<number>(0);
  const [showError, setShowError] = useState<boolean>(false);

  const handleKeyPress = (char: string) => {
    if (pin.length < 4) {
      const nextPin = pin + char;
      setPin(nextPin);
      
      // Auto-submit if pin reaches 4 characters
      if (nextPin === "1234") {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else if (nextPin.length === 4) {
        // Mismatch
        setTimeout(() => {
          setShowError(true);
          setErrorCount(prev => prev + 1);
          setPin("");
          setTimeout(() => setShowError(false), 800);
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  // Keyboard integration: Capture numbers, backspace, and clear input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleDelete();
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin]);

  return (
    <div id="keypad-login" className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white border border-natural-border p-8 rounded-3xl shadow-sm w-full max-w-sm flex flex-col items-center"
      >
        {/* Circle avatar header */}
        <div className="w-16 h-16 bg-natural-accent rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-xl font-bold text-natural-text mb-1">POS System Login</h2>
        <p className="text-xs text-natural-muted mb-6 font-mono">Standard passcode: 1234</p>

        {/* Pin input display bubbles */}
        <div className="flex gap-4 justify-center mb-8 h-8 items-center">
          <AnimatePresence mode="popLayout">
            {showError ? (
              <motion.span 
                key="error-text"
                initial={{ scale: 0.8 }} 
                animate={{ scale: 1, x: [10, -10, 5, -5, 0] }}
                className="text-natural-coral font-semibold text-sm"
              >
                Wrong passcode! Try again
              </motion.span>
            ) : (
              [0, 1, 2, 3].map((index) => (
                <div 
                  key={index}
                  className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-150 ${
                    pin.length > index 
                      ? "bg-natural-accent border-natural-accent scale-125" 
                      : "border-natural-border bg-natural-light-bg"
                  }`}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3.5 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <motion.button 
              whileTap={{ scale: 0.92 }}
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-2xl bg-natural-light-bg hover:bg-natural-border text-natural-text font-semibold text-xl flex items-center justify-center border border-natural-border transition cursor-pointer"
            >
              {num}
            </motion.button>
          ))}
          
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={handleClear}
            className="h-16 rounded-2xl bg-natural-muted-accent/20 hover:bg-natural-muted-accent/40 text-natural-text text-sm font-semibold flex items-center justify-center border border-natural-border/60 cursor-pointer"
          >
            Clear (C)
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={() => handleKeyPress("0")}
            className="h-16 rounded-2xl bg-natural-light-bg hover:bg-natural-border text-natural-text font-semibold text-xl flex items-center justify-center border border-natural-border cursor-pointer"
          >
            0
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.92 }}
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-natural-muted-accent/20 hover:bg-natural-muted-accent/40 text-natural-text flex items-center justify-center border border-natural-border/60 cursor-pointer"
          >
            <Delete className="w-5 h-5 text-natural-text/80" />
          </motion.button>
        </div>

        {/* Info hints */}
        <div className="mt-6 flex flex-col items-center gap-1.5 text-natural-muted text-[11px] leading-relaxed text-center font-mono">
          <span>Physical keyboard inputs allowed (0-9)</span>
          <span>Press Backspace to delete</span>
        </div>
      </motion.div>
    </div>
  );
}

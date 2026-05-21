/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Mail, Phone, ShieldCheck, Clock } from "lucide-react";

export default function Footer() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formattedDate = formatDate(time);

  return (
    <footer id="pos-footer" className="bg-natural-text text-natural-light-bg py-4 px-6 mt-auto border-t border-natural-border/20 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm">
        
        {/* Contact info and Copyright specified by user */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="font-medium text-white flex items-center gap-1.5 flex-wrap justify-center md:justify-start">
            <span>© 2026 Waleed Alqadasi</span>
            <span className="text-white/20">|</span>
            <a href="tel:0503189758" className="hover:text-natural-accent transition flex items-center gap-1">
              <Phone className="w-3 h-3 text-natural-green-border" />
              <span>0503189758</span>
            </a>
            <span className="text-white/20">|</span>
            <a href="mailto:wal87ye@GMAIL.COM" className="hover:text-natural-accent transition flex items-center gap-1">
              <Mail className="w-3 h-3 text-natural-muted-accent" />
              <span className="lowercase">wal87ye@gmail.com</span>
            </a>
          </div>
          <div className="text-[11px] text-white/50">
            KSA Tax Compliant POS Terminal (ZATCA Simplified Invoice)
          </div>
        </div>

        {/* Real-time professional clock details */}
        <div className="flex items-center gap-3 bg-natural-light-bg/10 border border-white/10 px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-natural-accent animate-pulse" />
          <div className="flex flex-col text-right">
            <span className="text-natural-accent font-mono font-semibold tracking-wider text-sm">
              {formatTime(time)}
            </span>
            <span className="text-[11px] text-white/80 font-medium">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-white/50 text-xs">
          <ShieldCheck className="w-4 h-4 text-natural-green-border" />
          <span>Active Session</span>
        </div>
      </div>
    </footer>
  );
}

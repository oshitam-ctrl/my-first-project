"use client";

import { motion, AnimatePresence } from "framer-motion";

export function SpeechBubble({ text, className = "" }: { text: string; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative inline-block ${className}`}
      >
        <div className="bg-white rounded-2xl px-4 py-2.5 shadow-md border border-[#E8C9A0]/30 text-sm text-[#5a4a2a]">
          {text}
        </div>
        {/* しっぽ（三角形） */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-sm" />
      </motion.div>
    </AnimatePresence>
  );
}

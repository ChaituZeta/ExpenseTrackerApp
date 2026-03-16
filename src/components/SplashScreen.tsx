import React from 'react';
import { motion } from 'motion/react';

export default function SplashScreen() {
  const logoUrl = "https://ik.imagekit.io/tlwqs45cp/Expense%20Tracker/output.jpg";

  return (
    <div className="fixed inset-0 bg-brand-primary flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white/20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 rounded-[2.5rem] bg-white/10 animate-pulse" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">FinTrack</h1>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-brand-accent rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

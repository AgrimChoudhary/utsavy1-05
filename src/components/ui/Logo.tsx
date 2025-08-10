
import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div 
      className={`flex items-center space-x-2 ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <Sparkles className="w-8 h-8 text-golden-glow" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-festive-coral rounded-full opacity-80"></div>
      </div>
      <span className="text-2xl font-bold font-poppins text-gradient">
        UTSAVY
      </span>
    </motion.div>
  );
};

export default Logo;

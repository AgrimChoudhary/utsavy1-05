
import React from 'react';
import { cn } from '@/lib/utils';

const CoupleIllustration: React.FC<{className?: string}> = ({ className }) => {
  return (
    <div className={cn("relative w-64 h-64 md:w-80 md:h-80", className)}>
        <img 
          src="/lovable-uploads/88954d14-07a5-494c-a5ac-075e055e0223.png" 
          alt="Bride and Groom" 
          width="320"
          height="320"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-contain"
        />
    </div>
  );
};
export default CoupleIllustration;

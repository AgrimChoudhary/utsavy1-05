
import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiyaProps {
  className?: string;
  position?: 'left' | 'right';
  delay?: number;
}

const Diya: React.FC<DiyaProps> = ({ className, position = 'left', delay = 0 }) => {
  return (
    <div className={cn('absolute', position === 'left' ? 'left-4' : 'right-4', className)} style={{ animationDelay: `${delay}s` }}>
        <Heart className="text-yellow-300 fill-yellow-400" size={42} />
    </div>
  );
};

export default Diya;


import React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const PhoneIcon = ({ className }: { className?: string }) => {
  return <Phone className={cn("w-4 h-4", className)} />;
};

export default PhoneIcon;

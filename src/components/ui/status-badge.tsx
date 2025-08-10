import React from 'react';
import { Badge } from './badge';
import { GuestStatus } from '@/types/rsvp';

interface StatusBadgeProps {
  status: GuestStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig = {
    pending: { 
      color: 'text-gray-600 bg-gray-100 border-gray-200', 
      label: 'Pending' 
    },
    viewed: { 
      color: 'text-yellow-700 bg-yellow-100 border-yellow-200', 
      label: 'Viewed' 
    },
    accepted: { 
      color: 'text-green-700 bg-green-100 border-green-200', 
      label: 'Accepted' 
    },
    submitted: { 
      color: 'text-blue-700 bg-blue-100 border-blue-200', 
      label: 'Submitted' 
    }
  };

  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline"
      className={`${config.color} text-xs font-medium px-2 py-1 ${className}`}
    >
      {config.label}
    </Badge>
  );
};
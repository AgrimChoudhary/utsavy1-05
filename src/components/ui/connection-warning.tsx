import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle, X } from 'lucide-react';

interface ConnectionWarningProps {
  isConnected: boolean;
  className?: string;
}

export const ConnectionWarning: React.FC<ConnectionWarningProps> = ({ 
  isConnected, 
  className = '' 
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!isConnected && !isDismissed) {
      // Show warning only after 3 seconds of being disconnected
      timer = setTimeout(() => {
        setShowWarning(true);
        console.log('⚠️ Connection warning shown after 3 second delay');
      }, 3000);
    } else {
      setShowWarning(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isConnected, isDismissed]);

  // Reset dismissed state when connection is restored
  useEffect(() => {
    if (isConnected) {
      setIsDismissed(false);
      console.log('✅ Connection restored, warning reset');
    }
  }, [isConnected]);

  if (!showWarning || isConnected || isDismissed) return null;

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className} relative`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 pr-8">
        Connection temporarily unavailable. Some data may be outdated.
      </AlertDescription>
      <button
        onClick={() => {
          setIsDismissed(true);
          console.log('❌ Connection warning dismissed by user');
        }}
        className="absolute right-2 top-2 text-yellow-600 hover:text-yellow-800 transition-colors"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
};
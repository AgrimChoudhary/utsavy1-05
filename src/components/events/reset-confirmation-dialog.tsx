import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { EventStats } from '@/services/simpleRSVPService';

interface ResetConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  eventStats: EventStats;
  isResetting?: boolean;
}

export const ResetConfirmationDialog: React.FC<ResetConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventStats,
  isResetting = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText.toLowerCase().trim() === 'reset';

  const handleConfirm = async () => {
    if (!isValid) return;
    
    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Reset All Guest Status
          </DialogTitle>
          <DialogDescription>
            This action will reset ALL guests to "pending" status. RSVP data will be preserved but status will be reset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Impact Summary */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Impact Summary:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• {eventStats.viewed} viewed guests → pending</li>
                <li>• {eventStats.accepted} accepted guests → pending</li>
                <li>• {eventStats.submitted} submitted guests → pending</li>
                <li>• Total guests affected: {eventStats.viewed + eventStats.accepted + eventStats.submitted}</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Data Preservation Notice */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>✓ Safe:</strong> All RSVP form data and custom field responses will be preserved. Only the status will change.
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-input">Type "reset" to confirm:</Label>
            <Input 
              id="confirm-input"
              value={confirmText} 
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'reset' here"
              className={confirmText && !isValid ? 'border-red-300 focus-visible:ring-red-500' : ''}
              disabled={isResetting}
            />
            {confirmText && !isValid && (
              <p className="text-xs text-red-600">
                Please type exactly "reset" to confirm
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            disabled={!isValid || isResetting}
            onClick={handleConfirm}
            className="min-w-[100px]"
          >
            {isResetting ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset All Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
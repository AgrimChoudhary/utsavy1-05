
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RSVPConfig } from '@/types';
import { RSVPFieldRenderer } from '@/components/events/RSVPFieldRenderer';

interface RSVPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  rsvpConfig: RSVPConfig;
  guestName: string;
  isEditMode?: boolean;
  existingData?: any;
}

export const RSVPDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  rsvpConfig, 
  guestName, 
  isEditMode = false,
  existingData = {} 
}: RSVPDialogProps) => {
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingData && isEditMode) {
      setFieldValues(existingData);
    }
  }, [existingData, isEditMode]);

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (rsvpConfig.customFields) {
      rsvpConfig.customFields.forEach(field => {
        if (field.is_required && !fieldValues[field.field_name]) {
          newErrors[field.field_name] = `${field.field_label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateFields()) {
      onSubmit(fieldValues);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit RSVP Details - ${guestName}` : `RSVP Details - ${guestName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            {isEditMode 
              ? 'Update your RSVP details below:'
              : 'Please provide the following details to help us plan better:'
            }
          </p>

          {rsvpConfig.customFields && rsvpConfig.customFields.length > 0 ? (
            <RSVPFieldRenderer
              fields={rsvpConfig.customFields}
              values={fieldValues}
              onChange={handleFieldChange}
              errors={errors}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">
              No additional details required for this event.
            </p>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90">
              {isEditMode ? 'Update RSVP' : 'Submit RSVP'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

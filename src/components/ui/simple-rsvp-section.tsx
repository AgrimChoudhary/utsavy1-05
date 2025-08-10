import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RSVPFieldRenderer } from '@/components/events/RSVPFieldRenderer';
import { toast } from '@/hooks/use-toast';

interface SimpleRSVPSectionProps {
  status: null | "accepted" | "submitted";
  showSubmitButton: boolean;
  showEditButton: boolean;
  rsvpFields: any[];
  existingRsvpData?: any;
  guestName: string;
  onAccept: () => void;
  onSubmit: (data: any) => void;
  onEdit: (data: any) => void;
}

export const SimpleRSVPSection: React.FC<SimpleRSVPSectionProps> = ({
  status,
  showSubmitButton,
  showEditButton,
  rsvpFields,
  existingRsvpData,
  guestName,
  onAccept,
  onSubmit,
  onEdit
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState(existingRsvpData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAcceptClick = () => {
    onAccept();
    toast({
      title: "Invitation Accepted!",
      description: `Thank you ${guestName} for accepting the invitation.`,
    });
  };

  const handleSubmitClick = () => {
    setIsEditMode(false);
    setFieldValues({});
    setIsDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setFieldValues(existingRsvpData || {});
    setIsDialogOpen(true);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    rsvpFields.forEach((field) => {
      if (field.is_required && !fieldValues[field.field_name]) {
        newErrors[field.field_name] = `${field.field_label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = () => {
    if (!validateFields()) {
      return;
    }

    if (isEditMode) {
      onEdit(fieldValues);
      toast({
        title: "RSVP Updated!",
        description: `Your RSVP details have been updated successfully.`,
      });
    } else {
      onSubmit(fieldValues);
      toast({
        title: "RSVP Details Submitted!",
        description: `Thank you ${guestName} for providing your RSVP details.`,
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  return (
    <>
      {/* Show Accept button when status is null */}
      {!status && (
        <Button onClick={handleAcceptClick} className="w-full">
          Accept Invitation
        </Button>
      )}

      {/* Show Submit RSVP button when status is accepted and custom fields exist */}
      {status === "accepted" && showSubmitButton && (
        <Button onClick={handleSubmitClick} className="w-full">
          Submit RSVP Details
        </Button>
      )}

      {/* Show Edit button when status is submitted and editing is allowed */}
      {status === "submitted" && showEditButton && (
        <Button onClick={handleEditClick} variant="outline" className="w-full">
          Edit RSVP Details
        </Button>
      )}

      {/* Show confirmation when submitted and no edit allowed */}
      {status === "submitted" && !showEditButton && (
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            Thank you! Your RSVP has been submitted successfully.
          </p>
        </div>
      )}

      {/* RSVP Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit RSVP Details' : 'RSVP Details'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {rsvpFields.map((field) => (
              <RSVPFieldRenderer
                key={field.field_name}
                fields={[field]}
                values={fieldValues}
                onChange={(fieldName, value) => handleFieldChange(fieldName, value)}
                errors={errors}
              />
            ))}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleFormSubmit} className="flex-1">
                {isEditMode ? 'Update RSVP' : 'Submit RSVP'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RSVPDialog } from './RSVPDialog';
import { RSVPConfig } from '@/types';

interface RSVPSectionProps {
  guestStatus: 'pending' | 'viewed' | 'accepted' | 'submitted';
  guestName: string;
  rsvpConfig: RSVPConfig;
  hasCustomFields: boolean;
  allowEditAfterSubmit?: boolean;
  existingRsvpData?: any;
  onAccept: () => void;
  onSubmitCustomFields: (data: any) => void;
  onRequestEdit: () => void;
}

export const RSVPSection = ({ 
  guestStatus,
  guestName, 
  rsvpConfig, 
  hasCustomFields,
  allowEditAfterSubmit = true,
  existingRsvpData,
  onAccept,
  onSubmitCustomFields,
  onRequestEdit
}: RSVPSectionProps) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleAcceptInvitation = () => {
    onAccept();
  };

  const handleSubmitRSVP = () => {
    setShowDialog(true);
  };

  const handleRSVPFormSubmit = (data: any) => {
    onSubmitCustomFields(data);
    setShowDialog(false);
  };

  const handleEditRequest = () => {
    onRequestEdit();
    setShowDialog(true);
  };

  // Show different UI based on guest status
  switch (guestStatus) {
    case 'pending':
    case 'viewed':
      return (
        <div className="space-y-4 text-center">
          <p className="text-gray-700 mb-4">
            We would be honored by your presence at our celebration.
          </p>
          <Button 
            onClick={handleAcceptInvitation}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            Accept Invitation
          </Button>
        </div>
      );

    case 'accepted':
      if (!hasCustomFields) {
        return (
          <div className="space-y-2 text-center">
            <p className="text-lg text-green-700 font-semibold">
              Thank you for accepting our invitation!
            </p>
            <p className="text-sm text-gray-600">
              We look forward to celebrating with you, {guestName}.
            </p>
          </div>
        );
      } else {
        return (
          <>
            <div className="space-y-4 text-center">
              <p className="text-lg text-green-700 font-semibold">
                Thank you for accepting our invitation!
              </p>
              <p className="text-gray-700 mb-4">
                Please provide some additional details to help us plan better.
              </p>
              <Button 
                onClick={handleSubmitRSVP}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
              >
                Submit RSVP Details
              </Button>
            </div>

            <RSVPDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              onSubmit={handleRSVPFormSubmit}
              rsvpConfig={rsvpConfig}
              guestName={guestName}
              isEditMode={false}
              existingData={existingRsvpData}
            />
          </>
        );
      }

    case 'submitted':
      return (
        <>
          <div className="space-y-2 text-center">
            <p className="text-lg text-green-700 font-semibold">
              Thank you for your RSVP!
            </p>
            <p className="text-sm text-gray-600">
              We have received your details and look forward to celebrating with you.
            </p>
            {allowEditAfterSubmit && (
              <Button 
                onClick={handleEditRequest}
                variant="outline"
                className="mt-4 px-6 py-2"
              >
                Edit RSVP Details
              </Button>
            )}
          </div>

          {allowEditAfterSubmit && (
            <RSVPDialog
              isOpen={showDialog}
              onClose={() => setShowDialog(false)}
              onSubmit={handleRSVPFormSubmit}
              rsvpConfig={rsvpConfig}
              guestName={guestName}
              isEditMode={true}
              existingData={existingRsvpData}
            />
          )}
        </>
      );

    default:
      return null;
  }
};
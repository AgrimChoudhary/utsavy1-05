import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Event } from '@/types';
import { Info } from 'lucide-react';

interface InvitationMessageContentProps {
  event: Event;
  onSave: (data: any) => void;
  isSaving: boolean;
  onCancel: () => void;
}

const DEFAULT_INVITATION_TEMPLATE = `Dear {guest-name},

You are cordially invited to our event.

Click here to view your personalized invitation: {unique-link}

We look forward to celebrating with you!`;

export const InvitationMessageContent = ({ 
  event, 
  onSave, 
  isSaving, 
  onCancel 
}: InvitationMessageContentProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState<string>('');
  
  // Initialize message from event details or use default
  useEffect(() => {
    const eventDetails = event.details as Record<string, any>;
    const savedTemplate = eventDetails?.invitation_message_template;
    setMessage(savedTemplate || DEFAULT_INVITATION_TEMPLATE);
  }, [event]);

  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newMessage = message.substring(0, start) + tag + message.substring(end);
    setMessage(newMessage);
    
    // Set cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + tag.length;
      textarea.selectionEnd = start + tag.length;
    }, 0);
  };

  const handleSave = () => {
    // Get current event details
    const currentDetails = event.details as Record<string, any> || {};
    
    // Update with new invitation message template
    const updatedDetails = {
      ...currentDetails,
      invitation_message_template: message
    };
    
    onSave({ details: updatedDetails });
  };

  const handleReset = () => {
    setMessage(DEFAULT_INVITATION_TEMPLATE);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md flex items-start gap-3 text-sm text-blue-800">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">Customize your invitation message</p>
          <p>This message will be used when sharing invitations with your guests. Use the tags to personalize the message for each guest.</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => insertTag('{guest-name}')}
          className="text-xs"
        >
          Insert Guest Name
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => insertTag('{unique-link}')}
          className="text-xs"
        >
          Insert Unique Link
        </Button>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[200px] font-mono text-sm md:min-h-[300px]"
        placeholder="Enter your invitation message here..."
      />
      
      <div className="text-xs text-gray-500">
        <p>Available tags:</p>
        <ul className="list-disc list-inside ml-2 mt-1">
          <li><code className="bg-gray-100 px-1 rounded">{'{guest-name}'}</code> - Will be replaced with the guest's name</li>
          <li><code className="bg-gray-100 px-1 rounded">{'{unique-link}'}</code> - Will be replaced with the guest's unique invitation link</li>
        </ul>
      </div>
      
      <DialogFooter className="gap-2 flex-col sm:flex-row">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleReset}
          className="sm:mr-auto"
        >
          Reset to Default
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Event, RSVPConfig, RSVPField } from '@/types';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RSVPFieldBuilder } from './RSVPFieldBuilder';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const settingsSchema = z.object({
  rsvp_type: z.enum(['simple', 'detailed']),
  showEditButton: z.boolean().optional(),
});

interface RSVPSettingsContentProps {
  event: Event;
  onSave: (data: any) => void;
  isSaving: boolean;
  onCancel: () => void;
}

const getDefaultRSVPConfig = (templateName: string): RSVPConfig => {
  switch (templateName) {
    case 'WeddingTemplate':
      return {
        type: 'detailed',
        hasCustomFields: true,
        customFields: [
          { 
            id: 'guests_count', 
            field_name: 'guests_count', 
            field_label: 'Number of Guests', 
            field_type: 'select', 
            is_required: true, 
            field_options: ['1', '2', '3', '4', '5+'],
            display_order: 0
          },
          { 
            id: 'dietary_restrictions', 
            field_name: 'dietary_restrictions', 
            field_label: 'Dietary Restrictions', 
            field_type: 'textarea', 
            is_required: false, 
            placeholder_text: 'Any dietary restrictions or allergies?',
            display_order: 1
          },
          { 
            id: 'song_request', 
            field_name: 'song_request', 
            field_label: 'Song Request', 
            field_type: 'text', 
            is_required: false, 
            placeholder_text: 'Any song you\'d like to hear?',
            display_order: 2
          }
        ]
      };
    case 'BirthdayTemplate':
      return {
        type: 'detailed',
        hasCustomFields: true,
        customFields: [
          { 
            id: 'guests_count', 
            field_name: 'guests_count', 
            field_label: 'Number of Guests', 
            field_type: 'select', 
            is_required: true, 
            field_options: ['1', '2', '3', '4', '5+'],
            display_order: 0
          },
          { 
            id: 'message', 
            field_name: 'message', 
            field_label: 'Birthday Message', 
            field_type: 'textarea', 
            is_required: false, 
            placeholder_text: 'Leave a birthday message!',
            display_order: 1
          }
        ]
      };
    case 'CorporateTemplate':
      return { type: 'simple', hasCustomFields: false };
    case 'RoyalWeddingTemplate':
      return {
        type: 'detailed',
        hasCustomFields: true,
        customFields: [
          { 
            id: 'guests_count', 
            field_name: 'guests_count', 
            field_label: 'Number of Guests', 
            field_type: 'select', 
            is_required: true, 
            field_options: ['1', '2', '3', '4', '5+'],
            display_order: 0
          },
          { 
            id: 'dietary_restrictions', 
            field_name: 'dietary_restrictions', 
            field_label: 'Dietary Restrictions', 
            field_type: 'textarea', 
            is_required: false, 
            placeholder_text: 'Any dietary restrictions or allergies?',
            display_order: 1
          },
          { 
            id: 'song_request', 
            field_name: 'song_request', 
            field_label: 'Song Request', 
            field_type: 'text', 
            is_required: false, 
            placeholder_text: 'Any song you\'d like to hear?',
            display_order: 2
          }
        ]
      };
    default:
      return { type: 'simple', hasCustomFields: false };
  }
};

export const RSVPSettingsContent = ({ event, onSave, isSaving, onCancel }: RSVPSettingsContentProps) => {
  const [currentRsvpType, setCurrentRsvpType] = useState<'simple' | 'detailed'>('simple');
  const [customFields, setCustomFields] = useState<RSVPField[]>([]);

  // Fetch custom RSVP fields
  const { data: rsvpFields, refetch: refetchFields } = useQuery({
    queryKey: ['rsvp-fields', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvp_field_definitions')
        .select('*')
        .eq('event_id', event.id)
        .order('display_order');

      if (error) throw error;
      return data as RSVPField[];
    },
    enabled: !!event.id
  });

  useEffect(() => {
    if (rsvpFields) {
      setCustomFields(rsvpFields);
    }
  }, [rsvpFields]);

  // Parse current RSVP config from event
  const getCurrentRsvpConfig = (): RSVPConfig => {
    console.log('[RSVPSettings] Raw event.rsvp_config:', event.rsvp_config);
    console.log('[RSVPSettings] Raw event.allow_rsvp_edit:', event.allow_rsvp_edit);
    
    try {
      if (!event.rsvp_config) {
        console.log('[RSVPSettings] No rsvp_config found, defaulting to simple');
        return { type: 'simple' };
      }
      
      let config = event.rsvp_config;
      
      // Handle string JSON
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
          console.log('[RSVPSettings] Parsed string config:', config);
        } catch (e) {
          console.warn('[RSVPSettings] Failed to parse rsvp_config string:', config);
          return { type: 'simple' };
        }
      }
      
      // Validate object structure
      if (typeof config === 'object' && config !== null && 'type' in config) {
        const validConfig = config as RSVPConfig;
        
        // Use allow_rsvp_edit from database if available, otherwise use from config
        if (event.allow_rsvp_edit !== null && event.allow_rsvp_edit !== undefined) {
          validConfig.allowEditAfterSubmit = event.allow_rsvp_edit;
          console.log('[RSVPSettings] Using allow_rsvp_edit from database:', event.allow_rsvp_edit);
        }
        
        console.log('[RSVPSettings] Valid RSVP config found:', validConfig);
        return validConfig;
      }
      
      console.warn('[RSVPSettings] Invalid rsvp_config format:', config);
      return { type: 'simple' };
    } catch (error) {
      console.error('[RSVPSettings] Error parsing rsvp_config:', error);
      return { type: 'simple' };
    }
  };

  const currentConfig = getCurrentRsvpConfig();

  // Update local state when event changes
  useEffect(() => {
    setCurrentRsvpType(currentConfig.type || 'simple');
    console.log('[RSVPSettings] Updated currentRsvpType to:', currentConfig.type || 'simple');
  }, [currentConfig.type, event.id]);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    values: {
      rsvp_type: currentRsvpType,
      showEditButton: currentConfig.allowEditAfterSubmit ?? true,
    },
  });

  const onSubmit = async (values: z.infer<typeof settingsSchema>) => {
    console.log('[RSVPSettings] Form submitted with values:', values);
    console.log('[RSVPSettings] Current event:', { id: event.id, name: event.name });
    console.log('[RSVPSettings] Template info:', { 
      component_name: event.template?.component_name,
      name: event.template?.name 
    });

    try {
      let rsvpConfig: RSVPConfig;

      if (values.rsvp_type === 'detailed') {
        rsvpConfig = {
          type: 'detailed',
          hasCustomFields: customFields.length > 0,
          customFields: customFields,
          allowEditAfterSubmit: values.showEditButton ?? true
        };
        console.log('[RSVPSettings] Creating detailed config:', rsvpConfig);
      } else {
        rsvpConfig = { 
          type: 'simple',
          hasCustomFields: false
        };
        console.log('[RSVPSettings] Creating simple config:', rsvpConfig);
      }

      // Ensure type is always set
      rsvpConfig.type = values.rsvp_type;
      
      console.log('[RSVPSettings] Final config to save:', rsvpConfig);
      
      // Update local state immediately for optimistic UI
      setCurrentRsvpType(values.rsvp_type);
      
      // Save to database - update both rsvp_config and allow_rsvp_edit
      await onSave({ 
        rsvp_config: rsvpConfig,
        allow_rsvp_edit: values.showEditButton ?? true
      });
      
      console.log('[RSVPSettings] Save completed successfully');
      
    } catch (error) {
      console.error('[RSVPSettings] Save failed:', error);
      // Revert local state on error
      setCurrentRsvpType(currentConfig.type || 'simple');
      toast({
        title: 'Failed to save RSVP settings',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCustomFieldsChange = async (newFields: RSVPField[]) => {
    setCustomFields(newFields);
    refetchFields();
    
    // Auto-save RSVP config when custom fields change to preserve allow_rsvp_edit setting
    if (currentRsvpType === 'detailed') {
      try {
        const currentFormValues = form.getValues();
        const rsvpConfig = {
          type: 'detailed',
          hasCustomFields: newFields.length > 0,
          customFields: newFields,
          allowEditAfterSubmit: currentFormValues.showEditButton ?? true
        };
        
        console.log('[RSVPSettings] Auto-saving RSVP config after custom fields change:', rsvpConfig);
        
        await onSave({ 
          rsvp_config: rsvpConfig,
          allow_rsvp_edit: currentFormValues.showEditButton ?? true
        });
        
        console.log('[RSVPSettings] Auto-save completed successfully');
      } catch (error) {
        console.error('[RSVPSettings] Auto-save failed:', error);
        // Don't show error toast for auto-save, just log it
      }
    }
  };

  console.log('[RSVPSettings] Rendering form with currentRsvpType:', currentRsvpType);

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings">RSVP Settings</TabsTrigger>
        {currentRsvpType === 'detailed' && (
          <TabsTrigger value="fields">
            Custom Fields
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="settings" className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rsvp_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>RSVP Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        console.log('[RSVPSettings] RadioGroup value changed to:', value);
                        field.onChange(value);
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="simple" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Simple (Accept / Decline)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="detailed" />
                        </FormControl>
                         <FormLabel className="font-normal">
                           Detailed (Accept/Decline + Custom fields)
                         </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show Edit Button option only for detailed RSVP type */}
            {form.watch('rsvp_type') === 'detailed' && (
              <FormField
                control={form.control}
                name="showEditButton"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Show Edit RSVP Button
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow guests to edit their RSVP responses after submitting
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            <div className="text-sm text-muted-foreground">
              Current setting: <strong>{currentRsvpType}</strong>
              {currentConfig.type !== currentRsvpType && (
                <span className="ml-2 text-orange-600">(pending save)</span>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </TabsContent>

      {currentRsvpType === 'detailed' && (
        <TabsContent value="fields" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Custom RSVP Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create custom fields to collect specific information from your guests.
              </p>
            </div>
            
            <RSVPFieldBuilder
              eventId={event.id}
              fields={customFields}
              onFieldsChange={handleCustomFieldsChange}
            />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};
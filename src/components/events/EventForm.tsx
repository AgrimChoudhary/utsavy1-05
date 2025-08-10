import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, CheckCircle, CalendarIcon } from 'lucide-react';
import { Template, TemplateField } from '@/types';
import { eventSchema } from '@/lib/validations';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventFormProps {
  template: Template | null;
  onSubmit: (data: z.infer<typeof eventSchema>) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: any; // For edit mode
}

// Helper function to create a dynamic Zod schema based on template fields
const createDynamicSchema = (template: Template | null, tabName: string) => {
  if (!template || !template.fields) {
    return z.object({});
  }

  const fields = template.fields as Record<string, any>;
  const schemaFields: Record<string, any> = {};

  // Map tab names to field categories in the template
  const tabToFieldMap: Record<string, string[]> = {
    'basic': ['couple'],
    'venue': ['venue', 'events'],
    'family': ['family', 'contacts'],
    'photos': ['photos']
  };

  const relevantCategories = tabToFieldMap[tabName] || [];

  // Process each relevant category
  relevantCategories.forEach(category => {
    if (fields[category]) {
      if (fields[category].type === 'array') {
        // Handle array fields (like events, photos, contacts)
        schemaFields[category] = z.array(z.any()).optional();
      } else if (fields[category].type === 'object') {
        // Handle object fields with nested structure
        schemaFields[category] = z.object({}).passthrough().optional();
      } else if (typeof fields[category] === 'object') {
        // Handle category with multiple fields
        Object.keys(fields[category]).forEach(fieldName => {
          const field = fields[category][fieldName];
          if (field && field.type) {
            let fieldSchema;
            
            switch (field.type) {
              case 'text':
              case 'textarea':
              case 'date':
              case 'time':
              case 'image':
                fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
                break;
              case 'select':
                fieldSchema = field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional();
                break;
              case 'boolean':
                fieldSchema = z.boolean().optional();
                break;
              default:
                fieldSchema = z.any().optional();
            }
            
            schemaFields[fieldName] = fieldSchema;
          }
        });
      }
    }
  });

  return z.object(schemaFields).passthrough();
};

// Helper component to render dynamic form fields based on template
const DynamicField = ({ 
  template, 
  category, 
  fieldName, 
  control, 
  errors,
  defaultValue
}: { 
  template: Template | null;
  category: string;
  fieldName: string;
  control: any;
  errors: any;
  defaultValue?: any;
}) => {
  if (!template || !template.fields) return null;
  
  const fields = template.fields as Record<string, any>;
  if (!fields[category]) return null;
  
  const fieldConfig = fields[category][fieldName];
  if (!fieldConfig || !fieldConfig.type) return null;
  
  const fieldType = fieldConfig.type;
  const fieldLabel = fieldConfig.label || fieldName;
  const isRequired = fieldConfig.required || false;
  
  return (
    <FormField
      control={control}
      name={`details.${fieldName}`}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            {fieldType === 'text' && <Input {...field} placeholder={`Enter ${fieldLabel.toLowerCase()}`} />}
            {fieldType === 'textarea' && <Textarea {...field} placeholder={`Enter ${fieldLabel.toLowerCase()}`} />}
            {fieldType === 'date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            {fieldType === 'time' && (
              <TimePicker
                value={field.value}
                onChange={field.onChange}
                selectedDate={field.value}
              />
            )}
            {fieldType === 'image' && (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                bucket="images"
                folder="gallery"
                placeholder={`Upload ${fieldLabel.toLowerCase()}`}
              />
            )}
            {fieldType === 'select' && fieldConfig.options && (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-row space-x-6"
              >
                {fieldConfig.options.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${fieldName}-${option}`} />
                    <Label htmlFor={`${fieldName}-${option}`}>{option.charAt(0).toUpperCase() + option.slice(1)} First</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {fieldType === 'boolean' && (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          </FormControl>
          {errors?.details?.[fieldName] && (
            <FormMessage>{errors.details[fieldName].message}</FormMessage>
          )}
        </FormItem>
      )}
    />
  );
};

const STORAGE_KEY = 'event-form-draft';

export const EventForm = ({ template, onSubmit, onBack, isLoading, initialData }: EventFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  // Determine if the template has fields defined
  const hasTemplateFields = template && template.fields && Object.keys(template.fields).length > 0;

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      name: '',
      details: {
        // Basic couple information
        bride_name: '',
        groom_name: '',
        bride_city: '',
        groom_city: '',
        wedding_date: '',
        wedding_time: '',
        couple_tagline: '',
        display_order: 'bride', // bride or groom first
        
        // Main venue details
        venue_address: '',
        venue_map_link: '',
        
        // Dynamic arrays
        events: [],
        bride_family: { title: '', members: [] },
        groom_family: { title: '', members: [] },
        contacts: [],
        photos: []
      },
    },
  });

  // Field arrays for dynamic sections
  // Only create field arrays if the template doesn't have custom fields
  const eventFieldArray = !hasTemplateFields ? useFieldArray({
    control: form.control,
    name: 'details.events' as any
  }) : { fields: [], append: () => {}, remove: () => {} };

  const brideFamilyFieldArray = !hasTemplateFields ? useFieldArray({
    control: form.control,
    name: 'details.bride_family.members' as any
  }) : { fields: [], append: () => {}, remove: () => {} };

  const groomFamilyFieldArray = !hasTemplateFields ? useFieldArray({
    control: form.control,
    name: 'details.groom_family.members' as any
  }) : { fields: [], append: () => {}, remove: () => {} };

  const contactFieldArray = !hasTemplateFields ? useFieldArray({
    control: form.control,
    name: 'details.contacts' as any
  }) : { fields: [], append: () => {}, remove: () => {} };

  const photoFieldArray = !hasTemplateFields ? useFieldArray({
    control: form.control,
    name: 'details.photos' as any
  }) : { fields: [], append: () => {}, remove: () => {} };

  // Destructure for easier access
  const { fields: eventFields, append: appendEvent, remove: removeEvent } = eventFieldArray;
  const { fields: brideFamilyFields, append: appendBrideMember, remove: removeBrideMember } = brideFamilyFieldArray;
  const { fields: groomFamilyFields, append: appendGroomMember, remove: removeGroomMember } = groomFamilyFieldArray;
  const { fields: contactFields, append: appendContact, remove: removeContact } = contactFieldArray;
  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = photoFieldArray;

  // Load draft data on component mount
  useEffect(() => {
    if (!initialData) {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          form.reset(draftData);
          toast({
            title: "Draft Loaded",
            description: "Your previous work has been restored."
          });
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [form, initialData]);

  // Save draft to localStorage
  const saveDraft = () => {
    const currentData = form.getValues();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved."
    });
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Tab validation schemas
  const getTabValidationSchema = (tabName: string) => {
    switch (tabName) {
      case 'basic': {
        // If template has fields, use dynamic schema
        if (hasTemplateFields) {
          const dynamicSchema = createDynamicSchema(template, 'basic');
          return z.object({
            name: z.string().min(1, 'Event name is required'),
            details: dynamicSchema
          });
        } else {
          // Default schema for templates without fields property
          return z.object({
            name: z.string().min(1, 'Event name is required'),
            details: z.object({
              bride_name: z.string().min(1, 'Bride name is required'),
              groom_name: z.string().min(1, 'Groom name is required'),
              wedding_date: z.string().min(1, 'Wedding date is required'),
              wedding_time: z.string().min(1, 'Wedding time is required'),
              couple_tagline: z.string().optional(),
              display_order: z.string(),
            })
          });
        }
      }
      case 'venue': {
        if (hasTemplateFields) {
          const dynamicSchema = createDynamicSchema(template, 'venue');
          return z.object({
            details: dynamicSchema
          });
        } else {
          return z.object({
            details: z.object({
              venue_address: z.string().min(1, 'Venue address is required'),
              venue_map_link: z.string().optional(),
              events: z.array(z.any()).optional(),
            })
          });
        }
      }
      case 'family': {
        if (hasTemplateFields) {
          const dynamicSchema = createDynamicSchema(template, 'family');
          return z.object({
            details: dynamicSchema
          });
        } else {
          return z.object({
            details: z.object({
              bride_family: z.any().optional(),
              groom_family: z.any().optional(),
              contacts: z.array(z.any()).optional(),
            })
          });
        }
      }
      case 'photos': {
        if (hasTemplateFields) {
          const dynamicSchema = createDynamicSchema(template, 'photos');
          return z.object({
            details: dynamicSchema
          });
        } else {
          return z.object({
            details: z.object({
              photos: z.array(z.any()).optional(),
            })
          });
        }
      }
      default: {
        return z.object({});
      }
    }
  };

  // Validate current tab
  const validateCurrentTab = async (tabName: string) => {
    const schema = getTabValidationSchema(tabName);
    const currentData = form.getValues();
    
    try {
      await schema.parseAsync(currentData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const fieldPath = err.path.join('.');
          form.setError(fieldPath as any, { message: err.message });
        });
      }
      return false;
    }
  };

  // Handle tab navigation with validation
  const handleTabChange = async (newTab: string) => {
    const isValid = await validateCurrentTab(activeTab);
    
    if (isValid) {
      if (!completedTabs.includes(activeTab)) {
        setCompletedTabs(prev => [...prev, activeTab]);
      }
      saveDraft();
      setActiveTab(newTab);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive"
      });
    }
  };

  // Handle save and next
  const handleSaveAndNext = async () => {
    const tabs = ['basic', 'venue', 'family', 'photos'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (currentIndex < tabs.length - 1) {
      await handleTabChange(tabs[currentIndex + 1]);
    }
  };

  // Handle previous
  const handlePrevious = () => {
    const tabs = ['basic', 'venue', 'family', 'photos'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleSubmit = (data: z.infer<typeof eventSchema>) => {
    // Transform data for template compatibility
    const transformedData = {
      ...data,
      details: {
        ...data.details,
        // Set groom_first based on display_order
        groom_first: data.details.display_order === 'groom',
        // Ensure proper contact format
        contacts: data.details.contacts?.map(contact => ({
          name: contact.name || '',
          phone: contact.phone || '',
          relation: contact.relation || ''
        })) || [],
        // Ensure proper event format
        events: data.details.events?.map(event => ({
          name: event.name || '',
          date: event.date || '',
          time: event.time || '',
          venue: event.venue || '',
          map_link: event.map_link || '',
          description: event.description || ''
        })) || [],
        // Ensure proper photo format
        photos: data.details.photos?.map(photo => ({
          src: photo.src || '',
          alt: photo.alt || '',
          title: photo.title || photo.alt || '',
          description: photo.description || ''
        })) || []
      }
    };
    
    clearDraft(); // Clear draft on successful submission
    onSubmit(transformedData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'venue', label: 'Venue & Timeline', icon: '📍' },
    { id: 'family', label: 'Family & Contacts', icon: '👨‍👩‍👧‍👦' },
    { id: 'photos', label: 'Photo Gallery', icon: '📸' }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;

  // Get today's date for date picker min date
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Your Event' : 'Customize Your Event'}
          </h2>
          <p className="text-gray-600">Fill in the details for your {template?.name || 'event'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={saveDraft} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back to Templates
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Step {currentTabIndex + 1} of {tabs.length}
        </div>
        <div className="flex space-x-2">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`w-3 h-3 rounded-full ${
                index <= currentTabIndex
                  ? 'bg-purple-600'
                  : completedTabs.includes(tab.id)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.bride_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bride's Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bride's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.groom_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Groom's Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter groom's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.wedding_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Wedding Date <span className="text-red-500">*</span></FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                disabled={{ before: today }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.wedding_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wedding Time <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                              selectedDate={form.watch('details.wedding_date')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="details.couple_tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couple Tagline / Quote</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter a beautiful quote or tagline for the couple" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details.display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="bride" id="bride-first" />
                              <Label htmlFor="bride-first">Bride First</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="groom" id="groom-first" />
                              <Label htmlFor="groom-first">Groom First</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Venue & Timeline Tab */}
            <TabsContent value="venue" className="space-y-6">
              {/* Main Venue Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Main Venue Details</CardTitle>
                  <p className="text-sm text-gray-600">This information will appear in the venue location card</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasTemplateFields ? (
                    // Render dynamic venue fields
                    <div className="space-y-4">
                      {template?.fields?.venue && Object.keys(template.fields.venue).map(fieldName => (
                        <DynamicField
                          key={fieldName}
                          template={template}
                          category="venue"
                          fieldName={fieldName}
                          control={form.control}
                          errors={form.formState.errors}
                          defaultValue={initialData?.details?.[fieldName]}
                        />
                      ))}
                    </div>
                  ) : (
                    // Default venue fields
                    <>
                      <FormField
                        control={form.control}
                        name="details.venue_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Address <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter complete venue address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="details.venue_map_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Maps Link (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://maps.google.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Event Timeline
                    {!hasTemplateFields && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendEvent({
                          name: '',
                          date: '',
                          time: '',
                          venue: '',
                          map_link: '',
                          description: ''
                        })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasTemplateFields && template?.fields?.events ? (
                    // Render dynamic events fields based on template
                    <div className="space-y-4">
                      {/* This would need a more complex implementation for array fields */}
                      <p className="text-sm text-gray-600">
                        Events configuration for this template is handled in a specialized way.
                        Please fill out the basic information first and then manage events in the event settings.
                      </p>
                    </div>
                  ) : (
                    // Default events fields
                    <>
                      {eventFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Event {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEvent(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`details.events.${index}.name` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Event Name <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Mehndi Ceremony" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`details.events.${index}.date` as any}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(new Date(field.value), "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                        disabled={{ before: today }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`details.events.${index}.time` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <TimePicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      selectedDate={form.watch(`details.events.${index}.date` as any)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`details.events.${index}.venue` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Venue</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Event venue" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`details.events.${index}.description` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Event description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`details.events.${index}.map_link` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Google Maps Link (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://maps.google.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      {eventFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No events added yet. Click "Add Event" to get started.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Family & Contacts Tab */}
            <TabsContent value="family" className="space-y-6">
              {/* Family Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasTemplateFields ? (
                    // Render dynamic family fields
                    <div className="space-y-4">
                      {template?.fields?.family && Object.keys(template.fields.family).map(fieldName => (
                        <DynamicField
                          key={fieldName}
                          template={template}
                          category="family"
                          fieldName={fieldName}
                          control={form.control}
                          errors={form.formState.errors}
                          defaultValue={initialData?.details?.[fieldName]}
                        />
                      ))}
                    </div>
                  ) : (
                    // Default family fields
                    <>
                      {/* Bride's Family */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Bride's Family</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendBrideMember({ name: '', relation: '' })}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="details.bride_family.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Parents of the Bride" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {brideFamilyFields.map((field, index) => (
                          <div key={field.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium">Member {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBrideMember(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`details.bride_family.members.${index}.name` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Family member name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`details.bride_family.members.${index}.relation` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Relation</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Father, Mother" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Groom's Family */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Groom's Family</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendGroomMember({ name: '', relation: '' })}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="details.groom_family.title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Parents of the Groom" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {groomFamilyFields.map((field, index) => (
                          <div key={field.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium">Member {index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGroomMember(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`details.groom_family.members.${index}.name` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Family member name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`details.groom_family.members.${index}.relation` as any}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Relation</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Father, Mother" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Contact Information
                    {!hasTemplateFields && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendContact({ name: '', phone: '', relation: '' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasTemplateFields && template?.fields?.contacts ? (
                    // Render dynamic contacts fields
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Contact configuration for this template is handled in a specialized way.
                      </p>
                    </div>
                  ) : (
                    // Default contacts fields
                    <>
                      {contactFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Contact {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`details.contacts.${index}.name` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Contact name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`details.contacts.${index}.phone` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Phone number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`details.contacts.${index}.relation` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relation</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Uncle, Aunt" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}

                      {contactFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No contacts added yet. Click "Add Contact" to get started.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Photo Gallery
                    {!hasTemplateFields && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendPhoto({ src: '', alt: '', title: '', description: '' })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Photo
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasTemplateFields ? (
                    // Render dynamic photo fields
                    <div className="space-y-4">
                      {template?.fields?.photos && Object.keys(template.fields.photos).map(fieldName => (
                        <DynamicField
                          key={fieldName}
                          template={template}
                          category="photos"
                          fieldName={fieldName}
                          control={form.control}
                          errors={form.formState.errors}
                          defaultValue={initialData?.details?.[fieldName]}
                        />
                      ))}
                    </div>
                  ) : (
                    // Default photo fields
                    <>
                      {photoFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Photo {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePhoto(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`details.photos.${index}.src` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Photo</FormLabel>
                                <FormControl>
                                  <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    bucket="images"
                                    folder="gallery"
                                    placeholder="Upload photo"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`details.photos.${index}.title` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Photo title" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`details.photos.${index}.alt` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alt Text</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Alt text for accessibility" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`details.photos.${index}.description` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Photo description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      {photoFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No photos added yet. Click "Add Photo" to get started.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentTabIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!isLastTab ? (
                <Button
                  type="button"
                  onClick={handleSaveAndNext}
                  disabled={isLoading}
                >
                  Save & Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Event
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
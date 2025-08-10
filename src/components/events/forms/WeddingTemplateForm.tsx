import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, CheckCircle, CalendarIcon } from 'lucide-react';
import { Template } from '@/types';
import { eventSchema } from '@/lib/validations';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeddingTemplateFormProps {
  template: Template | null;
  onSubmit: (data: z.infer<typeof eventSchema>) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: any; // For edit mode
}

const STORAGE_KEY = 'event-form-draft';

export const WeddingTemplateForm = ({ template, onSubmit, onBack, isLoading, initialData }: WeddingTemplateFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      name: '',
      details: {
        // Basic couple information
        bride_name: '',
        groom_name: '',
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
  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: 'details.events' as any
  });

  const { fields: brideFamilyFields, append: appendBrideMember, remove: removeBrideMember } = useFieldArray({
    control: form.control,
    name: 'details.bride_family.members' as any
  });

  const { fields: groomFamilyFields, append: appendGroomMember, remove: removeGroomMember } = useFieldArray({
    control: form.control,
    name: 'details.groom_family.members' as any
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: 'details.contacts' as any
  });

  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({
    control: form.control,
    name: 'details.photos' as any
  });

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
      case 'basic':
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
      case 'venue':
        return z.object({
          details: z.object({
            venue_address: z.string().min(1, 'Venue address is required'),
            venue_map_link: z.string().optional(),
            events: z.array(z.any()).optional(),
          })
        });
      case 'family':
        return z.object({
          details: z.object({
            bride_family: z.any().optional(),
            groom_family: z.any().optional(),
            contacts: z.array(z.any()).optional(),
          })
        });
      case 'photos':
        return z.object({
          details: z.object({
            photos: z.array(z.any()).optional(),
          })
        });
      default:
        return z.object({});
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
          phone: contact.phone || ''
        })) || [],
        // Ensure proper event format
        events: data.details.events?.map(event => ({
          name: event.name || '',
          date: event.date || '',
          time: event.time || '',
          venue: event.venue || '',
          map_link: event.map_link || ''
        })) || [],
        // Ensure proper photo format
        photos: data.details.photos?.map(photo => ({
          src: photo.src || '',
          alt: photo.alt || ''
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
                </CardContent>
              </Card>

              {/* Event Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Event Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                              <FormLabel>Venue <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Venue name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`details.events.${index}.map_link` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Map Link (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://maps.google.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Add Event button at the bottom of each event card */}
                      {index === eventFields.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => appendEvent({ name: '', date: '', time: '', venue: '', map_link: '' })}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Event
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Show Add Event button only if there are no events yet */}
                  {eventFields.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendEvent({ name: '', date: '', time: '', venue: '', map_link: '' })}
                      className="w-full mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Family & Contacts Tab */}
            <TabsContent value="family" className="space-y-6">
              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                  <p className="text-sm text-gray-600">These contacts will appear at the bottom of the invitation</p>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`details.contacts.${index}.name` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Mr. Rajesh Sharma" {...field} />
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
                              <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="+91 98765 43210" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Add Contact button at the bottom of each contact card */}
                      {index === contactFields.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => appendContact({ name: '', phone: '' })}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Contact
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Show Add Contact button only if there are no contacts yet */}
                  {contactFields.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendContact({ name: '', phone: '' })}
                      className="w-full mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Family Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bride's Family */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bride's Family</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="details.bride_family.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sharma Family" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {brideFamilyFields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Family Member {index + 1}</h4>
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
                                <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Member name" {...field} />
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

                        <FormField
                          control={form.control}
                          name={`details.bride_family.members.${index}.photo` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Member Photo</FormLabel>
                              <FormControl>
                                <ImageUpload
                                  value={field.value}
                                  onChange={field.onChange}
                                  bucket="images"
                                  folder="bride-family"
                                  placeholder="Upload family member photo"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Add Family Member button at the bottom of each member card */}
                        {index === brideFamilyFields.length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => appendBrideMember({ name: '', relation: '', photo: '' })}
                            className="w-full mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Family Member
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {/* Show Add Family Member button only if there are no members yet */}
                    {brideFamilyFields.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendBrideMember({ name: '', relation: '', photo: '' })}
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Family Member
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Groom's Family */}
                <Card>
                  <CardHeader>
                    <CardTitle>Groom's Family</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="details.groom_family.title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Family Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Kapoor Family" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {groomFamilyFields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Family Member {index + 1}</h4>
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
                                <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Member name" {...field} />
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

                        <FormField
                          control={form.control}
                          name={`details.groom_family.members.${index}.photo` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family Member Photo</FormLabel>
                              <FormControl>
                                <ImageUpload
                                  value={field.value}
                                  onChange={field.onChange}
                                  bucket="images"
                                  folder="groom-family"
                                  placeholder="Upload family member photo"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Add Family Member button at the bottom of each member card */}
                        {index === groomFamilyFields.length - 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => appendGroomMember({ name: '', relation: '', photo: '' })}
                            className="w-full mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Family Member
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {/* Show Add Family Member button only if there are no members yet */}
                    {groomFamilyFields.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendGroomMember({ name: '', relation: '', photo: '' })}
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Family Member
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Photo Gallery Tab */}
            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photoFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Gallery Photo {index + 1}</h4>
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
                            <FormLabel>Gallery Photo <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value}
                                onChange={field.onChange}
                                bucket="images"
                                folder="gallery"
                                placeholder="Upload gallery photo"
                              />
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
                            <FormLabel>Photo Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Describe the photo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Add Photo button at the bottom of each photo card */}
                      {index === photoFields.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => appendPhoto({ src: '', alt: '' })}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Photo
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {/* Show Add Photo button only if there are no photos yet */}
                  {photoFields.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendPhoto({ src: '', alt: '' })}
                      className="w-full mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation Controls */}
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
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save & Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isLoading ? "Creating..." : initialData ? "Update Event" : "Create Event"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, CheckCircle, CalendarIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { Template } from '@/types';
import { eventSchema } from '@/lib/validations';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BirthdayTemplateFormProps {
  template: Template | null;
  onSubmit: (data: z.infer<typeof eventSchema>) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: any; // For edit mode
}

const STORAGE_KEY = 'birthday-form-draft';

export const BirthdayTemplateForm = ({ template, onSubmit, onBack, isLoading, initialData }: BirthdayTemplateFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      name: '',
      details: {
        // Basic information
        birthday_person: '',
        age: '',
        date: '',
        time: '',
        theme: '',
        
        // Venue details
        venue: '',
        address: '',
        map_link: '',
        
        // Additional details
        special_instructions: '',
        
        // Photos and contacts
        photos: [],
        contacts: []
      },
    },
  });

  // Field arrays for dynamic sections
  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({
    control: form.control,
    name: 'details.photos' as any
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: 'details.contacts' as any
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
            birthday_person: z.string().min(1, 'Birthday person name is required'),
            age: z.string().optional(),
            date: z.string().min(1, 'Date is required'),
            time: z.string().min(1, 'Time is required'),
            theme: z.string().optional(),
          })
        });
      case 'venue':
        return z.object({
          details: z.object({
            venue: z.string().min(1, 'Venue is required'),
            address: z.string().min(1, 'Address is required'),
            map_link: z.string().optional(),
            special_instructions: z.string().optional(),
          })
        });
      case 'gallery':
        return z.object({
          details: z.object({
            photos: z.array(z.any()).optional(),
            contacts: z.array(z.any()).optional(),
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
    const tabs = ['basic', 'venue', 'gallery'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (currentIndex < tabs.length - 1) {
      await handleTabChange(tabs[currentIndex + 1]);
    }
  };

  // Handle previous
  const handlePrevious = () => {
    const tabs = ['basic', 'venue', 'gallery'];
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
        // Ensure proper contact format
        contacts: data.details.contacts?.map(contact => ({
          name: contact.name || '',
          phone: contact.phone || ''
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
    { id: 'basic', label: 'Basic Info', icon: '🎂' },
    { id: 'venue', label: 'Venue & Details', icon: '🏠' },
    { id: 'gallery', label: 'Gallery & Contacts', icon: '📸' }
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
            {initialData ? 'Edit Your Birthday Event' : 'Create Birthday Event'}
          </h2>
          <p className="text-gray-600">Fill in the details for your {template?.name || 'birthday event'}</p>
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
            <TabsList className="grid w-full grid-cols-3">
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
                          <Input placeholder="Enter event name (e.g., John's 30th Birthday)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.birthday_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthday Person's Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="details.age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter age (e.g., 30)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Event Date <span className="text-red-500">*</span></FormLabel>
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
                      name="details.time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Time <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                              selectedDate={form.watch('details.date')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="details.theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Theme (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter party theme (e.g., Retro 80s, Superhero)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Venue & Details Tab */}
            <TabsContent value="venue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="details.venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter venue name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details.address"
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
                    name="details.map_link"
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

                  <FormField
                    control={form.control}
                    name="details.special_instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any special instructions for guests (e.g., dress code, gift preferences, parking information)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery & Contacts Tab */}
            <TabsContent value="gallery" className="space-y-6">
              {/* Photo Gallery */}
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
                                <Input placeholder="e.g., John Smith" {...field} />
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
                                <Input placeholder="+1 234 567 8900" {...field} />
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
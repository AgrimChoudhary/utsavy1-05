import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Template } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

// Enhanced schema for Royal Wedding with new 5-tab structure
const royalWeddingSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  details: z.object({
    // Tab 1: Couple Details
    groom_name: z.string().min(1, 'Groom name is required'),
    bride_name: z.string().min(1, 'Bride name is required'),
    groom_city: z.string().optional(),
    bride_city: z.string().optional(),
    wedding_date: z.string().min(1, 'Wedding date is required'),
    wedding_time: z.string().min(1, 'Wedding time is required'),
    groom_first: z.boolean().default(true),
    couple_image: z.string().optional(),
    
    // Contact Details (dynamic)
    contacts: z.array(z.object({
      name: z.string().min(1, 'Contact name is required'),
      phone: z.string().min(1, 'Phone number is required'),
      relation: z.string().optional()
    })).optional().default([]),
    
    // Tab 2: Venue Details
    venue_name: z.string().min(1, 'Main wedding venue name is required'),
    venue_address: z.string().min(1, 'Venue address is required'),
    venue_map_link: z.string().optional(),
    
    // Tab 3: Family Details (no family title, new structure)
    bride_family_photo: z.string().optional(),
    bride_parents_names: z.string().optional(),
    bride_family: z.object({
      members: z.array(z.object({
        name: z.string().min(1, 'Family member name is required'),
        relation: z.string().optional(),
        description: z.string().optional(),
        photo: z.string().optional()
      })).optional().default([])
    }).optional(),
    
    groom_family_photo: z.string().optional(),
    groom_parents_names: z.string().optional(),
    groom_family: z.object({
      members: z.array(z.object({
        name: z.string().min(1, 'Family member name is required'),
        relation: z.string().optional(),
        description: z.string().optional(),
        photo: z.string().optional()
      })).optional().default([])
    }).optional(),
    
    // Tab 4: Photos (gallery only, no main couple photo)
    photos: z.array(z.object({
      photo: z.string().min(1, 'Photo is required'),
      title: z.string().optional()
    })).optional().default([]),
    
    // Tab 5: Events (with map link)
    events: z.array(z.object({
      name: z.string().min(1, 'Event name is required'),
      date: z.string().min(1, 'Event date is required'),
      time: z.string().min(1, 'Event time is required'),
      venue: z.string().min(1, 'Event venue is required'),
      description: z.string().optional(),
      map_link: z.string().optional()
    })).optional().default([])
  })
});

type RoyalWeddingFormData = z.infer<typeof royalWeddingSchema>;

interface RoyalWeddingTemplateFormProps {
  template: Template;
  onSubmit: (data: RoyalWeddingFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: any;
}

export const RoyalWeddingTemplateForm = ({
  template,
  onSubmit,
  onBack,
  isLoading,
  initialData
}: RoyalWeddingTemplateFormProps) => {
  const form = useForm<RoyalWeddingFormData>({
    resolver: zodResolver(royalWeddingSchema),
    defaultValues: {
      name: initialData?.name || '',
      details: {
        groom_name: initialData?.details?.groom_name || '',
        bride_name: initialData?.details?.bride_name || '',
        groom_city: initialData?.details?.groom_city || '',
        bride_city: initialData?.details?.bride_city || '',
        groom_first: initialData?.details?.groom_first ?? true,
        wedding_date: initialData?.details?.wedding_date || '',
        wedding_time: initialData?.details?.wedding_time || '',
        couple_image: initialData?.details?.couple_image || '',
        venue_name: initialData?.details?.venue_name || '',
        venue_address: initialData?.details?.venue_address || '',
        venue_map_link: initialData?.details?.venue_map_link || '',
        bride_family_photo: initialData?.details?.bride_family_photo || '',
        bride_parents_names: initialData?.details?.bride_parents_names || '',
        groom_family_photo: initialData?.details?.groom_family_photo || '',
        groom_parents_names: initialData?.details?.groom_parents_names || '',
        contacts: initialData?.details?.contacts || [],
        bride_family: {
          members: initialData?.details?.bride_family?.members || []
        },
        groom_family: {
          members: initialData?.details?.groom_family?.members || []
        },
        photos: initialData?.details?.photos || [],
        events: initialData?.details?.events || []
      }
    }
  });

  const { 
    fields: photoFields, 
    append: appendPhoto, 
    remove: removePhoto 
  } = useFieldArray({
    control: form.control,
    name: 'details.photos'
  });

  const { 
    fields: contactFields, 
    append: appendContact, 
    remove: removeContact 
  } = useFieldArray({
    control: form.control,
    name: 'details.contacts'
  });

  const { 
    fields: brideFamilyFields, 
    append: appendBrideFamily, 
    remove: removeBrideFamily 
  } = useFieldArray({
    control: form.control,
    name: 'details.bride_family.members'
  });

  const { 
    fields: groomFamilyFields, 
    append: appendGroomFamily, 
    remove: removeGroomFamily 
  } = useFieldArray({
    control: form.control,
    name: 'details.groom_family.members'
  });

  const { 
    fields: eventFields, 
    append: appendEvent, 
    remove: removeEvent 
  } = useFieldArray({
    control: form.control,
    name: 'details.events'
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-gray-600">Configure your royal wedding invitation</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Tabs defaultValue="couple" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="couple">Couple</TabsTrigger>
              <TabsTrigger value="venue">Venue</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            {/* Tab 1: Couple Details */}
            <TabsContent value="couple" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Couple Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.groom_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Groom Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter groom's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="details.groom_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Groom's City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter groom's city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="details.bride_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bride Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bride's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="details.bride_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bride's City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter bride's city" {...field} />
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
                        <FormItem>
                          <FormLabel>Wedding Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="details.wedding_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wedding Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="details.groom_first"
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
                            Display Groom Name First
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details.couple_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couple Photo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={field.onChange}
                            bucket="gallery-photos"
                            placeholder="Upload couple photo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`details.contacts.${index}.name`}
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
                        name={`details.contacts.${index}.phone`}
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
                        name={`details.contacts.${index}.relation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relation</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Bride's Father" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendContact({ name: '', phone: '', relation: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Venue */}
            <TabsContent value="venue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="details.venue_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Wedding Venue Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter venue name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="details.venue_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Address</FormLabel>
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
            </TabsContent>

            {/* Tab 3: Family */}
            <TabsContent value="family" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bride's Family</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="details.bride_family_photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Photo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={field.onChange}
                            bucket="bride-family"
                            placeholder="Upload bride's family photo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.bride_parents_names"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parents Names</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mr. & Mrs. Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Family Members</h4>
                    {brideFamilyFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name={`details.bride_family.members.${index}.name`}
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
                          name={`details.bride_family.members.${index}.relation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relation</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Uncle, Cousin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`details.bride_family.members.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Chief Guest" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`details.bride_family.members.${index}.photo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photo</FormLabel>
                              <FormControl>
                                <ImageUpload
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  bucket="bride-family"
                                  placeholder="Upload photo"
                                  className="h-20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeBrideFamily(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendBrideFamily({ name: '', relation: '', description: '', photo: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Family Member
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Groom's Family</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="details.groom_family_photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Photo</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ''}
                            onChange={field.onChange}
                            bucket="groom-family"
                            placeholder="Upload groom's family photo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="details.groom_parents_names"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parents Names</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mr. & Mrs. Johnson" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Family Members</h4>
                    {groomFamilyFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                        <FormField
                          control={form.control}
                          name={`details.groom_family.members.${index}.name`}
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
                          name={`details.groom_family.members.${index}.relation`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relation</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Uncle, Cousin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`details.groom_family.members.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Chief Guest" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`details.groom_family.members.${index}.photo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photo</FormLabel>
                              <FormControl>
                                <ImageUpload
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  bucket="groom-family"
                                  placeholder="Upload photo"
                                  className="h-20"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeGroomFamily(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendGroomFamily({ name: '', relation: '', description: '', photo: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Family Member
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Photos */}
            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gallery Photos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photoFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`details.photos.${index}.photo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Photo</FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value || ''}
                                onChange={field.onChange}
                                bucket="gallery-photos"
                                placeholder="Upload gallery photo"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`details.photos.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Photo title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removePhoto(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendPhoto({ photo: '', title: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Events */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wedding Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`details.events.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Sangam, Reception" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`details.events.${index}.date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`details.events.${index}.time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`details.events.${index}.venue`}
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
                      <FormField
                        control={form.control}
                        name={`details.events.${index}.map_link`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Map Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://maps.google.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeEvent(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendEvent({ name: '', date: '', time: '', venue: '', description: '', map_link: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Royal Wedding Event'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
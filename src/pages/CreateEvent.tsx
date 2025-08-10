import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTemplates, useCreateEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TemplateCard } from '@/components/events/TemplateCard';
import { TemplatePreview } from '@/components/events/TemplatePreview';
import { CategoryFilter } from '@/components/events/CategoryFilter';
import { TemplateFormDispatcher } from '@/components/events/TemplateFormDispatcher';
import { Template } from '@/types';
import { z } from 'zod';
import { eventSchema } from '@/lib/validations';

const CreateEvent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const createEventMutation = useCreateEvent();
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [step, setStep] = useState<'template' | 'form'>('template');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || templatesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setStep('form');
  };

  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handlePreviewSelect = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(false);
    setStep('form');
  };

  const handleFormSubmit = async (data: z.infer<typeof eventSchema>) => {
    if (!selectedTemplate || !user) return;

    const eventData = {
      name: data.name,
      template_id: selectedTemplate.id,
      details: data.details,
      page_name: selectedTemplate.component_name.toLowerCase(),
      host_id: user.id,
    };

    createEventMutation.mutate(eventData, {
      onSuccess: (event) => {
        navigate(`/events/${event.id}/manage`);
      },
    });
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('template');
      setSelectedTemplate(null);
    } else {
      navigate('/dashboard');
    }
  };

  // Use templates from database (including the external template we just added)
  const allTemplates = templates || [];

  // Categorize templates
  const categorizeTemplate = (template: Template) => {
    if (template.component_name.includes('Wedding') || template.template_type === 'external') return 'Wedding';
    if (template.component_name.includes('Corporate')) return 'Corporate';
    if (template.component_name.includes('Birthday')) return 'Birthday';
    return 'Other';
  };

  const groupedTemplates = allTemplates.reduce((acc, template) => {
    const category = categorizeTemplate(template);
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const categories = Object.keys(groupedTemplates);
  const categoryCounts = Object.entries(groupedTemplates).reduce((acc, [category, templates]) => {
    acc[category] = templates.length;
    return acc;
  }, {} as Record<string, number>);

  // Filter templates based on selected category
  const filteredTemplates = selectedCategory 
    ? { [selectedCategory]: groupedTemplates[selectedCategory] || [] }
    : groupedTemplates;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-md border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Create New Event
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {step === 'template' ? 'Choose a template' : 'Configure event details'}
              </p>
            </div>
            
            <Link to="/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center gap-2"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'template' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Choose Your Template</h2>
              <p className="text-gray-600 text-lg">Select a template that matches your event style</p>
            </div>

            {categories.length > 0 && (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                categoryCounts={categoryCounts}
              />
            )}

            {Object.keys(filteredTemplates).length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                  <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Templates Available</h3>
                  <p className="text-gray-500">Templates will be loaded from the database.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(filteredTemplates).map(([category, categoryTemplates]) => (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-semibold text-gray-800">{category} Templates</h3>
                      <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                        {categoryTemplates.length}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoryTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onSelect={handleTemplateSelect}
                          onPreview={handleTemplatePreview}
                          isSelected={selectedTemplate?.id === template.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                
                {!selectedCategory && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-8 text-center">
                    <Plus className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-800 mb-3">More Templates Coming Soon!</h4>
                    <p className="text-gray-600 text-lg">We're constantly adding new templates for every occasion.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'form' && selectedTemplate && (
          <TemplateFormDispatcher
            template={selectedTemplate}
            onSubmit={handleFormSubmit}
            onBack={handleBack}
            isLoading={createEventMutation.isPending}
          />
        )}

        <TemplatePreview
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onSelect={handlePreviewSelect}
        />
      </main>
    </div>
  );
};

export default CreateEvent;
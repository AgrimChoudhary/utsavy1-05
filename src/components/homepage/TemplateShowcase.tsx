import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Template } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { constructInvitationUrl, getTemplateBaseUrl } from '@/utils/iframeMessaging';
import { ArrowRight, ExternalLink, Smartphone, Monitor, Sparkles, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface TemplateShowcaseProps {
  templates: Template[];
}

const TemplateShowcase = ({ templates }: TemplateShowcaseProps) => {
  const [activeCategory, setActiveCategory] = useState('wedding');
  const [isMobileView, setIsMobileView] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const isMobile = useIsMobile();
  const frameContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile dimensions (iPhone-like)
  const MOBILE_WIDTH = 360;
  const MOBILE_HEIGHT = 740;
  
  // Desktop dimensions
  const DESKTOP_WIDTH = 1366;
  const DESKTOP_HEIGHT = 768;

  // Calculate scale for the device frame
  const [frameScale, setFrameScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Calculate scale for the device frame
      if (frameContainerRef.current) {
        const containerWidth = Math.min(window.innerWidth * 0.9, 500);
        const containerHeight = window.innerHeight * 0.6;
        
        let frameW, frameH;
        if (isMobileView) {
          frameW = MOBILE_WIDTH;
          frameH = MOBILE_HEIGHT;
        } else {
          frameW = DESKTOP_WIDTH;
          frameH = DESKTOP_HEIGHT;
        }
        
        const scaleW = containerWidth / frameW;
        const scaleH = containerHeight / frameH;
        const newScale = Math.min(scaleW, scaleH, 1);
        setFrameScale(newScale);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileView]);

  // Categorize templates
  const categorizeTemplate = (template: Template) => {
    if (template.component_name.includes('Wedding') || template.template_type === 'external') return 'wedding';
    if (template.component_name.includes('Corporate')) return 'corporate';
    if (template.component_name.includes('Birthday')) return 'birthday';
    return 'other';
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = categorizeTemplate(template);
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  // Get templates for active category
  const activeTemplates = groupedTemplates[activeCategory] || [];
  const activeTemplate = activeTemplates.length > 0 ? activeTemplates[activeTemplateIndex] : null;

  // Create mock data for template preview
  const createMockEventData = (template: Template) => {
    return {
      id: 'preview-event-id',
      details: {
        // Wedding mock data
        bride_name: "Priya",
        groom_name: "Arjun",
        wedding_date: "July 15, 2025",
        wedding_time: "4:00 PM",
        couple_tagline: "Two hearts, one love, forever together",
        venue_name: "Garden Palace",
        venue_address: "123 Wedding Lane, City, State",
        venue_map_link: "https://maps.google.com/?q=Garden+Palace",
        groom_first: false,
        display_order: "bride",
        
        // Events
        events: [
          { 
            name: "Mehndi Ceremony", 
            date: "June 13, 2024", 
            time: "4:00 PM", 
            venue: "Garden Pavilion",
            map_link: "https://maps.google.com/?q=Garden+Pavilion"
          },
          { 
            name: "Sangeet Night", 
            date: "June 14, 2024", 
            time: "7:00 PM", 
            venue: "Grand Ballroom",
            map_link: "https://maps.google.com/?q=Grand+Ballroom"
          }
        ],
        
        // Family information
        bride_family: {
          title: "Sharma Family",
          members: [
            { name: "Rajesh Sharma", relation: "Father" },
            { name: "Sunita Sharma", relation: "Mother" }
          ]
        },
        groom_family: {
          title: "Kapoor Family", 
          members: [
            { name: "Vikram Kapoor", relation: "Father" },
            { name: "Meera Kapoor", relation: "Mother" }
          ]
        },
        
        // Photos
        photos: [
          { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop", alt: "Couple photo 1" },
          { src: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&h=600&fit=crop", alt: "Couple photo 2" }
        ],
        
        // Contacts
        contacts: [
          { name: "Mr. Rajesh Sharma", phone: "+91 98765 43210" },
          { name: "Mrs. Meera Kapoor", phone: "+91 87654 32109" }
        ]
      },
      template: template
    };
  };

  const mockGuest = {
    id: 'preview-guest-id',
    name: 'Guest Name',
    viewed: false,
    accepted: false
  };

  // Construct the iframe URL
  const iframeUrl = activeTemplate 
    ? constructInvitationUrl(
        getTemplateBaseUrl(activeTemplate), 
        createMockEventData(activeTemplate), 
        mockGuest, 
        { preview: 'true' }
      )
    : '';

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
  };

  return (
    <section id="templates" className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100/20 to-blue-100/20"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200/30 rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-blue-200/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-pink-200/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Premium Templates
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 font-playfair">
            Beautiful Designs for Every{' '}
            <span className="text-luxury-gradient">Occasion</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-poppins">
            Choose from our collection of stunning, interactive templates designed to make your event truly special
          </p>
        </motion.div>

        {/* Template Categories */}
        <div className="mb-12">
          <Tabs 
            defaultValue="wedding" 
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="w-full"
          >
            <div className="flex justify-center">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 p-1 rounded-full">
                <TabsTrigger 
                  value="wedding" 
                  className="rounded-full px-6 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Wedding
                </TabsTrigger>
                <TabsTrigger 
                  value="birthday" 
                  className="rounded-full px-6 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Birthday
                </TabsTrigger>
                <TabsTrigger 
                  value="corporate" 
                  className="rounded-full px-6 py-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Corporate
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.keys(groupedTemplates).map(category => (
              <TabsContent key={category} value={category} className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Template Preview */}
                  <div className="order-2 lg:order-1">
                    <div className="relative">
                      {/* View toggle */}
                      <div className="flex justify-center mb-6">
                        <div className="bg-white backdrop-blur-md rounded-full p-1 flex shadow-md border border-gray-200">
                          <button
                            onClick={() => setIsMobileView(true)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                              isMobileView 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                            <span className="hidden sm:inline">Mobile</span>
                          </button>
                          <button
                            onClick={() => setIsMobileView(false)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                              !isMobileView 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Monitor className="w-4 h-4" />
                            <span className="hidden sm:inline">Desktop</span>
                          </button>
                        </div>
                      </div>

                      {/* Template Swiper */}
                      <Swiper
                        modules={[Pagination, Navigation, Autoplay]}
                        spaceBetween={0}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        navigation={true}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        onSlideChange={(swiper) => setActiveTemplateIndex(swiper.activeIndex)}
                        className="template-swiper pb-10"
                      >
                        {activeTemplates.map((template, index) => (
                          <SwiperSlide key={template.id}>
                            <div className="flex justify-center" ref={frameContainerRef}>
                              {isMobileView ? (
                                <div
                                  className="mobile-frame"
                                  style={{
                                    width: MOBILE_WIDTH,
                                    height: MOBILE_HEIGHT,
                                    background: '#000',
                                    borderRadius: 60,
                                    padding: 5,
                                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s ease-in-out',
                                    transform: `scale(${frameScale})`,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 338,
                                      height: 713,
                                      background: 'white',
                                      borderRadius: 45,
                                      overflow: 'hidden',
                                      position: 'relative',
                                    }}
                                  >
                                    {/* Notch */}
                                    <div
                                      style={{
                                        width: 80,
                                        height: 20,
                                        background: '#333',
                                        borderRadius: 10,
                                        position: 'absolute',
                                        top: 8,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 10,
                                      }}
                                    ></div>
                                    {/* Iframe preview */}
                                    <iframe
                                      src={constructInvitationUrl(
                                        getTemplateBaseUrl(template),
                                        createMockEventData(template),
                                        mockGuest,
                                        { preview: 'true' }
                                      )}
                                      className="w-full h-full"
                                      allow="autoplay; fullscreen; camera; microphone; geolocation"
                                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                      title={`Preview of ${template?.name}`}
                                      style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                      }}
                                      onLoad={handleIframeLoad}
                                      onError={handleIframeError}
                                    />
                                    {/* Loading overlay */}
                                    {!iframeLoaded && !iframeError && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                          <p className="text-xs sm:text-sm text-gray-600">Loading preview...</p>
                                        </div>
                                      </div>
                                    )}
                                    {/* Error overlay */}
                                    {iframeError && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        <div className="text-center px-2">
                                          <p className="text-xs sm:text-sm text-red-600 mb-2">Failed to load preview</p>
                                          <p className="text-[10px] sm:text-xs text-gray-500 mb-3 max-w-[200px] sm:max-w-md">
                                            Please try again in a moment
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="desktop-frame"
                                  style={{
                                    width: DESKTOP_WIDTH * frameScale,
                                    height: DESKTOP_HEIGHT * frameScale,
                                    background: '#fff',
                                    borderRadius: 24,
                                    boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)',
                                    border: '2px solid #e5e7eb',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    justifyContent: 'flex-start',
                                    margin: '0 auto',
                                  }}
                                >
                                  {/* Browser chrome */}
                                  <div style={{
                                    height: 36 * frameScale,
                                    background: 'linear-gradient(90deg, #f3f4f6 60%, #e0e7ff 100%)',
                                    borderTopLeftRadius: 22,
                                    borderTopRightRadius: 22,
                                    borderBottom: '1px solid #e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 18px',
                                    gap: 8,
                                  }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <div style={{ width: 12 * frameScale, height: 12 * frameScale, borderRadius: 6 * frameScale, background: '#ff5f56', border: '1px solid #e5e7eb' }}></div>
                                      <div style={{ width: 12 * frameScale, height: 12 * frameScale, borderRadius: 6 * frameScale, background: '#ffbd2e', border: '1px solid #e5e7eb' }}></div>
                                      <div style={{ width: 12 * frameScale, height: 12 * frameScale, borderRadius: 6 * frameScale, background: '#27c93f', border: '1px solid #e5e7eb' }}></div>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', color: '#b0b3b8', fontSize: 14 * frameScale, fontWeight: 500, letterSpacing: 1 }}>
                                      {/* Simulated address bar */}
                                      <div style={{
                                        background: '#fff',
                                        borderRadius: 8 * frameScale,
                                        height: 20 * frameScale,
                                        width: 340 * frameScale,
                                        margin: '0 auto',
                                        boxShadow: '0 1px 2px #e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12 * frameScale,
                                        color: '#b0b3b8',
                                      }}>
                                        {'Utsavy.com/preview'}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Desktop iframe */}
                                  <div style={{ flex: 1, position: 'relative', width: '100%', height: `${(DESKTOP_HEIGHT - 36) * frameScale}px` }}>
                                    <iframe
                                      src={constructInvitationUrl(
                                        getTemplateBaseUrl(template),
                                        createMockEventData(template),
                                        mockGuest,
                                        { preview: 'true' }
                                      )}
                                      className="w-full h-full"
                                      allow="autoplay; fullscreen; camera; microphone; geolocation"
                                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                      title={`Preview of ${template?.name}`}
                                      style={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        width: '100%',
                                        height: '100%',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                      }}
                                      onLoad={handleIframeLoad}
                                      onError={handleIframeError}
                                    />
                                    {/* Loading overlay */}
                                    {!iframeLoaded && !iframeError && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                          <p className="text-xs sm:text-sm text-gray-600">Loading preview...</p>
                                        </div>
                                      </div>
                                    )}
                                    {/* Error overlay */}
                                    {iframeError && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                          <p className="text-xs sm:text-sm text-red-600 mb-2">Failed to load preview</p>
                                          <p className="text-[10px] sm:text-xs text-gray-500 mb-4 max-w-[200px] sm:max-w-md px-4">
                                            Please try again in a moment
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="order-1 lg:order-2">
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-3xl font-bold text-gray-900 mb-4 font-playfair">
                        {activeTemplate?.name || `${category.charAt(0).toUpperCase() + category.slice(1)} Templates`}
                      </h3>
                      
                      <p className="text-lg text-gray-600 mb-6 font-poppins">
                        {category === 'wedding' 
                          ? 'Create stunning wedding invitations with personalized details, beautiful animations, and RSVP tracking.'
                          : category === 'birthday'
                          ? 'Design fun and interactive birthday invitations that your guests will love and remember.'
                          : 'Craft professional corporate event invitations with all the essential details and tracking.'
                        }
                      </p>
                      
                      <div className="space-y-4 mb-8">
                        {[
                          "Personalized for each guest",
                          "Interactive animations and effects",
                          "Integrated maps and directions",
                          "Detailed event timeline",
                          "Real-time RSVP tracking"
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90"
                          onClick={() => window.location.href = '/auth'}
                        >
                          Create Your Invitation
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/create-event'}>
                          Explore All Templates
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default TemplateShowcase;
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, Smartphone, Monitor } from 'lucide-react';
import { Template } from '@/types';
import { constructInvitationUrl, getTemplateBaseUrl } from '@/utils/iframeMessaging';
import { useIsMobile } from '@/hooks/use-is-mobile';

interface TemplatePreviewProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

export const TemplatePreview = ({ template, isOpen, onClose, onSelect }: TemplatePreviewProps) => {
  const [isMobileView, setIsMobileView] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const isSmallScreen = useIsMobile(640);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  
  // Use a more realistic aspect ratio for modern phones (6.2" ~ 19.5:9)
  const MOBILE_WIDTH = 360;
  const MOBILE_HEIGHT = 740;
  
  // Fixed desktop dimensions for 15-inch laptop
  const DESKTOP_WIDTH = 1366;
  const DESKTOP_HEIGHT = 768;

  // Calculate scale for mobile/desktop
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function handleResize() {
      // Account for dialog padding, header, and footer
      const maxW = window.innerWidth - 32; // reduce dialog padding
      const maxH = window.innerHeight - 120; // reduce reserved space for header/footer/buttons/padding
      
      let frameW, frameH;
      
      if (isMobileView) {
        frameW = MOBILE_WIDTH;
        frameH = MOBILE_HEIGHT;
      } else {
        frameW = DESKTOP_WIDTH;
        frameH = DESKTOP_HEIGHT;
      }
      
      const scaleW = maxW / frameW;
      const scaleH = maxH / frameH;
      const newScale = Math.min(1, scaleW, scaleH);
      setScale(newScale);
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileView, isSmallScreen]);

  // Auto-adjust view based on screen size
  useEffect(() => {
    if (isSmallScreen) {
      setIsMobileView(true);
    }
  }, [isSmallScreen]);

  // Responsive scale for mobile frame based on actual modal body size
  const [frameScale, setFrameScale] = useState(1);
  useEffect(() => {
    function handleResize() {
      if (!modalBodyRef.current) return;
      const parent = modalBodyRef.current;
      const maxW = parent.offsetWidth;
      const maxH = parent.offsetHeight;
      const scaleW = maxW / MOBILE_WIDTH;
      const scaleH = maxH / MOBILE_HEIGHT;
      const newScale = Math.min(1, scaleW, scaleH);
      setFrameScale(newScale);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Also recalculate scale when modal opens or content changes
  useEffect(() => {
    setTimeout(() => {
      if (!modalBodyRef.current) return;
      const parent = modalBodyRef.current;
      const maxW = parent.offsetWidth;
      const maxH = parent.offsetHeight;
      const scaleW = maxW / MOBILE_WIDTH;
      const scaleH = maxH / MOBILE_HEIGHT;
      const newScale = Math.min(1, scaleW, scaleH);
      setFrameScale(newScale);
    }, 100);
  }, [isOpen, isMobileView]);

  // Desktop preview scaling logic
  const [desktopScale, setDesktopScale] = useState(1);
  useEffect(() => {
    function handleResizeDesktop() {
      if (!modalBodyRef.current) return;
      const parent = modalBodyRef.current;
      const maxW = parent.offsetWidth;
      const maxH = parent.offsetHeight;
      const scaleW = maxW / DESKTOP_WIDTH;
      const scaleH = maxH / DESKTOP_HEIGHT;
      const newScale = Math.min(1, scaleW, scaleH);
      setDesktopScale(newScale);
    }
    handleResizeDesktop();
    window.addEventListener('resize', handleResizeDesktop);
    return () => window.removeEventListener('resize', handleResizeDesktop);
  }, []);
  useEffect(() => {
    setTimeout(() => {
      if (!modalBodyRef.current) return;
      const parent = modalBodyRef.current;
      const maxW = parent.offsetWidth;
      const maxH = parent.offsetHeight;
      const scaleW = maxW / DESKTOP_WIDTH;
      const scaleH = maxH / DESKTOP_HEIGHT;
      const newScale = Math.min(1, scaleW, scaleH);
      setDesktopScale(newScale);
    }, 100);
  }, [isOpen, isMobileView]);

  // Construct the preview URL based on template type
  const constructPreviewUrl = (): string => {
    if (!template) return '';
    
    const baseUrl = getTemplateBaseUrl(template);
    
    // Enhanced data mapping for proper template display
    const mockEventData = {
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
    
    const mockGuest = {
      id: 'preview-guest-id',
      name: 'Guest Name'
    };
    
    return constructInvitationUrl(baseUrl, mockEventData, mockGuest, { 
      preview: 'true' 
    });
  };

  const previewUrl = constructPreviewUrl();
  
  const handleIframeLoad = () => {
    console.log('Preview iframe loaded successfully');
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    console.error('Preview iframe failed to load');
    setIframeError(true);
    setIframeLoaded(false);
  };

  // Add mode class for modal body
  const modalModeClass = isMobileView ? 'modal-body mobile-mode' : 'modal-body desktop-mode';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl w-full p-0 flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          maxHeight: 'none',
        }}
      >
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <DialogTitle className="text-base sm:text-lg">
              {template?.name} Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={!isMobileView ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMobileView(false)}
                className="h-8 px-2 sm:px-3"
              >
                <Monitor className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">Desktop</span>
              </Button>
              <Button
                variant={isMobileView ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMobileView(true)}
                className="h-8 px-2 sm:px-3"
              >
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">Mobile</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Responsive iframe container with proper aspect ratios */}
        <div
          ref={modalBodyRef}
          className={modalModeClass}
          style={{
            flexGrow: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            minHeight: 0,
            height: '100%',
            background: 'none',
          }}
        >
          <div
            className="mobile-viewport"
            style={{
              display: isMobileView ? 'flex' : 'none',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
              <div
                ref={frameContainerRef}
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
                  src={previewUrl}
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
                {/* Loading and error overlays remain unchanged */}
                    {!iframeLoaded && !iframeError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-xs sm:text-sm text-gray-600">Loading preview...</p>
                        </div>
                      </div>
                    )}
                    {iframeError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center px-2">
                          <p className="text-xs sm:text-sm text-red-600 mb-2">Failed to load preview</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-3 max-w-[200px] sm:max-w-md">
                            This may be due to the external template not allowing embedding. 
                            Please check the template URL or try opening it in a new tab.
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => {
                                setIframeError(false);
                                setIframeLoaded(false);
                                // Force iframe reload by changing src
                                const iframe = document.querySelector('iframe') as HTMLIFrameElement;
                                if (iframe) {
                                  iframe.src = iframe.src;
                                }
                              }}
                            >
                              Retry
                            </Button>
                            {template?.external_url && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => window.open(template.external_url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open in New Tab
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
              </div>
            </div>
          </div>
          <div
            className="desktop-viewport"
            style={{
              display: isMobileView ? 'none' : 'block',
              width: '100%',
              maxHeight: 'calc(100vh - 200px)',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div
              className="desktop-frame"
              style={{
                width: DESKTOP_WIDTH,
                height: DESKTOP_HEIGHT,
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
                transform: 'none',
              }}
            >
              {/* Browser chrome */}
              <div style={{
                height: 36,
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
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f56', border: '1px solid #e5e7eb' }}></div>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: '#ffbd2e', border: '1px solid #e5e7eb' }}></div>
                  <div style={{ width: 12, height: 12, borderRadius: 6, background: '#27c93f', border: '1px solid #e5e7eb' }}></div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', color: '#b0b3b8', fontSize: 14, fontWeight: 500, letterSpacing: 1 }}>
                  {/* Simulated address bar */}
                  <div style={{
                    background: '#fff',
                    borderRadius: 8,
                    height: 20,
                    width: 340,
                    margin: '0 auto',
                    boxShadow: '0 1px 2px #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#b0b3b8',
                  }}>
                    {'Utsavy.com/preview'}
                  </div>
                </div>
              </div>
              {/* Desktop iframe */}
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                    <iframe
                      src={previewUrl}
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
                {/* Loading and error overlays remain unchanged */}
                  {!iframeLoaded && !iframeError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-xs sm:text-sm text-gray-600">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  {iframeError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-red-600 mb-2">Failed to load preview</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-4 max-w-[200px] sm:max-w-md px-4">
                          This may be due to the external template not allowing embedding. 
                          Please check the template URL or try opening it in a new tab.
                        </p>
                        <div className="flex gap-2 justify-center">
                        <Button 
                          size="sm" 
                            className="h-7 text-xs sm:h-8 sm:text-sm"
                          onClick={() => {
                            setIframeError(false);
                            setIframeLoaded(false);
                            // Force iframe reload by changing src
                            const iframe = document.querySelector('iframe') as HTMLIFrameElement;
                            if (iframe) {
                              iframe.src = iframe.src;
                            }
                          }}
                        >
                          Retry
                        </Button>
                          {template?.external_url && (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs sm:h-8 sm:text-sm"
                              onClick={() => window.open(template.external_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Open in New Tab
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer with action buttons */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-4 flex flex-row justify-between gap-3 bg-white border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs sm:text-sm h-10 sm:h-10 w-full sm:w-[120px]"
          >
            Close
          </Button>
          <Button
            onClick={() => onSelect(template!)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm h-10 sm:h-10 w-full sm:w-auto sm:min-w-[220px] rounded-xl transition-all duration-200 font-bold"
            style={{ boxShadow: '0 2px 16px 0 rgba(80,0,120,0.10)' }}
          >
            Select This Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { ArrowRight, Calendar, Star, Award, Users, Check, Sparkles, ChevronDown, Heart, Clock, Shield, Smartphone, Monitor, MapPin } from 'lucide-react';
import { Template } from '@/types';
import { constructInvitationUrl, getTemplateBaseUrl } from '@/utils/iframeMessaging';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

interface HeroProps {
  templates: Template[];
}

const Hero = ({ templates }: HeroProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
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
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

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

  const handleGetStarted = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setTimeout(() => {
      window.location.href = '/auth';
    }, 500);
  };

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

  // Get the active template
  const activeTemplate = templates.length > 0 ? templates[activeTemplateIndex] : null;

  // Construct the iframe URL
  const iframeUrl = activeTemplate 
    ? constructInvitationUrl(
        getTemplateBaseUrl(activeTemplate), 
        createMockEventData(activeTemplate), 
        mockGuest, 
        { preview: 'true', isHeroPreview: 'true' }
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

  const stats = [
    { value: '50,000+', label: 'Events Created' },
    { value: '2M+', label: 'Guests Invited' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Customer Support' }
  ];

  const features = [
    { icon: <Users className="w-5 h-5 text-gold-500" />, text: "Guest Personalization", color: "from-gold-500/20 to-amber-500/20" },
    { icon: <Sparkles className="w-5 h-5 text-teal-500" />, text: "Interactive Animations", color: "from-teal-500/20 to-emerald-500/20" },
    { icon: <MapPin className="w-5 h-5 text-purple-500" />, text: "Venue Map Integration", color: "from-purple-500/20 to-indigo-500/20" },
    { icon: <Calendar className="w-5 h-5 text-rose-500" />, text: "Structured Event Timeline", color: "from-rose-500/20 to-pink-500/20" },
    { icon: <Heart className="w-5 h-5 text-red-500" />, text: "Wishing Wall", color: "from-red-500/20 to-orange-500/20" },
    { icon: <Clock className="w-5 h-5 text-blue-500" />, text: "Real-time Tracking", color: "from-blue-500/20 to-sky-500/20" },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center bg-royal-gradient overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-indigo-900/70 to-purple-800/70 animate-gradient-shift bg-300%"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-gradient-to-br from-gold-500/15 to-amber-500/15 blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/4 right-20 w-80 h-80 rounded-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 to-indigo-500/10 blur-3xl animate-float" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Particle effects */}
        <div className="particles absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="particle absolute rounded-full"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                background: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={150}
          colors={['#FF6B6B', '#FFD700', '#2ECC71', '#F39C12', '#FFB3BA']}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left relative lg:w-1/2 w-full"
        >
          {/* Decorative elements */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-gold-500/10 to-amber-500/10 rounded-full blur-2xl hidden lg:block"></div>
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-full blur-2xl hidden lg:block"></div>
          
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-glass text-white px-5 py-2 rounded-full text-sm font-medium mb-8 shadow-lg border border-gold-500/30"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold">Premium Templates Available Now</span>
          </motion.div>

          {/* Main Heading with enhanced styling */}
          <div className="relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
              className="absolute -bottom-3 left-0 h-1 bg-gradient-to-r from-gold-500 to-amber-500 rounded-full hidden lg:block"
            ></motion.div>

            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 font-playfair leading-tight tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-white">Create </span>
              <span className="text-gold-gradient">Magical</span>
              <span className="text-white"> Event Experiences</span>
            </motion.h1>
          </div>
          
          <motion.p 
            className="text-xl lg:text-2xl text-white/90 mb-10 max-w-2xl font-poppins leading-relaxed lg:mx-0 mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Craft stunning invitations that captivate your guests and create unforgettable memories. Premium designs with powerful features.
          </motion.p>

          {/* Feature Highlights with enhanced styling */}
          <motion.div 
            className="grid sm:grid-cols-2 gap-4 mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 2 }
              }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true, dynamicBullets: true }}
              className="feature-swiper pb-10 w-full"
            >
              {features.map((feature, index) => (
                <SwiperSlide key={index}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center gap-4 px-5 py-4 rounded-xl text-white/90 text-sm border border-white/10 shadow-lg hover:border-white/30 transition-all duration-300 bg-gradient-to-br ${feature.color} h-full`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>

          {/* CTA Buttons with enhanced styling */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500 to-amber-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-gold-500 to-amber-500 text-white border-0 text-lg px-8 py-7 flex items-center gap-2 shadow-xl rounded-xl"
                onClick={handleGetStarted}
                style={{ filter: 'none' }} // Fix for mobile blur
              >
                Create Your Event <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/5 text-white border-white/20 hover:bg-white/10 hover:text-white px-8 py-7 text-lg font-medium backdrop-blur-sm shadow-xl rounded-xl"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Features
              </Button>
            </motion.div>
          </motion.div>

          {/* Social Proof with enhanced styling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 text-white/80"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: [
                        'linear-gradient(to bottom right, #F59E0B, #D97706)',
                        'linear-gradient(to bottom right, #10B981, #059669)',
                        'linear-gradient(to bottom right, #8B5CF6, #7C3AED)',
                        'linear-gradient(to bottom right, #EC4899, #DB2777)',
                        'linear-gradient(to bottom right, #3B82F6, #2563EB)'
                      ][i-1]
                    }}
                  >
                    {['AK', 'SM', 'JD', 'RB', 'TM'][i-1]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                <p className="font-medium text-sm">
                  <span className="font-bold text-gold-500">50,000+</span> event creators trust us
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - Template Showcase */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative lg:w-1/2 w-full"
        >
          <div className="relative">
            {/* Template Tabs */}
            <div className="flex justify-center mb-6">
              <div className="bg-glass-dark backdrop-blur-md rounded-full p-1 flex shadow-xl border border-white/10">
                <button
                  onClick={() => setIsMobileView(true)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isMobileView 
                      ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-white shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Mobile View</span>
                </button>
                <button
                  onClick={() => setIsMobileView(false)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    !isMobileView 
                      ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-white shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Desktop View</span>
                </button>
              </div>
            </div>

            {/* Template Preview */}
            <div className="relative">
              <Swiper
                modules={[Pagination, Navigation, Autoplay, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                pagination={{ clickable: true }}
                navigation={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                onSlideChange={(swiper) => setActiveTemplateIndex(swiper.activeIndex)}
                className="hero-swiper"
              >
                {templates.slice(0, 5).map((template, index) => (
                  <SwiperSlide key={template.id}>
                    <AnimatePresence mode="wait">
                      {isMobileView ? (
                        <motion.div
                          key="mobile-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="flex justify-center"
                          ref={frameContainerRef}
                        >
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
                              {template && (
                                <iframe
                                  src={constructInvitationUrl(
                                    getTemplateBaseUrl(template),
                                    createMockEventData(template),
                                    mockGuest,
                                    { preview: 'true', isHeroPreview: 'true' }
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
                              )}
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
                        </motion.div>
                      ) : (
                        <motion.div
                          key="desktop-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="flex justify-center"
                        >
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
                              {template && (
                                <iframe
                                  src={constructInvitationUrl(
                                    getTemplateBaseUrl(template),
                                    createMockEventData(template),
                                    mockGuest,
                                    { preview: 'true', isHeroPreview: 'true' }
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
                              )}
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </motion.div>

        {/* Stats Section - Desktop */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="w-full max-w-5xl mx-auto absolute bottom-8 left-1/2 transform -translate-x-1/2 px-4 sm:px-0 hidden md:block"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-10">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                className="bg-glass rounded-2xl p-4 md:p-6 text-center border border-white/10 shadow-lg hover:border-gold-500/30 hover:bg-white/10 transition-all duration-300"
              >
                <p className="text-xl md:text-2xl lg:text-4xl font-bold text-gold-500 mb-1 font-playfair">{stat.value}</p>
                <p className="text-white/70 text-xs md:text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Mobile Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="w-full mx-auto px-4 mt-12 md:hidden"
        >
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                className="bg-glass rounded-2xl p-4 text-center border border-white/10 shadow-lg hover:border-gold-500/30 hover:bg-white/10 transition-all duration-300"
              >
                <p className="text-xl font-bold text-gold-500 mb-1 font-playfair">{stat.value}</p>
                <p className="text-white/70 text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
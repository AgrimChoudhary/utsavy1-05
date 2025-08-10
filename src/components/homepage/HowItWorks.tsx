import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Palette, Wand2, Share2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      number: "01",
      title: "Choose Your Perfect Template",
      description: "Browse our curated collection of premium animated designs crafted for every celebration imaginable.",
      icon: <Palette className="w-8 h-8 text-white" />,
      time: "30 seconds",
      metric: "500+ Templates"
    },
    {
      number: "02", 
      title: "Customize & Personalize",
      description: "Make it yours with drag-and-drop customization, personal touches, and unique guest experiences.",
      icon: <Wand2 className="w-8 h-8 text-white" />,
      time: "2 minutes",
      metric: "Unlimited Edits"
    },
    {
      number: "03",
      title: "Share & Celebrate",
      description: "Send magical invitations, track responses in real-time, and watch your celebration come to life.",
      icon: <Share2 className="w-8 h-8 text-white" />,
      time: "Instant",
      metric: "100% Delivery"
    }
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.3 }
    );

    const timelineElements = document.querySelectorAll('.timeline-step');
    timelineElements.forEach((el) => observer.observe(el));

    return () => {
      timelineElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 lg:py-32 bg-deep-slate relative overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-premium-gold rounded-full animate-rotate-slow"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-luxury-pink rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-emerald-luxury rounded-full animate-float"></div>
        <div className="absolute top-10 right-10 w-16 h-16 bg-electric-blue/10 rounded-full animate-bounce-subtle"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16 lg:mb-24"
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
            className="inline-flex items-center gap-2 bg-glass text-white px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <motion.span 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ⚡
            </motion.span>
            Simple 3-Step Process
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 font-playfair">
            From Idea to{' '}
            <span className="text-electric-gradient">Celebration</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto font-poppins leading-relaxed">
            Creating unforgettable events has never been easier. Join thousands who've transformed their celebrations.
          </p>
        </motion.div>

        {/* Interactive Timeline with Swiper */}
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
          }}
          pagination={{ clickable: true }}
          navigation={true}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          className="pb-12"
        >
          {steps.map((step, index) => (
            <SwiperSlide key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="timeline-step text-center relative group h-full"
              >
                {/* Step Card */}
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    y: -10
                  }}
                  transition={{ duration: 0.3 }}
                  className="glass-card p-8 lg:p-10 relative overflow-hidden h-full"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Step Number Badge */}
                  <motion.div 
                    className="relative inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-luxury-purple to-luxury-pink rounded-2xl text-white font-bold text-xl lg:text-2xl mb-6 shadow-2xl"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.icon}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-premium-gold rounded-full flex items-center justify-center text-deep-slate text-sm font-bold shadow-lg">
                      {step.number}
                    </div>
                  </motion.div>

                  {/* Time Badge */}
                  <div className="inline-flex items-center gap-2 bg-emerald-luxury/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    {step.time}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 font-playfair">
                    {step.title}
                  </h3>
                  
                  <p className="text-white/70 group-hover:text-white/90 mb-6 font-poppins leading-relaxed transition-colors duration-300">
                    {step.description}
                  </p>

                  {/* Metric Badge */}
                  <div className="inline-flex items-center gap-2 bg-glass px-4 py-2 rounded-lg text-premium-gold text-sm font-semibold">
                    <span>📊</span>
                    {step.metric}
                  </div>

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </motion.div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Enhanced CTA Section */}
        <motion.div 
          className="text-center mt-16 lg:mt-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="glass-card inline-block p-8 lg:p-12 max-w-2xl mx-auto"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 font-playfair">
              Ready to Create Magic?
            </h3>
            <p className="text-white/70 mb-8 font-poppins">
              Join 50,000+ event creators who've made their celebrations unforgettable
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold-500 to-amber-500 text-white hover:opacity-90 font-bold px-8 py-6 text-lg rounded-full flex items-center gap-2"
                onClick={() => window.location.href = '/auth'}
              >
                Start Your Journey
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Free to start
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                5-min setup
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
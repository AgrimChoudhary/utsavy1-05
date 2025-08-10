import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  MapPin, 
  Sparkles, 
  Calendar, 
  Check, 
  User, 
  Edit, 
  LayoutDashboard, 
  Image, 
  MessageSquare 
} from "lucide-react";
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Features = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      icon: User,
      title: "Guest Name Personalization",
      description: "Make each guest feel special with invites tailored to their name and preferences. Each invitation is uniquely crafted.",
      color: "text-emerald-luxury",
      bgGradient: "from-emerald-400 to-teal-500",
      delay: 0.1
    },
    {
      icon: Sparkles,
      title: "Interactive Animations",
      description: "Engage guests with stunning animations, interactive elements, countdown timers, and delightful micro-interactions.",
      color: "text-premium-gold",
      bgGradient: "from-amber-400 to-orange-500",
      delay: 0.2
    },
    {
      icon: MapPin,
      title: "Venue Map Integration",
      description: "Guide guests effortlessly with integrated Google Maps, live directions, and real-time traffic updates.",
      color: "text-electric-blue", 
      bgGradient: "from-blue-500 to-cyan-400",
      delay: 0.3
    },
    {
      icon: Calendar,
      title: "Structured Event Timeline",
      description: "Share detailed schedules, sub-events, and important information in a beautifully organized format.",
      color: "text-luxury-purple",
      bgGradient: "from-purple-500 to-pink-500",
      delay: 0.4
    },
    {
      icon: MessageSquare,
      title: "Wishing Wall",
      description: "Allow guests to leave heartfelt messages and well wishes directly on your invitation, creating a digital guestbook.",
      color: "text-emerald-luxury",
      bgGradient: "from-green-500 to-emerald-500",
      delay: 0.5
    },
    {
      icon: Check,
      title: "Real-time Guest Tracking",
      description: "Monitor invitation views, RSVPs, and guest engagement in real-time with detailed analytics and beautiful insights.",
      color: "text-electric-blue",
      bgGradient: "from-blue-500 to-indigo-500",
      delay: 0.6
    },
    {
      icon: Edit,
      title: "Real-time Editing",
      description: "Update event details and guest information instantly, with changes reflecting across all invitations in real-time.",
      color: "text-luxury-pink",
      bgGradient: "from-pink-500 to-rose-500",
      delay: 0.7
    },
    {
      icon: LayoutDashboard,
      title: "Guest Management Dashboard",
      description: "Effortlessly manage your guest list, track RSVPs, and send reminders from a centralized, intuitive dashboard.",
      color: "text-sunset-orange",
      bgGradient: "from-orange-500 to-red-500",
      delay: 0.8
    },
    {
      icon: Image,
      title: "Photo Galleries",
      description: "Showcase your beautiful journey with dedicated photo galleries embedded directly within your invitation.",
      color: "text-luxury-purple",
      bgGradient: "from-violet-500 to-purple-500",
      delay: 0.9
    }
  ];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const animateElements = document.querySelectorAll('.scroll-animate');
    animateElements.forEach((el) => observer.observe(el));

    return () => {
      animateElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-20 lg:py-32 bg-dark-luxury relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16 lg:mb-24 scroll-animate"
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
            className="inline-flex items-center gap-2 bg-glass-dark px-4 py-2 rounded-full text-sm font-medium text-white/80 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Everything You Need
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 font-playfair">
            Features That Make Events{' '}
            <span className="text-luxury-gradient">Unforgettable</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto font-poppins leading-relaxed">
            Powerful tools designed to transform your celebrations into extraordinary experiences that guests will cherish forever
          </p>
        </motion.div>
        
        {/* Features Swiper */}
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
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          className="feature-swiper pb-12"
        >
          {features.map((feature, index) => (
            <SwiperSlide key={index}>
              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group scroll-animate h-full"
                style={{ animationDelay: `${feature.delay}s` }}
              >
                <Card className="feature-card h-full bg-glass-dark border-white/10 hover:border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    {/* Animated Icon Container */}
                    <motion.div 
                      className={`relative w-16 h-16 bg-gradient-to-br ${feature.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                    </motion.div>

                    {/* Feature Content */}
                    <h3 className="text-lg lg:text-xl font-bold text-white mb-3 font-playfair group-hover:text-luxury-gradient transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-white/70 group-hover:text-white/90 flex-grow font-poppins text-sm leading-relaxed transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </CardContent>
                </Card>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16 lg:mt-24 scroll-animate"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <a href="/auth" className="bg-gradient-to-r from-premium-gold to-amber-500 text-white hover:opacity-90 font-bold px-8 py-4 text-lg rounded-full flex items-center gap-2 shadow-xl">
              <span className="relative z-10">Start Creating Magic ✨</span>
            </a>
          </motion.div>

          <p className="text-white/60 text-sm mt-4 font-poppins">
            Join 50,000+ event creators • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
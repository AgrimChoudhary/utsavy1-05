import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { ArrowRight, Check, Star } from 'lucide-react';

const CTASection = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleGetStarted = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setTimeout(() => {
      window.location.href = '/auth';
    }, 500);
  };

  const features = [
    "Guest name personalization",
    "Interactive animations",
    "Venue map integration",
    "Structured event timeline",
    "Wishing wall for guests",
    "Real-time guest tracking",
    "Photo galleries"
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-premium-gold/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-8 h-8 bg-emerald-luxury/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={150}
          colors={['#FF6B6B', '#FFD700', '#2ECC71', '#F39C12', '#FFB3BA']}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-playfair"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              Ready to Make Your Event Unforgettable?
            </motion.h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl font-poppins">
              Join thousands of event organizers who trust UTSAVY to create magical moments. 
              Start your celebration journey today!
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-premium-gold/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-premium-gold" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-premium-gold to-amber-500 text-white hover:opacity-90 font-bold px-8 py-6 text-xl rounded-full flex items-center gap-2"
                onClick={handleGetStarted}
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.p 
              className="text-white/70 text-sm mt-4 font-poppins"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              No credit card required • Create your first event in minutes
            </motion.p>
          </motion.div>

          {/* Right Content - Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-premium-gold/10 rounded-full"></div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  AK
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Ananya & Karan</h4>
                  <p className="text-white/70">Wedding, June 2024</p>
                </div>
              </div>
              
              <blockquote className="text-white/90 text-lg italic mb-6">
                "UTSAVY transformed our wedding invitations into an experience our guests are still talking about. The personalization and interactive elements made everyone feel special!"
              </blockquote>
              
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-premium-gold text-premium-gold" />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/80 text-sm">Guests Invited</p>
                  <p className="text-white font-bold text-xl">350+</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/80 text-sm">RSVP Rate</p>
                  <p className="text-white font-bold text-xl">98%</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile Testimonial Card (visible only on mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative lg:hidden"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  AK
                </div>
                <div>
                  <h4 className="text-white font-bold">Ananya & Karan</h4>
                  <p className="text-white/70 text-sm">Wedding, June 2024</p>
                </div>
              </div>
              
              <blockquote className="text-white/90 text-base italic mb-4">
                "UTSAVY transformed our wedding invitations into an experience our guests are still talking about!"
              </blockquote>
              
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-premium-gold text-premium-gold" />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-white/80 text-xs">Guests</p>
                  <p className="text-white font-bold">350+</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-white/80 text-xs">RSVP Rate</p>
                  <p className="text-white font-bold">98%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
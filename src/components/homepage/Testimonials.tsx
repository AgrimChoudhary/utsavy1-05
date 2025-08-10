import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const testimonials = [
    {
      quote: "UTSAVY made our wedding invitations absolutely magical! Every guest felt so special receiving their personalized invite. The interactive elements and real-time tracking were game-changers.",
      name: "Priya & Arjun",
      event: "Wedding Celebration",
      avatar: "PA",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
    },
    {
      quote: "The interactive features and real-time tracking made planning my daughter's birthday party so much easier. The wishing wall was a hit with all our guests!",
      name: "Meera Sharma",
      event: "Birthday Party",
      avatar: "MS",
      image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=936&q=80"
    },
    {
      quote: "Our corporate event invitations looked incredibly professional. The venue mapping feature was a game-changer for our guests, and the analytics helped us plan better.",
      name: "Rajesh Kumar",
      event: "Corporate Event",
      avatar: "RK",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
    },
    {
      quote: "I love how each guest gets a unique experience. The animations and personalized touches made our anniversary unforgettable! The photo gallery feature was perfect for sharing our journey.",
      name: "Sneha & Vikram",
      event: "Anniversary",
      avatar: "SV",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
    }
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-purple-100/20 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 font-playfair">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 font-poppins">
            Join thousands of happy event organizers who trust UTSAVY
          </p>
        </motion.div>

        {/* Featured Testimonial Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <Card className="bg-white rounded-2xl shadow-xl p-6 md:p-8 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Quote className="h-4 w-4 text-white" />
            </div>
            
            <CardContent className="pt-4 px-0">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] shadow-lg">
                    <img 
                      src={testimonials[activeIndex].image} 
                      alt={testimonials[activeIndex].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 text-left">
                  <blockquote className="text-xl md:text-2xl text-gray-700 font-playfair italic mb-6 leading-relaxed">
                    "{testimonials[activeIndex].quote}"
                  </blockquote>

                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border-2 border-purple-100">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        {testimonials[activeIndex].avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-slate-900 font-poppins">
                        {testimonials[activeIndex].name}
                      </div>
                      <div className="text-gray-500 text-sm font-poppins">
                        {testimonials[activeIndex].event}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Controls */}
              <div className="flex justify-center mt-8 gap-2">
                <Button 
                  onClick={prevTestimonial} 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full border-gray-200 hover:bg-purple-50 hover:border-purple-200"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </Button>
                <div className="flex items-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        index === activeIndex 
                          ? "bg-purple-600 scale-125" 
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
                <Button 
                  onClick={nextTestimonial} 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full border-gray-200 hover:bg-purple-50 hover:border-purple-200"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Testimonial Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100/50"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-600">98%</p>
              <p className="text-gray-600 text-sm">Satisfaction Rate</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-600">50K+</p>
              <p className="text-gray-600 text-sm">Active Users</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-600">2M+</p>
              <p className="text-gray-600 text-sm">Invitations Sent</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-600">4.9/5</p>
              <p className="text-gray-600 text-sm">Average Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
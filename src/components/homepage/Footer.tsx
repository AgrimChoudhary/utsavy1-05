import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from '@/components/ui/Logo';
import { motion } from 'framer-motion';
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Heart, 
  ArrowRight, 
  Mail 
} from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter signup
    console.log('Newsletter signup:', email);
    setEmail('');
    alert('Thanks for subscribing to our newsletter!');
  };

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Templates', href: '#templates' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Analytics', href: '#analytics' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Contact', href: '#contact' },
      { name: 'Blog', href: '#blog' },
      { name: 'Careers', href: '#careers' }
    ],
    support: [
      { name: 'Help Center', href: '#help' },
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Cookie Policy', href: '#cookies' }
    ]
  };

  const socialLinks = [
    { name: 'Instagram', href: '#', icon: <Instagram className="w-5 h-5" /> },
    { name: 'Twitter', href: '#', icon: <Twitter className="w-5 h-5" /> },
    { name: 'LinkedIn', href: '#', icon: <Linkedin className="w-5 h-5" /> },
    { name: 'Facebook', href: '#', icon: <Facebook className="w-5 h-5" /> }
  ];

  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Logo className="mb-4" />
            <p className="text-white/80 mb-6 font-poppins">
              Celebrate Smarter, Connect Deeper. Create unforgettable events with personalized invitations.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-premium-gold transition-colors duration-200"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 lg:col-span-2 gap-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-bold text-lg mb-4 font-poppins">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-white/70 hover:text-premium-gold transition-colors duration-200 font-poppins flex items-center gap-1 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 font-poppins">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-white/70 hover:text-premium-gold transition-colors duration-200 font-poppins flex items-center gap-1 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 font-poppins">Support</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-white/70 hover:text-premium-gold transition-colors duration-200 font-poppins flex items-center gap-1 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-3 h-3" />
                      </span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Newsletter Section */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="font-bold text-lg mb-4 font-poppins">Stay Updated</h3>
            <p className="text-white/70 mb-4 font-poppins text-sm">
              Get the latest updates on new templates and features.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white pl-10 placeholder:text-white/50"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-premium-gold to-amber-500 hover:opacity-90 text-white font-semibold"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div 
          className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-white/60 text-sm font-poppins mb-4 sm:mb-0">
            © 2024 UTSAVY. All rights reserved. Making events memorable.
          </p>
          <div className="flex items-center space-x-2 text-sm text-white/60">
            <span className="font-poppins">Made with</span>
            <motion.span 
              className="text-red-400 text-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="h-4 w-4 fill-current" />
            </motion.span>
            <span className="font-poppins">for celebrations</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
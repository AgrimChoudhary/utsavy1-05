import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Search, Bell, User, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { 
      name: 'Home', 
      href: '/' 
    },
    { 
      name: 'Templates', 
      href: '#templates',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Wedding', href: '#wedding' },
        { name: 'Birthday', href: '#birthday' },
        { name: 'Corporate', href: '#corporate' },
        { name: 'Festival', href: '#festival' },
      ]
    },
    { 
      name: 'Features', 
      href: '#features',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Guest Personalization', href: '#guest-personalization' },
        { name: 'Interactive Animations', href: '#interactive-animations' },
        { name: 'Venue Map Integration', href: '#venue-map' },
        { name: 'Wishing Wall', href: '#wishing-wall' },
        { name: 'Real-time Tracking', href: '#tracking' },
      ]
    },
    { 
      name: 'How It Works', 
      href: '#how-it-works' 
    },
  ];

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-900/90 backdrop-blur-xl shadow-lg border-b border-white/10' 
          : 'bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-transparent border-b border-white/5'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Logo className={isScrolled ? 'text-white' : 'text-white'} />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                {item.hasDropdown ? (
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className="flex items-center px-4 py-2 text-white hover:text-premium-gold transition-colors duration-300 font-medium group"
                  >
                    <span>{item.name}</span>
                    <motion.div
                      animate={{ rotate: activeDropdown === item.name ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-1"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-premium-gold to-luxury-pink group-hover:w-full transition-all duration-300"></span>
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className="relative px-4 py-2 text-white hover:text-premium-gold transition-colors duration-300 font-medium group"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-premium-gold to-luxury-pink group-hover:w-full transition-all duration-300"></span>
                  </a>
                )}

                {/* Dropdown Menu */}
                {item.hasDropdown && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-glass-dark backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
                      >
                        <div className="py-2">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <a
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="block px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200 text-sm"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {dropdownItem.name}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button 
                    className="bg-gradient-to-r from-premium-gold to-sunset-orange text-white hover:opacity-90 font-semibold flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      className="bg-white text-slate-900 hover:bg-white/90 px-5 py-2 h-10 font-medium shadow-md"
                    >
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/auth">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      className="bg-gradient-to-r from-premium-gold to-sunset-orange text-white hover:shadow-lg hover:shadow-premium-gold/20 font-semibold px-5 py-2 h-10 flex items-center gap-2"
                    >
                      Get Started
                      <Star className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden text-white p-2 rounded-full bg-white/10 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-glass-dark backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {navItems.map((item) => (
                <div key={item.name} className="space-y-2">
                  {item.hasDropdown ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        className="flex items-center justify-between w-full text-white hover:text-premium-gold transition-colors duration-200 font-medium"
                      >
                        <span>{item.name}</span>
                        <motion.div
                          animate={{ rotate: activeDropdown === item.name ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === item.name && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-2 ml-4 space-y-2 border-l border-white/20 pl-4"
                          >
                            {item.dropdownItems?.map((dropdownItem) => (
                              <a
                                key={dropdownItem.name}
                                href={dropdownItem.href}
                                className="block text-white/80 hover:text-premium-gold transition-colors duration-200 py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {dropdownItem.name}
                              </a>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className="block text-white hover:text-premium-gold transition-colors duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  )}
                </div>
              ))}
              
              <div className="pt-4 border-t border-white/10">
                {user ? (
                  <Link to="/dashboard">
                    <Button 
                      className="w-full bg-gradient-to-r from-premium-gold to-sunset-orange text-white hover:opacity-90 font-semibold flex items-center justify-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link to="/auth" className="block">
                      <Button 
                        className="w-full bg-white text-slate-900 hover:bg-white/90 font-medium shadow-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth" className="block">
                      <Button 
                        className="w-full bg-gradient-to-r from-premium-gold to-sunset-orange text-white hover:opacity-90 font-semibold flex items-center justify-center gap-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                        <Star className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
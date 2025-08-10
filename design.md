
# UTSAVY Complete Platform Design System

## Overview
This document defines the complete design system for the UTSAVY event invitation platform. All components, pages, and features should follow these design principles and implementation guidelines.

## Completed Implementation Status
- ✅ Homepage with luxury design and animations
- ✅ Authentication system with mobile/email support
- ✅ Dashboard and event management
- ✅ Invitation templates and customization
- ✅ Analytics and tracking
- ✅ Mobile-first responsive design
- ✅ Modern UI with Gen Z appeal

## Design System Colors & Brand Identity

### Primary Color Palette
```css
/* Luxury Gradients */
--luxury-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--luxury-gradient-dark: linear-gradient(135deg, #2D1B69 0%, #11998e 100%);
--premium-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--electric-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Brand Colors */
--premium-gold: #FFD700;
--luxury-purple: #8B5CF6;
--luxury-pink: #EC4899;
--emerald-luxury: #10B981;
--electric-blue: #06B6D4;
--sunset-orange: #F59E0B;
--deep-slate: #0F172A;
--glass-dark: rgba(15, 23, 42, 0.8);
```

### Typography System
- **Primary Font**: Playfair Display (headings)
- **Secondary Font**: Poppins (body text)
- **Weight Hierarchy**: 300, 400, 600, 700, 800

### Component Design Principles

#### Glass Morphism Design
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

.glass-dark {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### Button Styles
```css
.btn-luxury {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.btn-luxury:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}
```

#### Animation Guidelines
```css
/* Floating Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Gradient Animation */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
}
```

## Platform Architecture

### Page Structure
1. **Homepage** (`/`) - Landing page with hero, features, testimonials
2. **Authentication** (`/auth`) - Login/signup with mobile support
3. **Dashboard** (`/dashboard`) - Main user dashboard
4. **Create Event** (`/create-event`) - Event creation wizard
5. **Event Management** (`/event/:eventId`) - Event editing and management
6. **Analytics** (`/analytics`) - Event analytics and insights
7. **Invitation Pages** (`/invitation/:eventId/:guestId`) - Guest invitation views

### Component Organization
```
src/
├── components/
│   ├── homepage/          # Landing page components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── events/           # Event management components
│   ├── invitations/      # Invitation templates
│   ├── analytics/        # Analytics components
│   └── ui/               # Reusable UI components
```

## Responsive Design Standards

### Breakpoints
- Mobile: 0-767px
- Tablet: 768-1023px
- Desktop: 1024px+

### Mobile-First Approach
- All components designed mobile-first
- Touch-friendly interaction areas (min 44px)
- Optimized font scaling
- Proper spacing and hierarchy

## Animation & Interaction Standards

### Micro-Interactions
- Hover effects on all interactive elements
- Smooth transitions (300ms ease)
- Loading states with elegant spinners
- Success/error feedback with toasts

### Page Transitions
- Smooth fade-in animations
- Staggered content loading
- Intersection Observer for scroll animations
- Parallax effects where appropriate

## Accessibility Standards
- WCAG 2.1 AA compliance
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators

## Performance Standards
- Lazy loading for images and heavy components
- Optimized animations with transform/opacity
- Efficient re-renders with React best practices
- Code splitting for route-based chunks

## Future Enhancement Areas
- Dark/light theme toggle
- Advanced animation library integration
- Progressive Web App features
- Advanced accessibility features
- Internationalization support

## Implementation Notes
- Use Framer Motion for complex animations
- Implement Intersection Observer for scroll effects
- Maintain consistent spacing using Tailwind CSS
- Follow TypeScript best practices
- Ensure cross-browser compatibility

This design system should be used as the foundation for all current and future platform development.

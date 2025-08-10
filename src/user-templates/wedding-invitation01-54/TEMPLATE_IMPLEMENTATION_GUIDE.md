
# Wedding Invitation Template - Implementation Guide

## Overview
This is a React-based wedding invitation template built with modern web technologies. The template is designed with a centralized placeholder system that makes it easy for platforms to generate personalized invitations by simply replacing placeholder values.

## Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: Tanstack React Query
- **Icons**: Lucide React
- **Audio**: HTML5 Audio API

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AudioPlayer.tsx # Background music player
│   ├── Countdown.tsx   # Wedding countdown timer
│   ├── EventCard.tsx   # Event display cards
│   ├── PhotoCarousel.tsx # Image gallery
│   └── ...
├── pages/              # Main application pages
│   ├── Welcome.tsx     # Landing/welcome page
│   ├── Index.tsx       # Main invitation page
│   └── NotFound.tsx    # 404 error page
├── constants/          # Configuration and placeholders
│   ├── placeholders.ts # Main placeholder configuration
│   └── familyPhotos.ts # Family photo constants
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── lib/                # Shared libraries
```

## Placeholder System

### Core Concept
All customizable content is centralized in `src/constants/placeholders.ts`. This file contains all the data that platforms need to replace to generate personalized invitations.

### Placeholder Categories

#### 1. Couple Information
```typescript
export const BRIDE_NAME = "Bride Name";
export const GROOM_NAME = "Groom Name"; 
export const WEDDING_DATE = "30 June 2025";
export const WEDDING_TIME = "5:00 PM - 8:00 PM";
export const COUPLE_TAGLINE = "Two hearts, one soul, forever together";
```

#### 2. Guest Information
```typescript
export const GUEST_NAME = "Guest Name";
```

#### 3. Name Ordering Configuration
```typescript
export const ORDER_CONFIG = {
  GROOM_FIRST: true, // Set to false to put bride first
};
```

#### 4. Events Array
```typescript
export const EVENTS = [
  {
    EVENT_NAME: "Mehndi Ceremony",
    EVENT_DATE: "28 June 2025",
    EVENT_TIME: "4:00 PM - 8:00 PM", 
    EVENT_VENUE: "Venue Name, Address",
    EVENT_VENUE_MAP_LINK: "https://maps.google.com/"
  },
  // Additional events...
];
```

#### 5. Family Information
```typescript
export const BRIDE_FAMILY = {
  FAMILY_SIDE: "bride",
  FAMILY_TITLE: "Sharma Family",
  FAMILY_DESCRIPTION: "A loving family...",
  FAMILY_ADDRESS: "123 Heritage Lane...",
  FAMILY_MEMBERS: [
    {
      MEMBER_NAME: "Sunita Sharma",
      MEMBER_RELATION: "Mother of the Bride",
      MEMBER_DESCRIPTION: "A caring mother...",
      MEMBER_PHOTO: "/path/to/photo.jpg"
    },
    // Additional family members...
  ]
};
```

#### 6. Photos and Media
```typescript
export const PHOTOS = [
  { PHOTO_1: "/lovable-uploads/photo1.png" },
  { PHOTO_2: "/lovable-uploads/photo2.png" },
  // Additional photos...
];
```

#### 7. Contact Information
```typescript
export const CONTACTS = [
  {
    CONTACT_NAME: "Contact Person 1",
    CONTACT_NUMBER: "+1234567890"
  },
  // Additional contacts...
];
```

## Implementation Guide for Platforms

### Step 1: Parse the Template
1. Read `src/constants/placeholders.ts`
2. Extract all exported constants
3. Identify data types and structures
4. Generate form fields based on the placeholder structure

### Step 2: Create User Interface
Generate forms for users to input:
- Couple names and wedding details
- Guest information
- Event details (multiple events supported)
- Family member information
- Photo uploads
- Contact details

### Step 3: Data Validation
Implement validation for:
- Required fields (names, dates, venues)
- Date formats
- Phone number formats
- Image file types and sizes
- URL formats for map links

### Step 4: Asset Management
Handle user uploads for:
- Couple photos
- Family member photos
- Additional gallery images
- Audio files (wedding songs)

### Step 5: Template Generation
1. Replace placeholder values with user data
2. Update image paths to point to uploaded assets
3. Generate the final invitation files
4. Ensure all imports and references remain valid

### Step 6: Build and Deploy
1. Run `npm install` to install dependencies
2. Run `npm run build` to create production build
3. Deploy the generated `dist` folder

## Key Features

### 1. Responsive Design
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interactions

### 2. Interactive Elements
- Background music player
- Countdown timer to wedding date
- Photo carousel with navigation
- Animated transitions and effects

### 3. Cultural Elements
- Traditional Indian wedding themes
- Ganesh imagery and blessings
- Gold and maroon color scheme
- Sanskrit/Hindi cultural references

### 4. Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatible
- High contrast color ratios

## Customization Points

### Colors and Theming
The template uses CSS custom properties that can be easily modified:
- Primary colors: Gold (#FFD700) and Maroon
- Background gradients and patterns
- Typography settings

### Layout Modifications
- Event card layouts
- Family section arrangements  
- Photo gallery configurations
- Navigation structures

### Content Sections
- Add/remove event types
- Modify family member fields
- Customize contact information
- Update venue details

## Technical Requirements

### Dependencies
All required packages are listed in `package.json`. Key dependencies:
- React 18+
- TypeScript 4.9+
- Tailwind CSS 3+
- Vite 4+

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- ES2015+ support required

## Deployment Considerations

### Performance
- Optimized images (WebP format recommended)
- Lazy loading for gallery images
- Minimal bundle size
- Fast loading times

### SEO
- Meta tags can be customized
- Open Graph tags for social sharing
- Semantic HTML structure

### Security
- No sensitive data in client-side code
- Safe image handling
- XSS protection through React

## Support and Maintenance

### File Structure Best Practices
- Keep components small and focused
- Maintain clear separation of concerns
- Use TypeScript for type safety
- Follow React best practices

### Common Modifications
- Adding new event types
- Modifying family member structures
- Updating styling and themes
- Adding new interactive features

## Example Platform Integration

```javascript
// Example of how a platform might process placeholders
const placeholders = parsePlaceholderFile('src/constants/placeholders.ts');
const userForm = generateForm(placeholders);
const userData = collectUserInput(userForm);
const personalizedTemplate = replacePlaceholders(template, userData);
const builtInvitation = buildTemplate(personalizedTemplate);
```

This template is designed to be platform-agnostic and can be integrated into any system that can process JavaScript/TypeScript projects and handle file replacements.


# Event Management Web App - Product Requirements Document (PRD)

## Project Overview
Create a fully functional web-based invitation system for an Event Management Web App using React, TypeScript, and Supabase. The system allows users to create events with customizable invitation templates, manage guests, and share unique personalized invitation links.

## Phase One Scope
Web-based invitation system with user authentication, event creation, guest management, and animated invitation rendering.

## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Core Features

### 1. User Authentication
**Sign-Up:**
- Fields: Email (unique), password (min 8 characters), name, mobile number (unique, format: +<countrycode>-<number>)
- Email verification required
- Store user data in Supabase Users table

**Login:**
- Allow login with either email or mobile number + password
- Redirect to /dashboard on successful login
- Enforce email verification before dashboard access

### 2. Dashboard
**Purpose:** Authenticated user's hub to view and manage events

**Sections:**
- Hosted Events: List events where user is the host
- Invited Events: List events where user's mobile matches guest mobile
- Create Event Button: Links to /create-event

### 3. Event Creation Flow
1. **Template Gallery**: Display 2-3 predefined templates with thumbnails
2. **Customization Form**: Dynamic form based on template fields
3. **Preview**: Render selected template with form data
4. **Submit**: Save event and redirect to event management

### 4. Guest Management
**Add Guests:**
- Form: Guest name (required), mobile number (required)
- Generate unique UUID for each guest
- Link mobile to existing users if match found
- Generate unique invitation links: `/[pageName]/[eventId]-[guestId]`

**Features:**
- Table/list showing guest info and copyable links
- Add new guests functionality

### 5. Invitation Rendering
**URL Structure:** `/[pageName]/[eventId]-[guestId]`
- Dynamic content based on event details and guest info
- Multi-page support per template
- Guest name personalization
- Interaction tracking (viewed/accepted)
- Smooth animations with Framer Motion

## Database Schema

### Users Table
```
id (UUID, primary key)
email (text, unique)
password (text, hashed)
name (text)
mobile_number (text, unique, e.g., +91-1234567890)
```

### Events Table
```
id (UUID, primary key)
host_id (UUID, foreign key to Users)
name (text)
template_id (UUID, foreign key to Templates)
details (JSON, event-specific data)
created_at (timestamp)
```

### Templates Table
```
id (UUID, primary key)
name (text)
component_name (text, e.g., "Template1")
fields (JSON, form field definitions)
pages (JSON, page definitions)
thumbnail_url (text)
```

### Guests Table
```
id (UUID, primary key, used as guestId)
event_id (UUID, foreign key to Events)
name (text)
mobile_number (text)
user_id (UUID, foreign key to Users, nullable)
viewed (boolean, default false)
accepted (boolean, default false)
viewed_at (timestamp, nullable)
accepted_at (timestamp, nullable)
```

## Frontend Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── HostedEvents.tsx
│   │   └── InvitedEvents.tsx
│   ├── events/
│   │   ├── TemplateCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── EventPreview.tsx
│   │   └── GuestList.tsx
│   ├── invitations/
│   │   └── Invitation.tsx
│   └── ui/ (shadcn components)
├── pages/
│   ├── Index.tsx (homepage)
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── CreateEvent.tsx
│   ├── EventManagement.tsx
│   └── InvitationPage.tsx
├── templates/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── Template3.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useEvents.ts
│   └── useGuests.ts
├── lib/
│   ├── supabase.ts
│   ├── templates.ts
│   └── validations.ts
└── types/
    └── index.ts
```

## Security Requirements
- Row Level Security (RLS) policies for all tables
- Users can only access their own data
- Event hosts can manage their events
- Guests can view invitations without authentication
- Secure UUID-based invitation links
- Email verification enforcement

## Sample Template Structure
Templates support multiple pages (e.g., welcome, details) with:
- Dynamic content replacement
- Guest name personalization
- Interactive elements (Accept button)
- Smooth animations
- Responsive design

## Development Phases
1. **Phase 1**: Authentication system and basic dashboard
2. **Phase 2**: Event creation with template gallery
3. **Phase 3**: Guest management and link generation
4. **Phase 4**: Invitation rendering with animations
5. **Phase 5**: Tracking and analytics
6. **Phase 6**: Testing and refinement

## Future Extensibility
- Template system designed for easy addition of new templates
- Component-based architecture for scalability
- JSON-based template configuration
- Modular page system for complex invitations

## Success Metrics
- User registration and email verification rates
- Event creation completion rates
- Guest invitation acceptance rates
- Template usage analytics
- User engagement metrics

## Technical Considerations
- Mobile-first responsive design
- Performance optimization for animations
- SEO-friendly invitation pages
- Accessible design following WCAG guidelines
- Cross-browser compatibility
- Progressive enhancement approach

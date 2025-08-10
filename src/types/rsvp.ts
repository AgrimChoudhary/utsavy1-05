// RSVP System - Simplified Type definitions
import { Guest, Event } from './index';

// Keep only simple template status type for templates
export type TemplateStatus = null | "accepted" | "submitted";

// Backward compatibility - deprecated but kept for cleanup
export type GuestStatus = 'pending' | 'viewed' | 'accepted' | 'submitted';
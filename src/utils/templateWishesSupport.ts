import { Template } from '@/types';

/**
 * Determines if a template supports wishes functionality
 * @param template - The template object or template data
 * @returns boolean - true if the template supports wishes, false otherwise
 */
export const templateSupportsWishes = (template: Template | any): boolean => {
  if (!template) return false;

  // Internal templates (non-external) support wishes by default
  if (!template.template_type || template.template_type !== 'external') {
    return true;
  }

  // For external templates, check specific component names that support wishes
  const wishSupportedExternalTemplates = [
    'RoyalWeddingTemplate', // Royal Indian Wedding template
  ];

  return wishSupportedExternalTemplates.includes(template.component_name);
};

/**
 * Determines if wishes should be shown for an event based on its template
 * @param event - The event object containing template information
 * @param getTemplateById - Function to get template by ID (for cached templates)
 * @returns boolean - true if wishes should be shown for this event
 */
export const shouldShowWishesForEvent = (
  event: any, 
  getTemplateById?: (id: string) => Template | undefined
): boolean => {
  if (!event) return false;

  // Try to get template from event object first
  let template = event.template || event.templates;
  
  // If no template in event object, try to get it from cache using template_id
  if (!template && event.template_id && getTemplateById) {
    template = getTemplateById(event.template_id);
  }

  return templateSupportsWishes(template);
};
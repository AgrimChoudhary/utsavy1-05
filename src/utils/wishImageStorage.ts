import { supabase } from "@/integrations/supabase/client";

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Converts base64 image data to a Blob object
 */
export function base64ToBlob(base64Data: string): { blob: Blob; extension: string } {
  // Extract MIME type and data from base64 string
  const parts = base64Data.split(',');
  const mimeMatch = parts[0].match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*$/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  
  // Get file extension from MIME type
  const extension = mimeType.split('/')[1] || 'jpg';
  
  // Convert base64 to binary
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return {
    blob: new Blob([byteArray], { type: mimeType }),
    extension
  };
}

/**
 * Uploads base64 image to Supabase storage and returns public URL
 */
export async function uploadBase64ToStorage(
  base64Data: string,
  eventId: string,
  guestId?: string
): Promise<ImageUploadResult> {
  try {
    // Convert base64 to blob
    const { blob, extension } = base64ToBlob(base64Data);
    
    // Generate unique filename
    const timestamp = Date.now();
    const guestPrefix = guestId ? `${guestId}-` : 'anonymous-';
    const filename = `${eventId}/${guestPrefix}${timestamp}.${extension}`;
    
    // Upload to wish-images bucket
    const { data, error } = await supabase.storage
      .from('wish-images')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading wish image:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('wish-images')
      .getPublicUrl(data.path);
    
    return {
      success: true,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error in uploadBase64ToStorage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Checks if a URL is a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Migrates existing base64 photo URLs to storage (for backward compatibility)
 */
export async function migrateBase64ToStorage(
  photoUrl: string,
  eventId: string,
  wishId: string
): Promise<string> {
  if (!isBase64DataUrl(photoUrl)) {
    return photoUrl; // Already a URL, no migration needed
  }
  
  try {
    const uploadResult = await uploadBase64ToStorage(photoUrl, eventId, `wish-${wishId}`);
    
    if (uploadResult.success && uploadResult.url) {
      // Update the wish record with new URL
      const { error } = await supabase
        .from('wishes')
        .update({ photo_url: uploadResult.url })
        .eq('id', wishId);
      
      if (error) {
        console.error('Error updating wish photo URL:', error);
        return photoUrl; // Return original if update fails
      }
      
      return uploadResult.url;
    } else {
      console.error('Failed to migrate base64 image:', uploadResult.error);
      return photoUrl; // Return original if upload fails
    }
  } catch (error) {
    console.error('Error migrating base64 to storage:', error);
    return photoUrl; // Return original on error
  }
}
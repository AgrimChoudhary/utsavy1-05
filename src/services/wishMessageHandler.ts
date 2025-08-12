import { supabase } from '@/integrations/supabase/client';
import { MESSAGE_TYPES } from '@/utils/iframeMessaging';
import { toast } from '@/hooks/use-toast';

export interface WishSubmissionData {
  content: string;
  guest_id: string;
  guest_name: string;
  image_data?: string | null;
  image_filename?: string | null;
  image_type?: string | null;
}

export interface WishManagementResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class WishMessageHandlerService {
  private static handlers: Map<string, WishMessageHandler> = new Map();

  static registerHandler(eventId: string, iframe: HTMLIFrameElement, onWishUpdate?: (wishes: any[]) => void) {
    console.log('📝 Registering wish message handler for event:', eventId);
    this.handlers.set(eventId, { iframe, onWishUpdate });
  }

  static unregisterHandler(eventId: string) {
    console.log('🗑️ Unregistering wish message handler for event:', eventId);
    this.handlers.delete(eventId);
  }

  static getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  static async handleMessage(event: MessageEvent, eventId: string) {
    const handler = this.handlers.get(eventId);
    if (!handler) {
      return;
    }

    const { type, payload } = event.data;
    
    // Security check
    const origin = event.origin || '';
    const isAllowedOrigin =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('vercel.app') ||
      origin === window.location.origin;

    if (!isAllowedOrigin) {
      return;
    }

    try {
      switch (type) {
        case MESSAGE_TYPES.REQUEST_INITIAL_WISHES_DATA:
          await this.handleRequestInitialWishesData(handler, eventId);
          break;
        case MESSAGE_TYPES.REQUEST_INITIAL_ADMIN_WISHES_DATA:
          await this.handleRequestInitialAdminWishesData(handler, eventId);
          break;
        case MESSAGE_TYPES.SUBMIT_NEW_WISH:
          await this.handleSubmitNewWish(handler, eventId, payload);
          break;
        case MESSAGE_TYPES.APPROVE_WISH:
          await this.handleApproveWish(handler, eventId, payload);
          break;
        case MESSAGE_TYPES.DELETE_WISH:
          await this.handleDeleteWish(handler, eventId, payload);
          break;
        case MESSAGE_TYPES.TOGGLE_WISH_LIKE:
          await this.handleToggleWishLike(handler, eventId, payload);
          break;
        case MESSAGE_TYPES.SUBMIT_WISH_REPLY:
          await this.handleSubmitWishReply(handler, eventId, payload);
          break;
        case MESSAGE_TYPES.REQUEST_WISHES_REFRESH:
          await this.handleRequestWishesRefresh(handler, eventId);
          break;
        default:
          console.warn('⚠️ Unknown wish message type:', type);
          break;
      }
    } catch (error) {
      console.error('❌ Error processing wish message:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to process wish message' }
      });
    }
  }

  private static async handleRequestInitialWishesData(handler: WishMessageHandler, eventId: string) {
    try {
      const { data: wishesFromDB, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // Transform database fields to match template expectations
      const transformedWishes = (wishesFromDB || []).map(wish => ({
        id: wish.id,
        guest_id: wish.guest_id,
        guest_name: wish.guest_name,
        content: wish.wish_text,
        image_url: wish.photo_url,
        likes_count: wish.likes_count || 0,
        is_approved: wish.is_approved,
        created_at: wish.created_at
      }));
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.INITIAL_WISHES_DATA,
        payload: { wishes: transformedWishes }
      });

      if (handler.onWishUpdate) {
        handler.onWishUpdate(transformedWishes);
      }
    } catch (error) {
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { 
          error: 'Failed to fetch wishes'
        }
      });
    }
  }

  private static async handleRequestInitialAdminWishesData(handler: WishMessageHandler, eventId: string) {
    console.log('👑 Fetching admin wishes data for event:', eventId);
    
    try {
      const { data: wishesFromDB, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Fetched all wishes for admin:', wishesFromDB?.length || 0);
      
      // Transform database fields to match template expectations
      // Only include fields that actually exist in database
      const transformedWishes = (wishesFromDB || []).map(wish => ({
        id: wish.id,
        guest_id: wish.guest_id,
        guest_name: wish.guest_name,
        content: wish.wish_text,           // Database: wish_text → Template: content
        image_url: wish.photo_url,         // Database: photo_url → Template: image_url (can be null)
        likes_count: wish.likes_count || 0,
        is_approved: wish.is_approved,
        created_at: wish.created_at
        // Removed: replies_count (doesn't exist in DB)
        // Removed: updated_at (doesn't exist in DB) 
        // Removed: hasLiked (doesn't exist in DB)
      }));
      
      console.log('👑 Transformed admin wishes:', transformedWishes?.length || 0);
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.INITIAL_ADMIN_WISHES_DATA,
        payload: { wishes: transformedWishes }
      });

      if (handler.onWishUpdate) {
        handler.onWishUpdate(transformedWishes);
      }
    } catch (error) {
      console.error('❌ Error fetching admin wishes:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to fetch admin wishes' }
      });
    }
  }

  private static async handleSubmitNewWish(handler: WishMessageHandler, eventId: string, payload: WishSubmissionData) {
    try {
      // Submit wish via secure RPC to avoid RLS issues
      const photoUrl = payload.image_data ?? null;

      const { data: wish, error } = await supabase
        .rpc('submit_wish_secure', {
          p_event: eventId,
          p_guest: payload.guest_id,
          p_guest_name: payload.guest_name,
          p_content: payload.content,
          p_photo_url: photoUrl,
        });

      if (error) {
        throw new Error('Database insertion failed');
      }

      const insertedWish = wish as any;
      console.log('✅ Wish submitted successfully:', insertedWish?.id);
      console.log('✅ Complete wish data returned:', JSON.stringify(insertedWish, null, 2));
      
      // Send success response
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_SUBMITTED_SUCCESS,
        payload: { wish: insertedWish }
      });

      // Refresh wishes list
      if (handler.onWishUpdate) {
        await this.handleRequestWishesRefresh(handler, eventId);
      }
      
    } catch (error) {
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_SUBMITTED_ERROR,
        payload: { 
          error: error.message || 'Failed to submit wish'
        }
      });
    }
  }

  private static async handleApproveWish(handler: WishMessageHandler, eventId: string, payload: { wishId: string }) {
    console.log('✅ Approving wish:', payload.wishId, 'for event:', eventId);

    try {
      const { error } = await supabase
        .from('wishes')
        .update({ is_approved: true })
        .eq('id', payload.wishId)
        .eq('event_id', eventId);

      if (error) throw error;

      console.log('✅ Wish approved successfully');
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_APPROVED,
        payload: { wishId: payload.wishId }
      });

      // Refresh wishes list
      if (handler.onWishUpdate) {
        await this.handleRequestWishesRefresh(handler, eventId);
      }
    } catch (error) {
      console.error('❌ Error approving wish:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to approve wish' }
      });
    }
  }

  private static async handleDeleteWish(handler: WishMessageHandler, eventId: string, payload: { wishId: string }) {
    console.log('🗑️ Deleting wish:', payload.wishId, 'for event:', eventId);

    try {
      const { error } = await supabase
        .from('wishes')
        .delete()
        .eq('id', payload.wishId)
        .eq('event_id', eventId);

      if (error) throw error;

      console.log('✅ Wish deleted successfully');
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_DELETED,
        payload: { wishId: payload.wishId }
      });

      // Refresh wishes list
      if (handler.onWishUpdate) {
        await this.handleRequestWishesRefresh(handler, eventId);
      }
    } catch (error) {
      console.error('❌ Error deleting wish:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to delete wish' }
      });
    }
  }

  private static async handleToggleWishLike(handler: WishMessageHandler, eventId: string, payload: { wishId: string; guestId: string; guestName: string }) {
    console.log('❤️ Toggling wish like:', payload.wishId, 'by guest:', payload.guestName);

    try {
      // Check if guest already liked this wish
      const { data: existingLike, error: checkError } = await supabase
        .from('wish_likes')
        .select('id')
        .eq('wish_id', payload.wishId)
        .eq('guest_id', payload.guestId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Remove like
        console.log('💔 Removing like from wish');
        const { error: deleteError } = await supabase
          .from('wish_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Decrement likes count
        await supabase.rpc('decrement_wish_likes', { wish_id: payload.wishId });
      } else {
        // Add like
        console.log('💕 Adding like to wish');
        const { error: insertError } = await supabase
          .from('wish_likes')
          .insert({
            wish_id: payload.wishId,
            guest_id: payload.guestId
          });

        if (insertError) throw insertError;

        // Increment likes count
        await supabase.rpc('increment_wish_likes', { wish_id: payload.wishId });
      }

      // Get updated like count and status
      const { data: updatedWish } = await supabase
        .from('wishes')
        .select('likes_count')
        .eq('id', payload.wishId)
        .single();

      // Check if current guest has liked this wish
      const { data: currentLike } = await supabase
        .from('wish_likes')
        .select('id')
        .eq('wish_id', payload.wishId)
        .eq('guest_id', payload.guestId)
        .single();

      console.log('✅ Wish like toggled successfully');
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_LIKE_UPDATED,
        payload: { 
          wishId: payload.wishId,
          likes_count: updatedWish?.likes_count || 0,
          hasLiked: !!currentLike
        }
      });

      // Refresh wishes list
      if (handler.onWishUpdate) {
        await this.handleRequestWishesRefresh(handler, eventId);
      }
    } catch (error) {
      console.error('❌ Error toggling wish like:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to toggle wish like' }
      });
    }
  }

  private static async handleSubmitWishReply(handler: WishMessageHandler, eventId: string, payload: { wishId: string; guestId: string; guestName: string; content: string }) {
    console.log('💬 Submitting wish reply:', payload.content, 'for wish:', payload.wishId);

    try {
      // For now, we'll just log the reply
      // In the future, you can implement a wish_replies table
      console.log('💬 Reply submitted:', {
        wishId: payload.wishId,
        guestId: payload.guestId,
        guestName: payload.guestName,
        content: payload.content
      });

      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_REPLY_SUBMITTED,
        payload: { 
          wishId: payload.wishId,
          reply: {
            guestId: payload.guestId,
            guestName: payload.guestName,
            content: payload.content
          }
        }
      });
    } catch (error) {
      console.error('❌ Error submitting wish reply:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { error: 'Failed to submit wish reply' }
      });
    }
  }

  private static async handleRequestWishesRefresh(handler: WishMessageHandler, eventId: string) {
    console.log('🔄 Refreshing wishes for event:', eventId);
    
    try {
      // Only fetch approved wishes for guest templates
      const { data: wishesFromDB, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_approved', true)  // Only approved wishes for guest view
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Approved wishes refreshed from DB:', wishesFromDB?.length || 0);
      
      // Transform database fields to match template expectations
      // Only include fields that actually exist in database
      const transformedWishes = (wishesFromDB || []).map(wish => ({
        id: wish.id,
        guest_id: wish.guest_id,
        guest_name: wish.guest_name,
        content: wish.wish_text,           // Database: wish_text → Template: content
        image_url: wish.photo_url,         // Database: photo_url → Template: image_url (can be null)
        likes_count: wish.likes_count || 0,
        is_approved: wish.is_approved,
        created_at: wish.created_at
        // Removed: replies_count (doesn't exist in DB)
        // Removed: updated_at (doesn't exist in DB) 
        // Removed: hasLiked (doesn't exist in DB)
      }));
      
      console.log('🔄 Transformed wishes for refresh:', transformedWishes?.length || 0);
      
      // Send updated wishes to template
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.INITIAL_WISHES_DATA,
        payload: { wishes: transformedWishes }
      });
      
      if (handler.onWishUpdate) {
        handler.onWishUpdate(transformedWishes);
      }
    } catch (error) {
      console.error('❌ Error refreshing wishes:', error);
    }
  }

  private static sendMessageToTemplate(iframe: HTMLIFrameElement, message: any) {
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(message, '*');
      } catch (error) {
        console.error('Failed to send message to template:', error);
      }
    }
  }
}

interface WishMessageHandler {
  iframe: HTMLIFrameElement;
  onWishUpdate?: (wishes: any[]) => void;
}
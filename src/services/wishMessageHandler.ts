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
    console.log('🚀 PLATFORM: WishMessageHandlerService.handleMessage called');
    console.log('🚀 PLATFORM: Event ID received:', eventId);
    console.log('🚀 PLATFORM: Event ID type:', typeof eventId);
    console.log('🚀 PLATFORM: Available handlers:', Array.from(this.handlers.keys()));
    
    const handler = this.handlers.get(eventId);
    if (!handler) {
      console.error('❌ PLATFORM: No wish message handler found for event:', eventId);
      console.error('❌ PLATFORM: Available handlers:', Array.from(this.handlers.keys()));
      console.error('❌ PLATFORM: This means template requests will not be processed!');
      return;
    }

    console.log('✅ PLATFORM: Found handler for event:', eventId);
    console.log('🖼️ PLATFORM: Handler has iframe:', !!handler.iframe);
    console.log('🖼️ PLATFORM: Handler has contentWindow:', !!handler.iframe?.contentWindow);

    const { type, payload } = event.data;
    
    console.log('🔍 PLATFORM: Message type:', type);
    console.log('🔍 PLATFORM: Event origin:', event.origin);
    console.log('🔍 PLATFORM: Full event data:', JSON.stringify(event.data, null, 2));
    
    // Security check - verify origin
    if (!event.origin || (!event.origin.includes('localhost') && !event.origin.includes('127.0.0.1') && !event.origin.includes('vercel.app'))) {
      console.warn('🚨 PLATFORM: Unauthorized origin for wish message:', event.origin);
      return;
    }

    console.log('💕 PLATFORM: Processing wish message:', type, 'for event:', eventId);
    console.log('📦 PLATFORM: Message payload:', payload);
    console.log('📦 PLATFORM: Full payload structure:', JSON.stringify(payload, null, 2));

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
    console.log('📋 PLATFORM: Handling REQUEST_INITIAL_WISHES_DATA');
    console.log('📋 PLATFORM: Fetching wishes for event ID:', eventId);
    console.log('📋 PLATFORM: Event ID type:', typeof eventId);
    
    try {
      // Resolve eventId (custom_event_id → actual UUID) before querying wishes
      let actualEventId = eventId;
      console.log('🔍 PLATFORM: Resolving event ID for wishes fetch:', eventId);
      const { data: eventById } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
      if (!eventById) {
        console.log('🔄 PLATFORM: Event ID not a UUID, trying custom_event_id...');
        const { data: eventByCustomId } = await supabase
          .from('events')
          .select('id')
          .eq('custom_event_id', eventId)
          .single();
        if (eventByCustomId) {
          actualEventId = eventByCustomId.id;
          console.log('✅ PLATFORM: Resolved custom_event_id to UUID:', actualEventId);
        } else {
          console.warn('⚠️ PLATFORM: Event not found by id or custom_event_id:', eventId);
        }
      } else {
        console.log('✅ PLATFORM: Provided eventId is a valid UUID');
      }

      console.log('🔍 PLATFORM: Querying database for approved wishes...');
      console.log('🔍 PLATFORM: Query conditions - event_id:', actualEventId, 'is_approved: true');
      console.log('🔍 PLATFORM: About to execute Supabase query...');
      
      // First, let's check if ANY wishes exist for this event (for debugging)
      const { data: allWishesForEvent, error: allWishesError } = await supabase
        .from('wishes')
        .select('id, guest_name, is_approved, created_at')
        .eq('event_id', actualEventId);
        
      if (allWishesError) {
        console.error('❌ PLATFORM: Error checking all wishes for event:', allWishesError);
      } else {
        console.log('📊 PLATFORM: Total wishes for event:', allWishesForEvent?.length || 0);
        const approvedCount = allWishesForEvent?.filter(w => w.is_approved).length || 0;
        const pendingCount = (allWishesForEvent?.length || 0) - approvedCount;
        console.log('📊 PLATFORM: Approved:', approvedCount, '| Pending:', pendingCount);
        
        if (allWishesForEvent?.length === 0) {
          console.warn('⚠️ PLATFORM: No wishes found - guests need to submit wishes first');
        } else if (approvedCount === 0) {
          console.warn('⚠️ PLATFORM: Wishes exist but none are approved yet');
          console.warn('💡 PLATFORM: SOLUTION: Host should approve wishes in management panel');
        }
      }
      
      // Now query for approved wishes only
      const queryPromise = supabase
        .from('wishes')
        .select('*')
        .eq('event_id', actualEventId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
        
      console.log('⏳ PLATFORM: Query created, now executing...');
      
      const { data: wishesFromDB, error } = await Promise.race([
        queryPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
        )
      ]) as any;
      
      console.log('🏁 PLATFORM: Query execution completed!');
      console.log('🏁 PLATFORM: Error status:', !!error);
      console.log('🏁 PLATFORM: Data status:', !!wishesFromDB);

      if (error) {
        console.error('❌ PLATFORM: Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ PLATFORM: Database query successful!');
      console.log('📊 PLATFORM: Approved wishes from DB:', wishesFromDB?.length || 0);
      console.log('📊 PLATFORM: Raw approved wishes data:', wishesFromDB);
      
      if (!wishesFromDB || wishesFromDB.length === 0) {
        console.warn('⚠️ PLATFORM: No approved wishes found in database for event:', eventId);
        console.warn('⚠️ PLATFORM: Possible reasons:');
        console.warn('   1. Event ID is incorrect');
        console.warn('   2. No wishes have been submitted yet'); 
        console.warn('   3. Wishes exist but are not approved (is_approved = false)');
        console.warn('💡 PLATFORM: Check wish management panel to approve pending wishes');
      }
      
      // Transform database fields to match template expectations
      // Only include fields that actually exist in database
      const transformedWishes = (wishesFromDB || []).map(wish => {
        // Validate required fields
        if (!wish.id || !wish.guest_name || !wish.wish_text) {
          console.warn('⚠️ PLATFORM: Wish missing required fields:', wish);
        }
        
        return {
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
        };
      });
      
      console.log('🔄 PLATFORM: Transformed wishes for template:', transformedWishes?.length || 0);
      console.log('📊 PLATFORM: Sample transformed wish:', transformedWishes[0]);
      console.log('📊 PLATFORM: All transformed wishes:', JSON.stringify(transformedWishes, null, 2));
      
      // Validate iframe before sending
      if (!handler.iframe || !handler.iframe.contentWindow) {
        console.error('❌ PLATFORM: Cannot send to template - invalid iframe');
        console.error('❌ PLATFORM: Handler iframe:', handler.iframe);
        console.error('❌ PLATFORM: This means template will not receive wishes data');
        return;
      }
      
      const responseMessage = {
        type: MESSAGE_TYPES.INITIAL_WISHES_DATA,
        payload: { wishes: transformedWishes }
      };
      
      console.log('📤 PLATFORM: Sending wishes to template...');
      console.log('📤 PLATFORM: Response message:', responseMessage);
      console.log('📤 PLATFORM: Wishes being sent:', transformedWishes?.length || 0);
      console.log('📤 PLATFORM: Target iframe contentWindow exists:', !!handler.iframe.contentWindow);
      
      this.sendMessageToTemplate(handler.iframe, responseMessage);
      
      console.log('✅ PLATFORM: Wishes data sent to template successfully');

      if (handler.onWishUpdate) {
        handler.onWishUpdate(transformedWishes);
      }
    } catch (error) {
      console.error('❌ PLATFORM: Error fetching initial wishes:', error);
      console.error('❌ PLATFORM: Stack trace:', error.stack);
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.ERROR,
        payload: { 
          error: 'Failed to fetch wishes',
          details: error.message,
          eventId: eventId
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
    console.log('📝 Submitting new wish for event:', eventId, 'by guest:', payload.guest_name);
    console.log('📦 Wish content:', payload.content);
    console.log('🖼️ Has image:', !!payload.image_data);
    console.log('🔍 Complete payload received:', JSON.stringify(payload, null, 2));
    console.log('🔍 Event ID type:', typeof eventId, 'Value:', eventId);

    try {
      // Resolve event ID to actual database UUID
      let actualEventId = eventId;
      
      console.log('🔍 Resolving event ID from:', eventId);
      
      // First try as actual UUID
      const { data: eventById } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
      
      if (!eventById) {
        // Try as custom_event_id
        console.log('🔄 Event ID not found as UUID, trying as custom_event_id...');
        const { data: eventByCustomId } = await supabase
          .from('events')
          .select('id')
          .eq('custom_event_id', eventId)
          .single();
        
        if (eventByCustomId) {
          actualEventId = eventByCustomId.id;
          console.log('✅ Resolved custom event ID to actual ID:', actualEventId);
        } else {
          console.error('❌ Event not found with ID:', eventId);
          throw new Error(`Event not found for ID: ${eventId}`);
        }
      } else {
        console.log('✅ Event ID is already actual UUID:', actualEventId);
      }
      
      // Resolve guest ID to actual database UUID (critical for RLS policies)
      let actualGuestId = payload.guest_id;
      
      console.log('🔍 Resolving guest ID from:', payload.guest_id);
      
      // First try as actual UUID
      const { data: guestById } = await supabase
        .from('guests')
        .select('id')
        .eq('id', payload.guest_id)
        .single();
      
      if (!guestById) {
        // Try as custom_guest_id
        console.log('🔄 Guest ID not found as UUID, trying as custom_guest_id...');
        const { data: guestByCustomId } = await supabase
          .from('guests')
          .select('id')
          .eq('custom_guest_id', payload.guest_id)
          .single();
        
        if (guestByCustomId) {
          actualGuestId = guestByCustomId.id;
          console.log('✅ Resolved custom guest ID to actual ID:', actualGuestId);
        } else {
          console.error('❌ Guest not found with ID:', payload.guest_id);
          throw new Error(`Guest not found for ID: ${payload.guest_id}`);
        }
      } else {
        console.log('✅ Guest ID is already actual UUID:', actualGuestId);
      }
      
      // Create wish data with resolved IDs
      const wishData: any = {
        event_id: actualEventId, // Use resolved actual event ID
        guest_id: actualGuestId, // Use resolved actual guest ID
        guest_name: payload.guest_name,
        wish_text: payload.content,
        is_approved: false,
        likes_count: 0
      };
      
      console.log('💾 Wish data being inserted:', JSON.stringify(wishData, null, 2));

      // Handle image if present
      if (payload.image_data) {
        console.log('🖼️ Processing image upload...');
        // Store as full data URL so templates can render directly
        const mimeType = payload.image_type || 'image/jpeg';
        const hasPrefix = payload.image_data.startsWith('data:');
        wishData.photo_url = hasPrefix
          ? payload.image_data
          : `data:${mimeType};base64,${payload.image_data}`;
      }

      console.log('📤 About to insert wish into database...');
      
      const { data: wish, error } = await supabase
        .from('wishes')
        .insert(wishData)
        .select()
        .single();

      if (error) {
        console.error('💥 Database error during wish insertion:', error);
        console.error('💥 Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Wish submitted successfully:', wish.id);
      console.log('✅ Complete wish data returned:', JSON.stringify(wish, null, 2));
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_SUBMITTED_SUCCESS,
        payload: { wish }
      });

      // Refresh wishes list
      if (handler.onWishUpdate) {
        await this.handleRequestWishesRefresh(handler, eventId);
      }
    } catch (error) {
      console.error('❌ Error submitting wish:', error);
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_SUBMITTED_ERROR,
        payload: { error: 'Failed to submit wish' }
      });
    }
  }

  private static async handleApproveWish(handler: WishMessageHandler, eventId: string, payload: { wishId: string }) {
    console.log('✅ Approving wish:', payload.wishId, 'for event:', eventId);

    try {
      // Resolve eventId to actual UUID before updating
      let actualEventId = eventId;
      const { data: eventById } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
      if (!eventById) {
        const { data: eventByCustomId } = await supabase
          .from('events')
          .select('id')
          .eq('custom_event_id', eventId)
          .single();
        if (eventByCustomId) {
          actualEventId = eventByCustomId.id;
        }
      }

      const { error } = await supabase
        .from('wishes')
        .update({ is_approved: true })
        .eq('id', payload.wishId)
        .eq('event_id', actualEventId);

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
      // Resolve eventId to actual UUID before deleting
      let actualEventId = eventId;
      const { data: eventById } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
      if (!eventById) {
        const { data: eventByCustomId } = await supabase
          .from('events')
          .select('id')
          .eq('custom_event_id', eventId)
          .single();
        if (eventByCustomId) {
          actualEventId = eventByCustomId.id;
        }
      }

      const { error } = await supabase
        .from('wishes')
        .delete()
        .eq('id', payload.wishId)
        .eq('event_id', actualEventId);

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
      // Resolve guestId to actual database UUID (custom_guest_id → id)
      let actualGuestId = payload.guestId;
      console.log('🔍 Resolving guest ID for like from:', payload.guestId);
      const { data: guestById } = await supabase
        .from('guests')
        .select('id')
        .eq('id', payload.guestId)
        .single();
      if (!guestById) {
        console.log('🔄 Guest ID not a UUID, trying custom_guest_id...');
        const { data: guestByCustomId } = await supabase
          .from('guests')
          .select('id')
          .eq('custom_guest_id', payload.guestId)
          .single();
        if (guestByCustomId) {
          actualGuestId = guestByCustomId.id;
          console.log('✅ Resolved custom guest ID to actual ID for like:', actualGuestId);
        } else {
          throw new Error(`Guest not found for like operation: ${payload.guestId}`);
        }
      }

      // Check if guest already liked this wish
      const { data: existingLike, error: checkError } = await supabase
        .from('wish_likes')
        .select('id')
        .eq('wish_id', payload.wishId)
        .eq('guest_id', actualGuestId)
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
            guest_id: actualGuestId
          });

        if (insertError) throw insertError;

        // Increment likes count (RPC, ignore error but log)
        const { error: incErr } = await supabase.rpc('increment_wish_likes', { wish_id: payload.wishId });
        if (incErr) {
          console.warn('⚠️ RPC increment_wish_likes failed, will recalc via count:', incErr);
        }
      }

      // Get updated like count by counting likes to be robust
      const { count: likesCount } = await supabase
        .from('wish_likes')
        .select('id', { count: 'exact', head: true })
        .eq('wish_id', payload.wishId);

      // Sync likes_count column (best-effort)
      if (typeof likesCount === 'number') {
        await supabase
          .from('wishes')
          .update({ likes_count: likesCount })
          .eq('id', payload.wishId);
      }

      // Check if current guest has liked this wish
      const { data: currentLike } = await supabase
        .from('wish_likes')
        .select('id')
        .eq('wish_id', payload.wishId)
        .eq('guest_id', actualGuestId)
        .single();

      console.log('✅ Wish like toggled successfully');
      
      this.sendMessageToTemplate(handler.iframe, {
        type: MESSAGE_TYPES.WISH_LIKE_UPDATED,
        payload: { 
          wishId: payload.wishId,
          likes_count: typeof likesCount === 'number' ? likesCount : 0,
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
      // Resolve eventId to actual UUID before querying
      let actualEventId = eventId;
      const { data: eventById } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();
      if (!eventById) {
        const { data: eventByCustomId } = await supabase
          .from('events')
          .select('id')
          .eq('custom_event_id', eventId)
          .single();
        if (eventByCustomId) {
          actualEventId = eventByCustomId.id;
        }
      }

      // Only fetch approved wishes for guest templates
      const { data: wishesFromDB, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('event_id', actualEventId)
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
    console.log('📤 PLATFORM: sendMessageToTemplate called');
    console.log('📤 PLATFORM: Message type:', message.type);
    console.log('📤 PLATFORM: Full message:', JSON.stringify(message, null, 2));
    console.log('🖼️ PLATFORM: Iframe exists:', !!iframe);
    console.log('🖼️ PLATFORM: ContentWindow exists:', !!iframe?.contentWindow);
    
    if (iframe.contentWindow) {
      console.log('✅ PLATFORM: Sending message to template via postMessage');
      console.log('📤 PLATFORM: Target origin: *');
      
      try {
        iframe.contentWindow.postMessage(message, '*');
        console.log('✅ PLATFORM: Message sent successfully!');
      } catch (error) {
        console.error('❌ PLATFORM: Error sending message:', error);
      }
    } else {
      console.error('❌ PLATFORM: Cannot send message - iframe contentWindow not available');
      console.error('❌ PLATFORM: This means template will not receive wishes!');
    }
  }
}

interface WishMessageHandler {
  iframe: HTMLIFrameElement;
  onWishUpdate?: (wishes: any[]) => void;
}



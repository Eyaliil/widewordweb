import { supabase } from '../lib/supabaseClient';

// Service for managing messages between matched users
export class MessagingService {
  // Send a message
  async sendMessage(matchId, senderId, receiverId, message) {
    try {
      console.log(`📤 Sending message from ${senderId} to ${receiverId}: ${message}`);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          message: message,
          is_read: false
        })
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Message sent successfully:', data.id);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get messages for a match
  async getMessages(matchId, userId) {
    try {
      console.log(`📥 Fetching messages for match ${matchId} and user ${userId}`);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(name, avatar_emoji),
          receiver:profiles!receiver_id(name, avatar_emoji)
        `)
        .eq('match_id', matchId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return [];
      }

      console.log(`✅ Found ${messages.length} messages`);
      return messages || [];
    } catch (error) {
      console.error('❌ Error in getMessages:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(matchId, userId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
    }
  }

  // Get unread message count for a user
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('❌ Error in getUnreadCount:', error);
      return 0;
    }
  }
}

export const messagingService = new MessagingService();

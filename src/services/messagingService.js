import { supabase } from '../lib/supabaseClient';

// Service for managing messages between matched users
export class MessagingService {
  // Send a message
  async sendMessage(matchId, senderId, receiverId, message) {
    try {
      console.log(`📤 Sending message from ${senderId} to ${receiverId}: ${message}`);
      
      // Validate message length
      if (!message || message.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty' };
      }
      
      if (message.length > 2000) {
        return { success: false, error: 'Message is too long (max 2000 characters)' };
      }
      
      // Check if users are in a mutual match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('status, user1_id, user2_id')
        .eq('id', matchId)
        .single();
      
      if (matchError || !match) {
        return { success: false, error: 'Match not found' };
      }
      
      if (match.status !== 'mutual_match') {
        return { success: false, error: 'Can only message mutual matches' };
      }
      
      // Verify sender is part of the match
      if (match.user1_id !== senderId && match.user2_id !== senderId) {
        return { success: false, error: 'You are not part of this match' };
      }
      
      // Verify receiver is part of the match
      if (match.user1_id !== receiverId && match.user2_id !== receiverId) {
        return { success: false, error: 'Receiver is not part of this match' };
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          receiver_id: receiverId,
          message: message.trim(),
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
      
      // First verify the user is part of this match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();
      
      if (matchError || !match) {
        console.error('❌ Match not found:', matchError);
        return [];
      }
      
      if (match.user1_id !== userId && match.user2_id !== userId) {
        console.error('❌ User not part of this match');
        return [];
      }
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          match_id,
          sender_id,
          receiver_id,
          message,
          is_read,
          created_at,
          updated_at
        `)
        .eq('match_id', matchId)
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

  // Subscribe to real-time messages for a match
  subscribeToMessages(matchId, userId, callback) {
    console.log(`🔔 Subscribing to messages for match ${matchId}`);
    
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          callback(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          console.log('📝 Message updated:', payload);
          callback(payload.new, 'update');
        }
      )
      .subscribe();

    return subscription;
  }

  // Unsubscribe from messages
  unsubscribeFromMessages(subscription) {
    if (subscription) {
      console.log('🔕 Unsubscribing from messages');
      supabase.removeChannel(subscription);
    }
  }

  // Get conversation list for a user (matches with recent messages)
  async getConversations(userId) {
    try {
      console.log(`📋 Fetching conversations for user ${userId}`);
      
      // Get all mutual matches for the user
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at
        `)
        .eq('status', 'mutual_match')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('❌ Error fetching matches:', matchesError);
        return [];
      }

      // Get the most recent message for each match
      const conversations = await Promise.all(
        matches.map(async (match) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('message, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get the other user's profile
          const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_emoji')
            .eq('user_id', otherUserId)
            .single();

          return {
            matchId: match.id,
            otherUser: otherUser || { user_id: otherUserId, name: 'Unknown User', avatar_emoji: '👤' },
            lastMessage: lastMessage || null,
            unreadCount: await this.getUnreadCountForMatch(match.id, userId)
          };
        })
      );

      // Sort by last message time
      conversations.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
      });

      console.log(`✅ Found ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ Error in getConversations:', error);
      return [];
    }
  }

  // Get unread count for a specific match
  async getUnreadCountForMatch(matchId, userId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('match_id', matchId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count for match:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('❌ Error in getUnreadCountForMatch:', error);
      return 0;
    }
  }
}

export const messagingService = new MessagingService();

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

  // Get messages for a match with pagination support
  async getMessages(matchId, userId, options = {}) {
    try {
      const { limit = 50, cursor = null, older = false } = options;
      console.log(`📥 Fetching messages for match ${matchId} (limit: ${limit}, cursor: ${cursor})`);
      
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
      
      // Build query with pagination
      let query = supabase
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
        .eq('match_id', matchId);
      
      // Apply cursor for pagination
      if (cursor) {
        if (older) {
          // Fetch messages older than cursor
          query = query.lt('created_at', cursor);
        } else {
          // Fetch messages newer than cursor
          query = query.gt('created_at', cursor);
        }
      }
      
      // Order and limit
      query = query.order('created_at', { ascending: older ? false : true }).limit(limit);

      const { data: messages, error } = await query;

      if (error) {
        console.error('❌ Error fetching messages:', error);
        return [];
      }

      // Reverse if loading older messages for correct display order
      const sortedMessages = older ? messages.reverse() : messages;

      console.log(`✅ Found ${sortedMessages.length} messages`);
      return sortedMessages || [];
    } catch (error) {
      console.error('❌ Error in getMessages:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(matchId, userId) {
    try {
      // Update messages table
      const { error: messagesError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (messagesError) {
        console.error('❌ Error marking messages as read:', messagesError);
      }

      // The trigger should handle conversation updates, but we can also do it explicitly
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant1_id')
        .eq('match_id', matchId)
        .single();

      if (!convError && conversation) {
        const isParticipant1 = conversation.participant1_id === userId;
        const updateData = isParticipant1 
          ? { participant1_unread_count: 0, participant1_last_read_at: new Date().toISOString() }
          : { participant2_unread_count: 0, participant2_last_read_at: new Date().toISOString() };

        const { error: updateError } = await supabase
          .from('conversations')
          .update(updateData)
          .eq('match_id', matchId);

        if (updateError) {
          console.error('❌ Error updating conversation read status:', updateError);
        }
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
    }
  }

  // Get unread message count for a user (optimized)
  async getUnreadCount(userId) {
    try {
      // Try to use conversations table for fast count
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('participant1_unread_count, participant2_unread_count, participant1_id')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

      if (!convError && conversations) {
        const totalUnread = conversations.reduce((sum, conv) => {
          return sum + (conv.participant1_id === userId 
            ? conv.participant1_unread_count 
            : conv.participant2_unread_count);
        }, 0);
        return totalUnread;
      }

      // Fallback to messages table if conversations table doesn't exist
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

  // Get conversation list for a user (optimized with conversations table)
  async getConversations(userId) {
    try {
      console.log(`📋 Fetching conversations for user ${userId}`);
      
      // Use the conversations table for fast loading
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          match_id,
          participant1_id,
          participant2_id,
          last_message_id,
          last_message_text,
          last_message_sender_id,
          last_message_at,
          participant1_unread_count,
          participant2_unread_count,
          participant1_last_read_at,
          participant2_last_read_at
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .not('last_message_at', 'is', null);

      if (convError) {
        console.error('❌ Error fetching conversations:', convError);
        // Fallback to old method if conversations table doesn't exist yet
        return this.getConversationsLegacy(userId);
      }

      // Transform the data and fetch other user profiles
      const conversations = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherUserId = conv.participant1_id === userId 
            ? conv.participant2_id 
            : conv.participant1_id;
          
          // Get the other user's profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_emoji')
            .eq('user_id', otherUserId)
            .single();

          // Get unread count for this user
          const unreadCount = conv.participant1_id === userId 
            ? conv.participant1_unread_count 
            : conv.participant2_unread_count;

          // Format last message
          const lastMessage = conv.last_message_text ? {
            message: conv.last_message_text,
            sender_id: conv.last_message_sender_id,
            created_at: conv.last_message_at
          } : null;

          return {
            matchId: conv.match_id,
            otherUser: otherUser || { user_id: otherUserId, name: 'Unknown User', avatar_emoji: '👤' },
            lastMessage: lastMessage,
            unreadCount: unreadCount || 0
          };
        })
      );

      console.log(`✅ Found ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      console.error('❌ Error in getConversations:', error);
      return [];
    }
  }

  // Legacy method for backward compatibility
  async getConversationsLegacy(userId) {
    try {
      console.log(`📋 Fetching conversations for user ${userId} (legacy method)`);
      
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

  // Get unread count for a specific match (optimized)
  async getUnreadCountForMatch(matchId, userId) {
    try {
      // Try to use conversations table for fast count
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant1_unread_count, participant2_unread_count, participant1_id')
        .eq('match_id', matchId)
        .single();

      if (!convError && conversation) {
        const unreadCount = conversation.participant1_id === userId 
          ? conversation.participant1_unread_count 
          : conversation.participant2_unread_count;
        return unreadCount || 0;
      }

      // Fallback to messages table
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

import { supabase, hasValidSupabaseConfig, Conversation, Message, Itinerary, GuestSession } from '@/lib/supabase';

const useLocalStorage = !hasValidSupabaseConfig;

const localStorageService = {
  getConversations(): Conversation[] {
    const stored = localStorage.getItem('travel-conversations');
    return stored ? JSON.parse(stored) : [];
  },
  
  saveConversations(conversations: Conversation[]) {
    localStorage.setItem('travel-conversations', JSON.stringify(conversations));
  },
  
  getMessages(conversationId: string): Message[] {
    const stored = localStorage.getItem(`travel-messages-${conversationId}`);
    return stored ? JSON.parse(stored) : [];
  },
  
  saveMessages(conversationId: string, messages: Message[]) {
    localStorage.setItem(`travel-messages-${conversationId}`, JSON.stringify(messages));
  }
};

export const conversationService = {
  // Create or get guest session
  async ensureGuestSession(): Promise<string> {
    if (!hasValidSupabaseConfig) {
      return 'local-session';
    }
    
    const sessionId = localStorage.getItem('guest-session-id');
    if (!sessionId) {
      throw new Error('No guest session found');
    }

    // Check if guest session exists in database
    const { data: existingSession } = await supabase
      .from('guest_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1);

    if (!existingSession || existingSession.length === 0) {
      // Create new guest session
      const { data, error } = await supabase
        .from('guest_sessions')
        .insert({ session_id: sessionId })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    }

    return existingSession[0].id;
  },

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    if (useLocalStorage) {
      return localStorageService.getConversations();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create a new conversation
  async createConversation(title: string): Promise<Conversation> {
    if (!hasValidSupabaseConfig) {
      const conversations = localStorageService.getConversations();
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: title.substring(0, 100),
        user_id: null,
        guest_session_id: 'local-session',
        is_guest: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      conversations.unshift(newConversation);
      localStorageService.saveConversations(conversations);
      return newConversation;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    let insertData: any = {
      title: title.substring(0, 100), // Limit title length
    };

    if (user) {
      // Authenticated user
      insertData.user_id = user.id;
      insertData.is_guest = false;
    } else {
      // Guest user
      const guestSessionId = await this.ensureGuestSession();
      insertData.guest_session_id = guestSessionId;
      insertData.is_guest = true;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Migrate guest data to user account when they sign up/in
  async migrateGuestDataToUser(): Promise<void> {
    if (!hasValidSupabaseConfig) {
      return; // No migration needed for local storage
    }
    
    const sessionId = localStorage.getItem('guest-session-id');
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Call the database function to migrate data
    const { error } = await supabase.rpc('migrate_guest_data_to_user', {
      p_session_id: sessionId,
      p_user_id: user.id
    });

    if (error) {
      console.error('Error migrating guest data:', error);
    } else {
      // Clear guest session from localStorage after successful migration
      localStorage.removeItem('guest-session-id');
    }
  },

  // Update conversation title
  async updateConversation(id: string, title: string): Promise<void> {
    if (!hasValidSupabaseConfig) {
      const conversations = localStorageService.getConversations();
      const index = conversations.findIndex(c => c.id === id);
      if (index !== -1) {
        conversations[index].title = title;
        conversations[index].updated_at = new Date().toISOString();
        localStorageService.saveConversations(conversations);
      }
      return;
    }
    
    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // Delete a conversation
  async deleteConversation(id: string): Promise<void> {
    if (!hasValidSupabaseConfig) {
      const conversations = localStorageService.getConversations();
      const filtered = conversations.filter(c => c.id !== id);
      localStorageService.saveConversations(filtered);
      localStorage.removeItem(`travel-messages-${id}`);
      return;
    }
    
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!hasValidSupabaseConfig) {
      return localStorageService.getMessages(conversationId);
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Add a message to a conversation
  async addMessage(conversationId: string, content: string, role: 'user' | 'assistant', metadata?: any): Promise<Message> {
    if (!hasValidSupabaseConfig) {
      const messages = localStorageService.getMessages(conversationId);
      const newMessage: Message = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        content,
        role,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      };
      messages.push(newMessage);
      localStorageService.saveMessages(conversationId, messages);
      return newMessage;
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content,
        role,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Save or update itinerary
  async saveItinerary(conversationId: string, city: string, country: string, days: any[], totalCost: number): Promise<Itinerary> {
    if (!hasValidSupabaseConfig) {
      // For local storage, we'll store itinerary data in the message metadata
      return {
        id: Date.now().toString(),
        conversation_id: conversationId,
        city,
        country,
        days,
        total_cost: totalCost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    // Check if itinerary already exists
    const { data: existing } = await supabase
      .from('itineraries')
      .select('id')
      .eq('conversation_id', conversationId)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing itinerary
      const { data, error } = await supabase
        .from('itineraries')
        .update({
          city,
          country,
          days,
          total_cost: totalCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new itinerary
      const { data, error } = await supabase
        .from('itineraries')
        .insert({
          conversation_id: conversationId,
          city,
          country,
          days,
          total_cost: totalCost
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Get itinerary for a conversation
  async getItinerary(conversationId: string): Promise<Itinerary | null> {
    if (!hasValidSupabaseConfig) {
      return null; // Itinerary data is stored in message metadata for local storage
    }
    
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};
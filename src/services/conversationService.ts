import { supabase, Conversation, Message, Itinerary, GuestSession } from '@/lib/supabase';

export const conversationService = {
  // Create or get guest session
  async ensureGuestSession(): Promise<string> {
    const sessionId = localStorage.getItem('guest-session-id');
    if (!sessionId) {
      throw new Error('No guest session found');
    }

    // Check if guest session exists in database
    const { data: existingSession } = await supabase
      .from('guest_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!existingSession) {
      // Create new guest session
      const { data, error } = await supabase
        .from('guest_sessions')
        .insert({ session_id: sessionId })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    }

    return existingSession.id;
  },

  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
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
    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // Delete a conversation
  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
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
    // Check if itinerary already exists
    const { data: existing } = await supabase
      .from('itineraries')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();

    if (existing) {
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
        .eq('id', existing.id)
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
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};
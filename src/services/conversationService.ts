import { supabase, Conversation, Message, Itinerary } from '@/lib/supabase';

export const conversationService = {
  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
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
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title.substring(0, 100), // Limit title length
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
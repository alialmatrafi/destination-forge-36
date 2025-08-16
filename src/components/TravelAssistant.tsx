import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { TripSuggestions } from "./TripSuggestions";
import { MobileSidebar } from "./MobileSidebar";
import { AuthModal } from "./AuthModal";
import { conversationService } from "@/services/conversationService";
import { generateAIResponse } from "@/services/aiService";
import { toast } from "sonner";
import type { Conversation, Message } from "@/lib/supabase";

export const TravelAssistant = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load conversations when user is authenticated
  useEffect(() => {
    // Always load conversations (for both authenticated users and guests)
    loadConversations();
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
      setShowWelcome(false);
    }
  }, [activeConversation]);

  const loadConversations = async () => {
    try {
      const data = await conversationService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error(t('errors.loadConversations'));
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await conversationService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error(t('errors.loadMessages'));
    }
  };

  const handleNewConversation = async () => {
    // Allow new conversations for both guests and authenticated users
    setActiveConversation(null);
    setMessages([]);
    setShowWelcome(true);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (id: string) => {
    setActiveConversation(id);
    setSidebarOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    // Allow sending messages for both guests and authenticated users
    setLoading(true);
    let conversationId = activeConversation;

    try {
      // Create new conversation if needed
      if (!conversationId) {
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        const newConversation = await conversationService.createConversation(title);
        conversationId = newConversation.id;
        setActiveConversation(conversationId);
        await loadConversations(); // Refresh conversations list
      }

      // Add user message
      const userMessage = await conversationService.addMessage(conversationId, content, 'user');
      setMessages(prev => [...prev, userMessage]);
      setShowWelcome(false);

      // Get conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      const aiResponse = await generateAIResponse({
        message: content,
        conversationHistory
      });

      // Add AI message with itinerary data
      const assistantMessage = await conversationService.addMessage(
        conversationId,
        aiResponse.content,
        'assistant',
        {
          itinerary: aiResponse.itinerary,
          city: aiResponse.city,
          country: aiResponse.country
        }
      );

      setMessages(prev => [...prev, assistantMessage]);

      // Save itinerary if provided
      if (aiResponse.itinerary && aiResponse.city) {
        const totalCost = aiResponse.itinerary.reduce((total, day) => 
          total + day.items.reduce((dayTotal: number, item: any) => dayTotal + item.cost, 0), 0
        );

        await conversationService.saveItinerary(
          conversationId,
          aiResponse.city,
          aiResponse.country || '',
          aiResponse.itinerary,
          totalCost
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t('errors.sendMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditItinerary = async (messageId: string, updatedItinerary: any[]) => {
    if (!activeConversation) return;

    try {
      // Update the message in the UI
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, metadata: { ...msg.metadata, itinerary: updatedItinerary } }
          : msg
      ));

      // Calculate new total cost
      const totalCost = updatedItinerary.reduce((total, day) => 
        total + day.items.reduce((dayTotal: number, item: any) => dayTotal + item.cost, 0), 0
      );

      // Get city info from the message
      const message = messages.find(msg => msg.id === messageId);
      if (message?.metadata?.city) {
        await conversationService.saveItinerary(
          activeConversation,
          message.metadata.city,
          message.metadata.country || '',
          updatedItinerary,
          totalCost
        );
      }

      toast.success(t('success.itineraryUpdated'));
    } catch (error) {
      console.error('Error updating itinerary:', error);
      toast.error(t('errors.updateItinerary'));
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-travel-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? (
        <MobileSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
        />
      ) : (
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        {showWelcome ? (
          <div className="flex-1 flex flex-col min-h-0">
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-foreground">TravelAI</h1>
                <div className="w-10" />
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4 sm:px-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  {t('chat.welcomeTitle')}
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8">
                  {t('chat.welcomeDescription')}
                </p>
                <TripSuggestions onSelectSuggestion={handleSendMessage} />
              </div>
            </div>
            <ChatArea 
              messages={[]} 
              onSendMessage={handleSendMessage} 
              isWelcomeMode={true}
              onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
              loading={loading}
            />
          </div>
        ) : (
          <>
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-foreground">TravelAI</h1>
                <div className="w-10" />
              </div>
            )}
            <ChatArea 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isWelcomeMode={false}
              onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
              onEditItinerary={handleEditItinerary}
              loading={loading}
            />
          </>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};
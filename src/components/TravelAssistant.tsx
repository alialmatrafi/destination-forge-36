import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { MobileSidebar } from "./MobileSidebar";
import { useAuth } from "@/hooks/useAuth";
import { conversationService } from "@/services/conversationService";
import { analyticsService } from "@/services/analyticsService";

export const TravelAssistant = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Set document direction based on language
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    // Add Arabic font class for better rendering
    if (isRTL) {
      document.body.classList.add('arabic-text');
      document.body.style.fontFamily = "'Cairo', 'Amiri', 'Noto Sans Arabic', 'Segoe UI', 'Tahoma', 'Arial', sans-serif";
    } else {
      document.body.classList.remove('arabic-text');
      document.body.style.fontFamily = "";
    }
  }, [i18n.language]);

  useEffect(() => {
    // Load conversations on mount
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    try {
      const convs = await conversationService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await conversationService.createConversation('New Travel Plan');
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setIsMobileMenuOpen(false);
      
      // Track new conversation
      analyticsService.trackConversationStart();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await conversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <div 
      className={`flex h-screen bg-background text-foreground ${
        i18n.language === 'ar' ? 'arabic-text' : ''
      }`} 
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          conversationId={currentConversationId}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onConversationUpdate={loadConversations}
        />
      </div>
    </div>
  );
};
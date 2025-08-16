import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { TripSuggestions } from "./TripSuggestions";
import { MobileSidebar } from "./MobileSidebar";

interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const TravelAssistant = () => {
  const [conversations] = useState<Conversation[]>([
    { id: "1", title: "Tokyo Adventure", date: "2 days ago" },
    { id: "2", title: "Paris Weekend", date: "1 week ago" },
    { id: "3", title: "Bali Retreat", date: "2 weeks ago" },
  ]);

  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowWelcome(true);
    setSidebarOpen(false);
  };

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'll help you plan the perfect trip! Let me create a personalized itinerary based on your preferences.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile ? (
        <MobileSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={setActiveConversation}
          onNewConversation={handleNewConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onConversationSelect={setActiveConversation}
          onNewConversation={handleNewConversation}
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
          />
          </>
        )}
      </div>
    </div>
  );
};
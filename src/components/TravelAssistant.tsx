import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { TripSuggestions } from "./TripSuggestions";

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

  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowWelcome(true);
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
    <div className="flex h-screen bg-background">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onConversationSelect={setActiveConversation}
        onNewConversation={handleNewConversation}
      />
      
      <div className="flex-1 flex flex-col">
        {showWelcome ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-6">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Plan Your Perfect Trip with AI
                </h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Get personalized travel itineraries, recommendations, and expert advice
                </p>
                <TripSuggestions onSelectSuggestion={handleSendMessage} />
              </div>
            </div>
            <ChatArea 
              messages={[]} 
              onSendMessage={handleSendMessage} 
              isWelcomeMode={true}
            />
          </div>
        ) : (
          <ChatArea 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isWelcomeMode={false}
          />
        )}
      </div>
    </div>
  );
};
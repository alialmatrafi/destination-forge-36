import { useState, useEffect, useRef } from "react";
import { Send, Menu, Sparkles, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateAIResponse } from "@/services/aiService";
import { conversationService } from "@/services/conversationService";
import { analyticsService } from "@/services/analyticsService";
import { ItineraryTable } from "./ItineraryTable";
import { VoiceRecordingButton } from "./VoiceRecordingButton";
import { TripSuggestions } from "./TripSuggestions";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  metadata?: any;
  created_at: string;
}

interface ChatAreaProps {
  conversationId: string | null;
  onToggleMobileMenu: () => void;
  onConversationUpdate: () => void;
}

export const ChatArea = ({
  conversationId,
  onToggleMobileMenu,
  onConversationUpdate,
}: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setCurrentItinerary(null);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      const msgs = await conversationService.getMessages(conversationId);
      setMessages(msgs);
      
      // Find the latest itinerary in messages
      const latestItinerary = msgs
        .filter(msg => msg.role === 'assistant' && msg.metadata?.itinerary)
        .pop();
      
      if (latestItinerary?.metadata?.itinerary) {
        setCurrentItinerary(latestItinerary.metadata);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        const newConv = await conversationService.createConversation(
          content.substring(0, 50) + (content.length > 50 ? '...' : '')
        );
        convId = newConv.id;
        onConversationUpdate();
      }

      // Add user message
      const userMessage = await conversationService.addMessage(convId, content, 'user');
      setMessages(prev => [...prev, userMessage]);

      // Track message sent
      await analyticsService.trackMessageSent(content);

      // Get AI response
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const aiResponse = await generateAIResponse({
        message: content,
        conversationHistory
      });

      const responseTime = Date.now() - startTime;

      // Add assistant message
      const assistantMessage = await conversationService.addMessage(
        convId,
        aiResponse.content,
        'assistant',
        {
          itinerary: aiResponse.itinerary,
          city: aiResponse.city,
          country: aiResponse.country
        }
      );

      setMessages(prev => [...prev, assistantMessage]);

      // Update current itinerary if provided
      if (aiResponse.itinerary) {
        setCurrentItinerary({
          itinerary: aiResponse.itinerary,
          city: aiResponse.city,
          country: aiResponse.country
        });

        // Save itinerary to database
        if (aiResponse.city && aiResponse.country) {
          const totalCost = aiResponse.itinerary.reduce((total: number, day: any) => 
            total + day.items.reduce((dayTotal: number, item: any) => dayTotal + (item.cost || 0), 0), 0
          );

          await conversationService.saveItinerary(
            convId,
            aiResponse.city,
            aiResponse.country,
            aiResponse.itinerary,
            totalCost
          );
        }

        // Track successful itinerary generation
        await analyticsService.trackItineraryGenerated(
          aiResponse.city || 'Unknown',
          aiResponse.itinerary.length,
          true,
          responseTime
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Track failed generation
      await analyticsService.trackItineraryGenerated(
        'Unknown',
        0,
        false,
        Date.now() - startTime
      );
    } finally {
      setIsLoading(false);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleItineraryEdit = (updatedItinerary: any[]) => {
    if (currentItinerary) {
      setCurrentItinerary({
        ...currentItinerary,
        itinerary: updatedItinerary
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card [dir='rtl'] &:flex-row-reverse">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMobileMenu}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">TravelAI</h1>
        </div>
        
        <div className="w-10 md:hidden" /> {/* Spacer for mobile */}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-8">
                <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {t('chat.welcomeTitle')}
                </h2>
                <p className="text-muted-foreground">
                  {t('chat.welcomeDescription')}
                </p>
              </div>
              
              <TripSuggestions onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  <div
                    className={`chat-message-container ${message.role} ${
                      message.role === 'user' 
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground chat-user-message'
                          : 'bg-muted chat-assistant-message'
                      }`}
                    >
                      <div className="whitespace-pre-wrap mixed-content">{message.content}</div>
                    </div>
                  </div>
                  
                  {/* Show itinerary if available */}
                  {message.role === 'assistant' && message.metadata?.itinerary && (
                    <div className="mt-4">
                      <ItineraryTable
                        itinerary={message.metadata.itinerary}
                        city={message.metadata.city}
                        onEdit={handleItineraryEdit}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show current itinerary if available */}
              {currentItinerary?.itinerary && (
                <div className="mt-4">
                  <ItineraryTable
                    itinerary={currentItinerary.itinerary}
                    city={currentItinerary.city}
                    onEdit={handleItineraryEdit}
                  />
                </div>
              )}
            </>
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span>{t('common.thinking')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  messages.length === 0
                    ? t('chat.inputPlaceholder')
                    : t('chat.inputPlaceholderChat')
                }
                className="min-h-[60px] max-h-[120px] resize-none pr-12 [dir='rtl'] &:pl-12 [dir='rtl'] &:pr-3 form-rtl"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 [dir='rtl'] &:left-2 [dir='rtl'] &:right-auto">
                <VoiceRecordingButton
                  onTranscript={handleVoiceTranscript}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="h-[60px] px-6 btn-with-icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('chat.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};
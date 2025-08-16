import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecordingButton } from "./VoiceRecordingButton";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isWelcomeMode: boolean;
  onMenuClick?: () => void;
  onEditItinerary?: (messageId: string, itinerary: any[]) => void;
  loading?: boolean;
}

export const ChatArea = ({ messages, onSendMessage, isWelcomeMode, onMenuClick, onEditItinerary, loading }: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(prev => {
      // Add space before new transcript if there's existing text
      const separator = prev.trim() ? ' ' : '';
      return prev + separator + transcript;
    });
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      // Focus the textarea so user can edit
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
              onEditItinerary={onEditItinerary ? (itinerary) => onEditItinerary(message.id, itinerary) : undefined}
            />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="bg-chat-assistant rounded-2xl px-4 py-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-travel-blue"></div>
                    <span className="text-sm text-muted-foreground">{t('chat.thinking')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isWelcomeMode ? t('chat.inputPlaceholder') : t('chat.inputPlaceholderChat')}
                className="min-h-[44px] sm:min-h-[48px] max-h-[150px] sm:max-h-[200px] resize-none pr-12 bg-card border-input focus:ring-travel-blue text-sm sm:text-base"
                rows={1}
              />
              <div className="absolute right-2 top-2">
                <VoiceRecordingButton 
                  onTranscript={handleVoiceTranscript}
                  disabled={false}
                />
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-travel-blue hover:bg-travel-blue-dark text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
          <Send className="w-4 h-4" />
          <span className="sr-only">{t('chat.sendMessage')}</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {t('chat.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
};
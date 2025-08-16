import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./MessageBubble";

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
}

export const ChatArea = ({ messages, onSendMessage, isWelcomeMode }: ChatAreaProps) => {
  const [input, setInput] = useState("");
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isWelcomeMode ? "Ask me anything about your travel plans..." : "Type your message..."}
                className="min-h-[48px] max-h-[200px] resize-none pr-12 bg-card border-input focus:ring-travel-blue"
                rows={1}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 p-2 hover:bg-accent"
              >
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-travel-blue hover:bg-travel-blue-dark text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
          <Send className="w-4 h-4" />
          <span className="sr-only">Send message</span>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            TravelAI may produce inaccurate information. Verify details before booking.
          </div>
        </div>
      </div>
    </div>
  );
};
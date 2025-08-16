import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User } from "lucide-react";
import { ItineraryTable } from "./ItineraryTable";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.type === "user";
  
  // Check if the message contains an itinerary (simple check for demo)
  const hasItinerary = message.content.includes("itinerary") && !isUser;

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[85%] sm:max-w-2xl ${isUser ? "order-1" : ""}`}>
        <div
          className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-soft ${
            isUser
              ? "bg-chat-user text-white ml-auto"
              : "bg-chat-assistant text-foreground"
          }`}
        >
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        
        {hasItinerary && (
          <div className="mt-3 sm:mt-4">
            <ItineraryTable />
          </div>
        )}
        
        <div className={`text-xs text-muted-foreground mt-1 px-1 ${isUser ? "text-right" : ""}`}>
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};
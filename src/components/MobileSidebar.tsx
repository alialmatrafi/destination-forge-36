import { X, Plus, Search, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "./LanguageSelector";

interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface MobileSidebarProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({
  conversations,
  activeConversation,
  onConversationSelect,
  onNewConversation,
  isOpen,
  onClose,
}: MobileSidebarProps) => {
  const { t } = useTranslation();

  const handleConversationSelect = (id: string) => {
    onConversationSelect(id);
    onClose();
  };

  const handleNewConversation = () => {
    onNewConversation();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h1 className="font-semibold text-foreground">{t('sidebar.title')}</h1>
              </div>
              <div className="flex gap-1">
                <LanguageSelector />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewConversation}
                  className="p-2 hover:bg-accent"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('sidebar.searchPlaceholder')}
                className="pl-9 bg-background border-input"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg mb-1 transition-colors",
                    "hover:bg-accent",
                    activeConversation === conversation.id
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  <div className="font-medium text-sm truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {conversation.date}
                  </div>
                </button>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center text-muted-foreground text-sm mt-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('sidebar.noConversations')}</p>
                  <p className="text-xs mt-1">{t('sidebar.startFirst')}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">G</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{t('sidebar.guestUser')}</div>
                <div className="text-xs text-muted-foreground">{t('sidebar.signInToSave')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
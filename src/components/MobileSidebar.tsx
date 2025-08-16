import { X, Plus, Search, MessageSquare, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "./LanguageSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  user: User | null;
  onAuthClick: () => void;
  onDeleteConversation?: (id: string) => void;
}

export const MobileSidebar = ({
  conversations,
  activeConversation,
  onConversationSelect,
  onNewConversation,
  isOpen,
  onClose,
  user,
  onAuthClick,
  onDeleteConversation,
}: MobileSidebarProps) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleConversationSelect = (id: string) => {
    onConversationSelect(id);
    onClose();
  };

  const handleNewConversation = () => {
    onNewConversation();
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete && onDeleteConversation) {
      onDeleteConversation(conversationToDelete);
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
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
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-foreground">{t('sidebar.title')}</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                    Beta
                  </span>
                </div>
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
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative w-full text-left p-3 rounded-lg mb-1 transition-colors cursor-pointer",
                    "hover:bg-accent",
                    activeConversation === conversation.id
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="font-medium text-sm truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {conversation.date}
                  </div>
                  
                  {/* Delete button - shows on hover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => handleDeleteClick(conversation.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
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
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.full_name || t('sidebar.user')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs"
                >
                  {t('auth.signOut')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">G</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t('sidebar.guestUser')}</div>
                  <button 
                    onClick={onAuthClick}
                    className="text-xs text-travel-blue hover:underline"
                  >
                    {t('sidebar.signInToSave')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المحادثة</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};
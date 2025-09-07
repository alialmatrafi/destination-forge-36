import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const MobileSidebar = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: MobileSidebarProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 w-80">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={() => {
            onNewConversation();
            onClose();
          }}
          onSelectConversation={(id) => {
            onSelectConversation(id);
            onClose();
          }}
          onDeleteConversation={onDeleteConversation}
        />
      </SheetContent>
    </Sheet>
  );
};
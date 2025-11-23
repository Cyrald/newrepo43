import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportChatWidget } from "@/components/support-chat-widget"
import { useChatStore } from "@/stores/chatStore"
import { useAuthStore } from "@/stores/authStore"

export function SupportChatLauncher() {
  const isOpen = useChatStore((state) => state.isOpen)
  const openChat = useChatStore((state) => state.openChat)
  const closeChat = useChatStore((state) => state.closeChat)
  const user = useAuthStore((state) => state.user)
  
  const hasStaffRole = user?.roles && user.roles.some(role => 
    ['admin', 'marketer', 'consultant'].includes(role)
  )

  if (!user || hasStaffRole) {
    return null
  }

  return (
    <>
      {/* Floating Chat Button - Only show when chat is closed */}
      {!isOpen && (
        <Button
          onClick={openChat}
          size="icon"
          className="!fixed bottom-6 right-6 h-[52px] w-[52px] rounded-full shadow-lg hover:shadow-xl transition-all !z-[9999] bg-primary hover:bg-primary/90 animate-in fade-in zoom-in-75 duration-300"
          aria-label="Открыть чат поддержки"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      )}

      {/* Chat Widget - Only show when chat is open */}
      {isOpen && (
        <SupportChatWidget isOpen={isOpen} onClose={closeChat} />
      )}
    </>
  )
}

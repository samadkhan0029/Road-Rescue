import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { useChatUnreadIndicator } from '../hooks/useChatUnreadIndicator';

const ChatPanelToggle = ({
  requestId,
  currentUserId,
  peerName,
  authToken,
  buttonLabel,
  theme = 'light',
}) => {
  const [open, setOpen] = useState(false);
  const hasUnread = useChatUnreadIndicator({
    requestId,
    authToken,
    currentUserId,
    chatOpen: open,
  });

  const rid = requestId != null ? String(requestId).trim() : '';
  if (!rid || !authToken || !currentUserId) {
    return null;
  }

  const displayName = (peerName && String(peerName).trim()) || 'Contact';

  const buttonBase =
    theme === 'dark'
      ? 'relative w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors'
      : 'relative w-full mt-3 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonBase}
        aria-expanded={open}
      >
        <MessageCircle size={18} aria-hidden />
        {open ? 'Hide messages' : buttonLabel}
        {!open && hasUnread ? (
          <span
            className="absolute top-2 right-4 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white"
            aria-label="New message"
          />
        ) : null}
      </button>

      {open ? (
        <div className={theme === 'dark' ? 'mt-3 rounded-2xl overflow-hidden' : 'mt-3'}>
          <ChatWindow
            requestId={rid}
            currentUserId={currentUserId}
            peerName={displayName}
            authToken={authToken}
            theme={theme}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ChatPanelToggle;

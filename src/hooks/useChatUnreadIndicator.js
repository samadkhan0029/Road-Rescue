import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config/api';

/**
 * Polls chat only while the panel is closed. Sets hasUnread when the latest message
 * is new and from the other party. Re-baselines when the panel closes so we do not
 * flash a dot after the user has already read messages while open.
 */
export function useChatUnreadIndicator({ requestId, authToken, currentUserId, chatOpen }) {
  const [hasUnread, setHasUnread] = useState(false);
  const baselineRef = useRef(null);
  const initializedRef = useRef(false);
  const prevOpenRef = useRef(chatOpen);
  const uid = currentUserId?.toString?.() ?? '';
  const rid = requestId != null ? String(requestId).trim() : '';

  useEffect(() => {
    if (chatOpen) {
      setHasUnread(false);
    }
    if (prevOpenRef.current && !chatOpen) {
      initializedRef.current = false;
      baselineRef.current = null;
    }
    prevOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    if (!rid || !authToken || !uid) {
      baselineRef.current = null;
      initializedRef.current = false;
      return undefined;
    }

    if (chatOpen) {
      return undefined;
    }

    const poll = async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${rid}`), {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !Array.isArray(data.messages)) {
          return;
        }

        const msgs = data.messages;
        const last = msgs[msgs.length - 1];
        const lastId = last?._id != null ? String(last._id) : null;

        if (!lastId) {
          if (msgs.length === 0) {
            initializedRef.current = true;
          }
          return;
        }

        if (!initializedRef.current) {
          baselineRef.current = lastId;
          initializedRef.current = true;
          return;
        }

        if (baselineRef.current !== lastId && last.senderId !== uid) {
          setHasUnread(true);
        }

        if (last.senderId === uid) {
          baselineRef.current = lastId;
        }
      } catch {
        /* ignore */
      }
    };

    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [rid, authToken, uid, chatOpen]);

  return hasUnread;
}

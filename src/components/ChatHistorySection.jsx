import React, { useCallback, useEffect, useState } from 'react';
import { MessageCircle, X, MapPin, Loader2 } from 'lucide-react';
import { apiUrl } from '../config/api';
import ChatWindow, { formatChatListTimestamp } from './ChatWindow';

const ChatHistorySection = ({
  userId,
  authToken,
  emptyHint = 'When you message a provider or customer, threads appear here.',
  readOnly = true,
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    if (!userId || !authToken) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/chat/history/${userId}`), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-600">
        <Loader2 className="animate-spin w-5 h-5" />
        Loading conversations…
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-medium">{emptyHint}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {conversations.map((c) => (
          <button
            key={String(c.requestId)}
            type="button"
            onClick={() => setOpen(c)}
            className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-bold text-slate-900">{c.otherUserName}</p>
                <p className="text-sm text-slate-600 mt-1 flex items-start gap-1">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{c.serviceType} · {c.locationName}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-slate-400 block">
                  {formatChatListTimestamp(c.lastMessageAt)}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase mt-1 inline-block px-2 py-0.5 rounded ${
                    c.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setOpen(null)}
          />
          <div className="relative bg-[#f8fafc] rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-900">Conversation</h3>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <ChatWindow
              requestId={String(open.requestId)}
              currentUserId={userId}
              peerName={open.otherUserName}
              readOnly={readOnly}
              authToken={authToken}
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ChatHistorySection;

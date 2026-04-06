import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Pencil, Trash2, Loader2 } from 'lucide-react';
import { apiUrl } from '../config/api';

/** Exact wall-clock time on each message, e.g. 10:45 AM */
export const formatChatTimestamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
};

/** Inbox / history row: date + time */
export const formatChatListTimestamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
};

const chatErrorMessage = async (res, data) => {
  const msg = data?.error || data?.message;
  if (msg) return msg;
  if (res.status === 401) return 'Session expired — please log in again.';
  if (res.status === 403) return 'You are not allowed to access this chat.';
  if (res.status === 404) return 'Request not found.';
  return `Request failed (${res.status})`;
};

const ChatWindow = ({
  requestId,
  currentUserId,
  peerName,
  readOnly = false,
  authToken,
  className = '',
  theme = 'light',
}) => {
  const normalizedRequestId =
    requestId != null && requestId !== '' ? String(requestId).trim() : '';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const listRef = useRef(null);
  const isDark = theme === 'dark';

  const scrollBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!normalizedRequestId || !authToken) {
      setLoadingMessages(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/chat/${normalizedRequestId}`), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.success === false) {
        setError(await chatErrorMessage(res, data));
        setMessages([]);
        return;
      }

      setError(null);
      setMessages(data.messages || []);
    } catch {
      setError('Network error — check that the API server is running.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [normalizedRequestId, authToken]);

  useEffect(() => {
    setLoadingMessages(true);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!normalizedRequestId || !authToken || readOnly) return undefined;
    const t = setInterval(fetchMessages, 2000);
    return () => clearInterval(t);
  }, [normalizedRequestId, authToken, readOnly, fetchMessages]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || readOnly || !authToken) return;

    if (!normalizedRequestId) {
      // eslint-disable-next-line no-console
      console.error('Cannot send message: No active service request found.');
      setError('Cannot send message: No active service request found.');
      return;
    }

    const senderId = currentUserId != null ? String(currentUserId) : '';
    if (!senderId) {
      setError('Cannot send message: Not signed in.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/chat/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          requestId: normalizedRequestId,
          senderId,
          text,
          timestamp: new Date().toISOString(),
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || data.success === false) {
        setError(await chatErrorMessage(res, data));
      } else {
        setInput('');
        fetchMessages();
      }
    } catch {
      setError('Network error while sending.');
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async () => {
    const text = editDraft.trim();
    if (!text || !editingId || !authToken || !normalizedRequestId) return;
    try {
      const res = await fetch(apiUrl(`/api/chat/message/${editingId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (res.ok && data.success) {
        setEditingId(null);
        setEditDraft('');
        fetchMessages();
      } else {
        setError(data.error || data.message || 'Edit failed');
      }
    } catch {
      setError('Edit failed');
    }
  };

  const unsend = async (id) => {
    if (typeof window !== 'undefined' && !window.confirm('Remove this message for everyone?')) return;
    if (!authToken) return;
    try {
      const res = await fetch(apiUrl(`/api/chat/message/${id}/unsend`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (res.ok && data.success) fetchMessages();
      else setError(data.error || data.message || 'Unsend failed');
    } catch {
      setError('Unsend failed');
    }
  };

  const me = currentUserId?.toString();

  const shell = isDark
    ? `border border-slate-600 bg-slate-900 ${className}`
    : `border border-slate-200 bg-white ${className}`;

  const headerRow = isDark
    ? 'px-4 py-3 border-b border-slate-700 bg-slate-800'
    : 'px-4 py-3 border-b border-slate-200 bg-slate-50';

  const titleCls = isDark ? 'font-bold text-white' : 'font-bold text-slate-900';
  const subCls = isDark ? 'text-xs text-slate-400' : 'text-xs text-slate-500';

  return (
    <div className={`flex flex-col rounded-2xl shadow-sm overflow-hidden ${shell}`}>
      <div className={headerRow}>
        <h4 className={titleCls}>{peerName}</h4>
        <p className={subCls}>{readOnly ? 'Past conversation (read-only)' : 'Live chat'}</p>
      </div>

      {error ? (
        <div
          className={`px-4 py-2 text-sm ${
            isDark ? 'bg-amber-900/40 text-amber-100' : 'bg-amber-50 text-amber-900'
          }`}
        >
          {error}
        </div>
      ) : null}

      <div
        ref={listRef}
        className={`flex-1 min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-2 ${
          isDark ? 'bg-slate-900/80' : ''
        }`}
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="animate-spin w-5 h-5" />
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <p className={`text-center text-sm py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {readOnly ? 'No messages in this thread.' : 'No messages yet. Say hello!'}
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === me;
            const showDeleted = m.isDeleted;
            const isEditing = editingId === m._id;

            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : isDark
                        ? 'bg-slate-700 text-slate-100 rounded-bl-md'
                        : 'bg-slate-200 text-slate-900 rounded-bl-md'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full text-slate-900 rounded-lg p-2 text-sm border border-slate-300"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-blue-100 hover:underline"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="text-xs font-bold text-white hover:underline"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`${
                          showDeleted ? 'italic opacity-90' : 'whitespace-pre-wrap break-words'
                        }`}
                      >
                        {showDeleted ? 'This message was deleted' : m.text}
                      </p>
                      <div
                        className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-[10px] ${
                          isMine ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        <span>{formatChatTimestamp(m.createdAt)}</span>
                        {m.isEdited && !showDeleted ? <span>(edited)</span> : null}
                      </div>
                    </>
                  )}
                  {!readOnly && isMine && !showDeleted && !isEditing ? (
                    <div className="mt-1 flex gap-2 justify-end opacity-90">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(m._id);
                          setEditDraft(m.text || '');
                        }}
                        className="p-1 rounded hover:bg-white/20 text-white"
                        aria-label="Edit message"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => unsend(m._id)}
                        className="p-1 rounded hover:bg-white/20 text-white"
                        aria-label="Unsend message"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!readOnly && authToken ? (
        <form
          onSubmit={send}
          className={`p-3 border-t flex gap-2 ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
              isDark
                ? 'bg-slate-900 border-slate-600 text-white placeholder:text-slate-500'
                : 'border-slate-200 text-slate-900'
            }`}
            maxLength={2000}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-xl bg-blue-600 text-white p-2.5 min-w-[44px] disabled:opacity-50 hover:bg-blue-500 transition-colors flex items-center justify-center"
            aria-label="Send"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      ) : null}
    </div>
  );
};

export default ChatWindow;

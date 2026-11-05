import React, { useCallback, useEffect, useRef, useState } from 'react';

const EMOJIS = ['😀', '😂', '❤️', '🔥', '👍', '👎', '😎', '🎮', '👑', '😭', '🎉', '🤝'];

export default function ChatPanel({ socket, gameCode, messages, userId }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [open, setOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const listRef = useRef(null);
  const pickerRef = useRef(null);
  const typingRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const typingTimerRef = useRef(null);
  const remoteTypingTimersRef = useRef(new Map());

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (!typingRef.current) return;
    typingRef.current = false;
    if (socket.connected) socket.emit('chat:typing', { gameCode, isTyping: false });
  }, [socket, gameCode]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      typingRef.current = false;
      clearTimeout(typingTimerRef.current);
      setTypingUsers([]);
    };
    const onChatError = (event) => setError(event?.message || 'Chat could not complete that action.');
    const onChatTyping = (event = {}) => {
      if (!event.userId || String(event.userId) === String(userId)) return;
      const id = String(event.userId);
      const timers = remoteTypingTimersRef.current;
      clearTimeout(timers.get(id));
      timers.delete(id);
      setTypingUsers((current) => {
        const next = current.filter((user) => String(user.userId) !== id);
        return event.isTyping ? [...next, { userId: id, name: event.name || 'A player' }] : next;
      });
      if (event.isTyping) {
        timers.set(id, setTimeout(() => {
          setTypingUsers((current) => current.filter((user) => String(user.userId) !== id));
          timers.delete(id);
        }, 2600));
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:error', onChatError);
    socket.on('chat:typing', onChatTyping);
    return () => {
      stopTyping();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:error', onChatError);
      socket.off('chat:typing', onChatTyping);
      remoteTypingTimersRef.current.forEach(clearTimeout);
      remoteTypingTimersRef.current.clear();
    };
  }, [socket, gameCode, userId, stopTyping]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, typingUsers]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const updateDraft = (value) => {
    setDraft(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    if (!typingRef.current && socket.connected) {
      typingRef.current = true;
      lastTypingEmitRef.current = Date.now();
      socket.emit('chat:typing', { gameCode, isTyping: true });
    } else if (typingRef.current && socket.connected && Date.now() - lastTypingEmitRef.current > 1000) {
      lastTypingEmitRef.current = Date.now();
      socket.emit('chat:typing', { gameCode, isTyping: true });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1200);
  };

  const send = (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    stopTyping();
    const payload = replyTarget
      ? { gameCode, message, replyToMessageId: replyTarget.id, replyToUsername: replyTarget.name, replyToMessage: replyTarget.message }
      : { gameCode, message };
    socket.emit('chat:send', payload, (result) => {
      if (result?.error) setError(result.error);
      else {
        setError('');
        setDraft('');
        setReplyTarget(null);
      }
    });
  };

  const insertEmoji = (emoji) => {
    setDraft((current) => `${current}${emoji}`);
    setPickerOpen(false);
  };

  const typingLabel = typingUsers.length === 1
    ? `${typingUsers[0].name} is typing`
    : typingUsers.length === 2
      ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
      : typingUsers.length > 2
        ? `${typingUsers[0].name}, ${typingUsers[1].name} and ${typingUsers.length - 2} more are typing`
        : '';

  return <section className={`card room-chat ${open ? 'mobile-open' : 'mobile-closed'}`} aria-label="Room chat">
    <div className="chat-heading">
      <div><h2 className="title">Room chat</h2><p className="muted">Messages are visible to everyone in this room.</p></div>
      <div className="chat-heading-actions"><span className="chat-live">{connected ? 'LIVE' : 'OFFLINE'}</span><button className="chat-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? 'Close chat' : `Open chat${messages.length ? ` (${messages.length})` : ''}`}</button></div>
    </div>
    <div className="chat-body">
      <div className="chat-messages" ref={listRef} aria-live="polite" aria-relevant="additions">
        {!messages.length && <p className="chat-empty">No messages yet. Say hello while everyone gets ready.</p>}
        {messages.map((item) => {
          const isMine = String(item.userId) === String(userId);
          const replyLabel = item.replyToUsername ? `Replying to ${item.replyToUsername}` : null;
          return <article className={`chat-message ${isMine ? 'mine' : ''} ${item.replyToMessageId ? 'is-reply' : ''}`} key={item.id}>
            <div className="chat-meta"><strong>{item.name}</strong><time dateTime={item.sentAt}>{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
            {item.replyToMessageId && (
              <button type="button" className="chat-reply-quote" onClick={() => { const target = messages.find((message) => message.id === item.replyToMessageId); if (target) setReplyTarget(target); }}>
                <span className="chat-reply-label">{replyLabel || 'Reply'}</span>
                <span className="chat-reply-message">{item.replyToMessage || 'Original message'}</span>
              </button>
            )}
            <p>{item.message}</p>
            <button className="chat-reply-toggle" type="button" onClick={() => setReplyTarget({ id: item.id, name: item.name, message: item.message })}>Reply</button>
          </article>;
        })}
        {!!typingUsers.length && <div className="chat-typing" role="status" aria-live="polite">
          <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>{typingLabel}</span>
        </div>}
      </div>
      {!connected && <p className="chat-connection" role="status">Connection lost. Reconnecting to room chat…</p>}
      {error && <p className="error chat-error" role="alert">{error}</p>}
      {replyTarget && <div className="chat-reply-preview">
        <div className="chat-reply-header">
          <span>Replying to {replyTarget.name}</span>
          <button type="button" className="chat-reply-cancel" onClick={() => setReplyTarget(null)}>Cancel</button>
        </div>
        <p>{replyTarget.message}</p>
      </div>}
      <form className="chat-form" onSubmit={send}>
        <label className="sr-only" htmlFor={`room-chat-input-${gameCode}`}>Type your message</label>
        <input id={`room-chat-input-${gameCode}`} maxLength={500} value={draft} onChange={(event) => updateDraft(event.target.value)} placeholder={replyTarget ? `Replying to ${replyTarget.name}…` : 'Type your message…'} />
        <div className="emoji-wrapper" ref={pickerRef}>
          <button type="button" className="emoji-button" aria-label="Open emoji picker" onClick={() => setPickerOpen((value) => !value)}>😊</button>
          {pickerOpen && (
            <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
              {EMOJIS.map((emoji) => (
                <button type="button" key={emoji} className="emoji-option" onClick={() => insertEmoji(emoji)}>{emoji}</button>
              ))}
            </div>
          )}
        </div>
        <button disabled={!draft.trim() || !connected}>Send</button>
      </form>
    </div>
  </section>;
}

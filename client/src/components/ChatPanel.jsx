import React, { useEffect, useRef, useState } from 'react';

export default function ChatPanel({ socket, gameCode, messages, userId }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onChatError = (event) => setError(event?.message || 'Chat could not complete that action.');
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:error', onChatError);
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('chat:error', onChatError); };
  }, [socket]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const send = (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    socket.emit('chat:send', { gameCode, message }, (result) => {
      if (result?.error) setError(result.error);
      else { setError(''); setDraft(''); }
    });
  };

  return <section className={`card room-chat ${open ? 'mobile-open' : 'mobile-closed'}`} aria-label="Room chat">
    <div className="chat-heading">
      <div><h2 className="title">Room chat</h2><p className="muted">Messages are visible to everyone in this room.</p></div>
      <div className="chat-heading-actions"><span className="chat-live">{connected ? 'LIVE' : 'OFFLINE'}</span><button className="chat-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? 'Close chat' : `Open chat${messages.length ? ` (${messages.length})` : ''}`}</button></div>
    </div>
    <div className="chat-body">
      <div className="chat-messages" ref={listRef} aria-live="polite" aria-relevant="additions">
        {!messages.length && <p className="chat-empty">No messages yet. Say hello while everyone gets ready.</p>}
        {messages.map((item) => <article className={`chat-message ${String(item.userId) === String(userId) ? 'mine' : ''}`} key={item.id}>
          <div className="chat-meta"><strong>{item.name}</strong><time dateTime={item.sentAt}>{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
          <p>{item.message}</p>
        </article>)}
      </div>
      {!connected && <p className="chat-connection" role="status">Connection lost. Reconnecting to room chat…</p>}
      {error && <p className="error chat-error" role="alert">{error}</p>}
      <form className="chat-form" onSubmit={send}>
        <label className="sr-only" htmlFor={`room-chat-input-${gameCode}`}>Type your message</label>
        <input id={`room-chat-input-${gameCode}`} maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type your message…" />
        <button disabled={!draft.trim() || !connected}>Send</button>
      </form>
    </div>
  </section>;
}

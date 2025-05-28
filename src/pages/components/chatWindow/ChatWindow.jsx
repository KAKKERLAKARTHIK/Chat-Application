// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useGetChatQuery, useSendMessageMutation } from '../api/Contact';
import socket from '../../../socket.js';
import Picker from 'emoji-picker-react';

export default function ChatWindow({ chatId }) {
  const [messages, setMessages]     = useState([]);
  const [draft, setDraft]           = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const scroller                     = useRef(null);

  const user     = useSelector(s => s.auth.user);
  const userId   = user?.id;
  const { data: chat, isLoading } = useGetChatQuery(chatId);
  const [sendMessage]             = useSendMessageMutation();

  // load initial messages
  useEffect(() => {
    if (chat?.messages) {
      setMessages(chat.messages);
    }
  }, [chat]);

  // socket.io subscription
  useEffect(() => {
    socket.connect();
    socket.emit('joinChat', chatId);

    const onNew = msg => {
      if (msg.chatId === chatId) {
        setMessages(m => [...m, msg]);
      }
    };
    socket.on('newMessage', onNew);

    return () => {
      socket.off('newMessage', onNew);
      socket.disconnect();
    };
  }, [chatId]);

  // auto‐scroll on new messages
  useEffect(() => {
    if (scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight;
    }
  }, [messages]);

  const otherUserId = chat?.participants?.find(p => p.id !== userId)?.id;

  const handleSend = async e => {
    e.preventDefault();
    if (!draft.trim()) return;

    await sendMessage({
      senderId:   userId,
      receiverId: otherUserId,
      text:       draft
    }).unwrap();

    setDraft('');
  };

  // ← Correct signature: (emojiData, event)
  const onEmojiClick = (emojiData, _event) => {
    setDraft(d => d + emojiData.emoji);
    setShowPicker(false);
  };

  if (isLoading) return <div>Loading chat…</div>;

  return (
    <div className="d-flex flex-column h-100">
      {/* messages */}
      <div
        ref={scroller}
        className="flex-grow-1 overflow-auto px-3 py-2"
        style={{ background: '#f1f3f5' }}
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`d-flex my-2 ${
              m.senderId === userId ? 'justify-content-end' : 'justify-content-start'
            }`}
          >
            <div
              className={`p-2 rounded ${
                m.senderId === userId ? 'bg-primary text-white' : 'bg-white border'
              }`}
              style={{ maxWidth: '75%' }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* input + emoji */}
      <form
        onSubmit={handleSend}
        className="d-flex align-items-center p-2 border-top"
        style={{ position: 'sticky', bottom: 0, background: '#fff' }}
      >
        <div className="position-relative me-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPicker(v => !v)}
          >
            +
          </button>
          {showPicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '2.5rem',
                left: 0,
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        <input
          type="text"
          className="form-control me-2"
          placeholder="Type a message..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}

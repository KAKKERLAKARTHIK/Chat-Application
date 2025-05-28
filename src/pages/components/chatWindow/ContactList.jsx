// src/components/ContactsList.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetContactsQuery } from '../api/Contact';
import { useSelector } from 'react-redux';

// Static fallback contacts
const fallbackContacts = [
  { id: 1, name: 'Annie Carpenter', avatarUrl: 'https://i.pravatar.cc/150?img=32', lastMessage: 'Did you talk to Mark? 😊', lastMessageTime: '10:37 AM' },
  { id: 2, name: 'Mark Appleyard', avatarUrl: 'https://i.pravatar.cc/150?img=47', lastMessage: 'Lunch tomorrow. I’ll call you', lastMessageTime: '2:31 AM' },
  { id: 3, name: 'Bradley Stokes', avatarUrl: 'https://i.pravatar.cc/150?img=12', lastMessage: 'Sent a photo', lastMessageTime: '2 Dec' },
  { id: 4, name: 'Emilie Wagner', avatarUrl: 'https://i.pravatar.cc/150?img=72', lastMessage: 'You’re there in 10 min', lastMessageTime: '1 Dec' },
  { id: 5, name: 'Lewis Butler', avatarUrl: 'https://i.pravatar.cc/150?img=5', lastMessage: '👍', lastMessageTime: '28 Nov' },
];

export default function ContactsList({ selectedId, onSelect }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('chat_app_session') ? JSON.parse(localStorage.getItem('chat_app_session')).user.id : null;
  const selectedUserId = useSelector(state => state.auth.user?.id);
  const {
    data: contactsList = [],
    isLoading,
    isError
  } = useGetContactsQuery(userId ?? skipToken, { skip: !userId });
  useEffect(() => {
     
 if(contactsList.length) {
      setContacts(contactsList);
    }
    if (isLoading) {
      setLoading(true);
    }
    if (isError) {
      setError('Failed to load contacts');
    }
    
  }, [contactsList,userId]);
  const handleGetContacts = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/contacts`);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setContacts(data.length ? data : fallbackContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }
  if (isLoading) {
    return <div className="p-3">Loading contacts...</div>;
  }
  if (error) {
    return <div className="p-3 text-danger">{error}</div>;
  }

  return (
    <div className="d-flex flex-column h-100 bg-light">
      <div className="p-3 border-bottom">
        <strong>Chats</strong>
      </div>
      <div className="flex-grow-1 overflow-auto">
        {contacts.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.chatId)}
            className={`d-flex align-items-center w-100 p-2 border-0 text-start ${c.chatId === selectedId ? 'bg-white' : 'bg-transparent'}`}
          >
            <img
              src={c.avatarUrl}
              alt={c.name}
              className="rounded-circle me-2"
              width="40"
              height="40"
            />
            <div className="flex-grow-1">
              <div className="fw-semibold">{c.name}</div>
              <small className="text-muted">{c.lastMessage}</small>
            </div>
            <small className="text-muted ms-2">{c.lastMessageTime}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

ContactsList.propTypes = {
  selectedId: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
};

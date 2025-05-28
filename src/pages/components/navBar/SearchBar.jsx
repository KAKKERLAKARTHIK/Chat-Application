// src/components/ContactSearch.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import { useAddConatactMutation } from '../api/Contact';

/**
 * ContactSearch
 * Renders a search input that debounces user typing,
 * fetches matching users by email, and notifies parent
 * when a suggestion is selected.
 */
export default function ContactSearch({ userId, onAddContact }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const userId1 = localStorage.getItem('chat_app_session') ? JSON.parse(localStorage.getItem('chat_app_session')).user.id : null;
  const [addContact] =useAddConatactMutation()
  const fetchSuggestions = useCallback(
    debounce(async(q) => {
      let res = await fetch(`http://localhost:3000/api/users/search?query=${encodeURIComponent(q)}&exclude=${1}`)
       if(!res.ok) {
          setError('Failed to fetch suggestions');
          return;
        }
        const data = await res.json();
        debugger
        if (data.length === 0) {
          setError('No users found');
        }else if(data.length > 0) setSuggestions(data);
         else {
          setError(null);
        }
    }, 300),
    [userId]
  );

  async function handleAddContact(user, setContacts =()=>{},  ) {
    try {
      debugger
      const res = await addContact({
        contactId: user.id,
        userId: userId1,
      })
      // Corrected single fetch call (no nested fetch)
      // const res = await fetch(
      //   `http://localhost:3000/api/users/${currentUserId}/contacts`,
      //   {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ contactId: user.id })
      //   }
      // );
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Add contact failed: ${res.status} ${errorBody}`);
      }
      const newContact = await res.json();
      // Prepend the new contact to existing state
      setContacts(prev => [newContact, ...prev]);
    } catch (err) {
      console.error('Error adding contact:', err);
      // Optionally show user feedback here
    }
  }
  const handleChange = e => {
    const q = e.target.value;
    setQuery(q);
    setSuggestions([]);
    if (q.length > 2) {
      fetchSuggestions(q);
    }
  };

  return (
    <div className="position-relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search by email..."
        className="form-control"
      />
      {error && <div className="text-danger small mt-1">{error}</div>}
      {suggestions.length > 0 && (
        <ul className="list-group position-absolute w-100 mt-1">
          {suggestions.map(u => (
            <li
              key={u.id}
              className="list-group-item list-group-item-action"
              onClick={() => {
                handleAddContact(u);
                setQuery('');
                setSuggestions([]);
              }}
            >
              {u.email} — {u.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ContactSearch.propTypes = {
  userId: PropTypes.number.isRequired,
  onAddContact: PropTypes.func.isRequired,
};

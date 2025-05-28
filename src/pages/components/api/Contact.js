// src/services/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const contactsApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/' }),
  tagTypes: ['Contacts', 'Chat'],
  endpoints: builder => ({
    // ── CONTACTS ───────────────────────────────────────────────────────────
        getContacts: builder.query({
      query: userId => `chats/user/${userId}`,
      // option: rename/reshape fields if you like
      transformResponse: (res) =>
        res.map(c => ({
          chatId:          c.chatId,
          id:              c.participantId,
          name:            c.participantName,
          avatarUrl:       c.avatarUrl,
          statusMessage:   c.statusMessage,
          lastSeen:        c.lastSeen,
          lastMessage:     c.lastMessage,
          lastMessageTime: c.lastMessageTime,
        }))
    }),
    addConatact: builder.mutation({
      query: ({ userId, contactId }) => ({
        url: `users/${userId}/contacts`,
        method: 'POST',
        body: { contactId },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'Contacts', id: `LIST-${userId}` },
      ],
    }),

    // ── AUTH ────────────────────────────────────────────────────────────────
    signUp: builder.mutation({
      query: formData => ({ url: 'users', method: 'POST', body: formData }),
    }),
    login: builder.mutation({
      query: credentials => ({ url: 'users/login', method: 'POST', body: credentials }),
    }),

    // ── USER SEARCH ─────────────────────────────────────────────────────────
    searchUsers: builder.query({
      query: ({ userId, query }) => `users/search?query=${query}&exclude=${userId}`,
    }),

    // ── CHAT DETAIL ─────────────────────────────────────────────────────────
    getChat: builder.query({
      query: chatId => `chats/${chatId}`,
      providesTags: (result, error, chatId) => [{ type: 'Chat', id: chatId }],
    }),
    sendMessage: builder.mutation({
    query: ({ senderId, receiverId, text }) => ({
        url: 'chats/message',
        method: 'POST',
        body: { senderId, receiverId, text },
      }),
      invalidatesTags: (result, error, { chatId }) => [{ type: 'Chat', id: chatId }],
    }),
  }),
})

export const {
  useGetContactsQuery,
  useAddConatactMutation,
  useSignUpMutation,
  useLoginMutation,
  useSearchUsersQuery,
  useGetChatQuery,
  useSendMessageMutation,
} = contactsApi

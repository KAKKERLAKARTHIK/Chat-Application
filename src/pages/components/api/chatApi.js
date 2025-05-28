import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const chatsApi = createApi({
  reducerPath: 'chatsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api/' }),
  tagTypes: ['ChatList', 'ChatDetail'],
  endpoints: builder => ({
    // List of chats for a user
    getUserChats: builder.query({
      query: userId => `chats/user/${userId}`,
      providesTags: (result, error, userId) =>
        result
          ? [
              ...result.map(chat => ({ type: 'ChatList', id: chat.chatId })),
              { type: 'ChatList', id: 'LIST' }
            ]
          : [{ type: 'ChatList', id: 'LIST' }]
    }),
    // Chat details
    getChat: builder.query({
      query: chatId => `chats/${chatId}`,
      providesTags: (result, error, chatId) => [{ type: 'ChatDetail', id: chatId }]
    }),
    // Send a message
    sendMessage: builder.mutation({
      query: ({ chatId, senderId, text }) => ({
        url: `chats/${chatId}/messages`,
        method: 'POST',
        body: { senderId, text }
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: 'ChatDetail', id: chatId },
        { type: 'ChatList', id: 'LIST' }
      ]
    }),
    // Create a new chat
    createChat: builder.mutation({
      query: participantIds => ({
        url: 'chats',
        method: 'POST',
        body: { participantIds }
      }),
      invalidatesTags: [{ type: 'ChatList', id: 'LIST' }]
    })
  })
})

export const {
  useGetUserChatsQuery,
  useGetChatQuery,
  useSendMessageMutation,
  useCreateChatMutation
} = chatsApi
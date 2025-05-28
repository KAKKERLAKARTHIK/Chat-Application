// src/store.js
import { configureStore } from '@reduxjs/toolkit'
import { contactsApi }    from './pages/components/api/Contact'
import authReducer        from './pages/components/slice/Auth'
import { chatsApi } from './pages/components/api/chatApi'

export const store = configureStore({
    reducer: {
      [contactsApi.reducerPath]: contactsApi.reducer,
      [chatsApi.reducerPath]: chatsApi.reducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(contactsApi.middleware)
        .concat(chatsApi.middleware),
  })
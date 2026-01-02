const AUTH_API = 'https://functions.poehali.dev/4aa60634-47bb-4a9d-aa67-3ad18a689f78';
const MESSAGES_API = 'https://functions.poehali.dev/f2d7d71b-8934-4cf3-9855-84ac2ea6c73d';

const TOKEN_KEY = 'messenger_auth_token';

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

export interface Chat {
  id: number;
  user: {
    id: number;
    username: string;
    name: string;
    avatar: string;
    online: boolean;
  };
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

export interface Contact {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  online: boolean;
}

export interface SearchUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  isContact: boolean;
}

export const auth = {
  async register(username: string, email: string, password: string, display_name: string) {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', username, email, password, display_name })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async login(username: string, password: string) {
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async verify() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('No token');
    
    const response = await fetch(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token })
    });
    const data = await response.json();
    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error(data.error || 'Verification failed');
    }
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
};

export const messages = {
  async getChats(): Promise<Chat[]> {
    const token = auth.getToken();
    const response = await fetch(`${MESSAGES_API}?action=chats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get chats');
    return data.chats;
  },

  async getMessages(chatId: number): Promise<Message[]> {
    const token = auth.getToken();
    const response = await fetch(`${MESSAGES_API}?action=messages&chat_id=${chatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get messages');
    return data.messages;
  },

  async sendMessage(chatId: number, text: string): Promise<Message> {
    const token = auth.getToken();
    const response = await fetch(MESSAGES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'send', chat_id: chatId, text })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data.message;
  },

  async getContacts(): Promise<Contact[]> {
    const token = auth.getToken();
    const response = await fetch(`${MESSAGES_API}?action=contacts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get contacts');
    return data.contacts;
  },

  async searchUsers(query: string): Promise<SearchUser[]> {
    const token = auth.getToken();
    const response = await fetch(`${MESSAGES_API}?action=search&query=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to search users');
    return data.users;
  },

  async addContact(username: string) {
    const token = auth.getToken();
    const response = await fetch(MESSAGES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'add_contact', username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add contact');
    return data;
  },

  async createChat(contactId: number): Promise<number> {
    const token = auth.getToken();
    const response = await fetch(MESSAGES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'create_chat', contact_id: contactId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create chat');
    return data.chat_id;
  }
};

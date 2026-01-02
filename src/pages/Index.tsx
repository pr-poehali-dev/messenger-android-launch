import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { auth, messages as messagesApi, User, Chat, Message, Contact, SearchUser } from '@/lib/api';
import { AuthScreen } from '@/components/messenger/AuthScreen';
import { ChatSection } from '@/components/messenger/ChatSection';
import { ContactsSection } from '@/components/messenger/ContactsSection';
import { ProfileSection } from '@/components/messenger/ProfileSection';

type Section = 'chats' | 'channels' | 'contacts' | 'profile' | 'support';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSection, setActiveSection] = useState<Section>('chats');
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
      loadContacts();
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat]);

  const checkAuth = async () => {
    try {
      const data = await auth.verify();
      setUser(data.user);
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const data = await auth.login(username, password);
      setUser(data.user);
      toast({ title: 'Добро пожаловать!', description: `Привет, ${data.user.display_name}!` });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleRegister = async (username: string, email: string, password: string, displayName: string) => {
    try {
      const data = await auth.register(username, email, password, displayName);
      setUser(data.user);
      toast({ title: 'Регистрация успешна!', description: 'Добро пожаловать в мессенджер!' });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    setChats([]);
    setContacts([]);
    setActiveChat(null);
    setMessages([]);
  };

  const loadChats = async () => {
    const data = await messagesApi.getChats();
    setChats(data);
  };

  const loadContacts = async () => {
    const data = await messagesApi.getContacts();
    setContacts(data);
  };

  const loadMessages = async (chatId: number) => {
    const data = await messagesApi.getMessages(chatId);
    setMessages(data);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChat) return;
    
    try {
      const message = await messagesApi.sendMessage(activeChat.id, text);
      setMessages([...messages, message]);
      loadChats();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleSearchUsers = async (query: string): Promise<SearchUser[]> => {
    if (!query.trim()) return [];
    return await messagesApi.searchUsers(query);
  };

  const handleAddContact = async (username: string) => {
    try {
      await messagesApi.addContact(username);
      toast({ title: 'Успешно!', description: 'Контакт добавлен' });
      loadContacts();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleStartChat = async (contactId: number) => {
    try {
      const chatId = await messagesApi.createChat(contactId);
      await loadChats();
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setActiveChat(chat);
        setActiveSection('chats');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 space-y-8">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center cursor-pointer hover-lift">
          <Icon name="MessageCircle" size={24} className="text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-4">
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 rounded-xl transition-all ${activeSection === 'chats' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
            onClick={() => setActiveSection('chats')}
          >
            <Icon name="MessageSquare" size={22} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 rounded-xl transition-all ${activeSection === 'contacts' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
            onClick={() => setActiveSection('contacts')}
          >
            <Icon name="Users" size={22} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`w-12 h-12 rounded-xl transition-all ${activeSection === 'profile' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
            onClick={() => setActiveSection('profile')}
          >
            <Icon name="User" size={22} />
          </Button>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <Icon name="LogOut" size={22} />
        </Button>
      </aside>

      {activeSection === 'chats' && (
        <ChatSection
          chats={chats}
          activeChat={activeChat}
          messages={messages}
          onChatSelect={setActiveChat}
          onSendMessage={handleSendMessage}
          getInitials={getInitials}
        />
      )}

      {activeSection === 'contacts' && (
        <ContactsSection
          contacts={contacts}
          onAddContact={handleAddContact}
          onStartChat={handleStartChat}
          onSearchUsers={handleSearchUsers}
          getInitials={getInitials}
        />
      )}

      {activeSection === 'profile' && (
        <ProfileSection
          user={user}
          onLogout={handleLogout}
          getInitials={getInitials}
        />
      )}
    </div>
  );
}

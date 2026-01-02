import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { auth, messages as messagesApi, User, Chat, Message, Contact, SearchUser } from '@/lib/api';

type Section = 'chats' | 'channels' | 'contacts' | 'profile' | 'support';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register'>('login');
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activeSection, setActiveSection] = useState<Section>('chats');
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  
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

  useEffect(() => {
    if (activeSection === 'contacts' && searchQuery) {
      const timer = setTimeout(() => searchUsers(), 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeSection]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await auth.login(loginUsername, loginPassword);
      setUser(data.user);
      toast({ title: 'Добро пожаловать!', description: `Привет, ${data.user.display_name}!` });
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await auth.register(regUsername, regEmail, regPassword, regDisplayName);
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
    try {
      const data = await messagesApi.getChats();
      setChats(data);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const loadContacts = async () => {
    try {
      const data = await messagesApi.getContacts();
      setContacts(data);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const data = await messagesApi.getMessages(chatId);
      setMessages(data);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    
    try {
      const message = await messagesApi.sendMessage(activeChat.id, messageText);
      setMessages([...messages, message]);
      setMessageText('');
      loadChats();
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const data = await messagesApi.searchUsers(searchQuery);
      setSearchResults(data);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddContact = async (username: string) => {
    try {
      await messagesApi.addContact(username);
      toast({ title: 'Успешно!', description: 'Контакт добавлен' });
      loadContacts();
      setSearchResults([]);
      setSearchQuery('');
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
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Icon name="MessageCircle" size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Мессенджер</h1>
            <p className="text-muted-foreground">Общайтесь с друзьями и коллегами</p>
          </div>

          {isAuthMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  placeholder="Username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">
                Войти
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => setIsAuthMode('register')}
                  className="text-primary hover:underline"
                >
                  Регистрация
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Input
                  placeholder="Username (3-20 символов)"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Отображаемое имя"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Пароль (минимум 6 символов)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="bg-input"
                  required
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">
                Зарегистрироваться
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={() => setIsAuthMode('login')}
                  className="text-primary hover:underline"
                >
                  Войти
                </button>
              </p>
            </form>
          )}
        </Card>
      </div>
    );
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
        <>
          <div className="w-80 bg-card border-r border-border flex flex-col animate-fade-in">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold mb-4">Чаты</h2>
              <div className="relative">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  className="pl-10 bg-input border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Нет активных чатов</p>
                  <p className="text-sm mt-2">Добавьте контакты, чтобы начать общение</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-muted group ${
                        activeChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setActiveChat(chat)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={chat.user.avatar} />
                            <AvatarFallback className="gradient-primary text-white font-semibold">
                              {getInitials(chat.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {chat.user.online && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate">{chat.user.name}</h3>
                            <span className="text-xs text-muted-foreground">{chat.time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                            {chat.unread > 0 && (
                              <Badge className="ml-2 bg-primary text-primary-foreground pulse-notification">
                                {chat.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <main className="flex-1 flex flex-col animate-scale-in">
            {activeChat ? (
              <>
                <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={activeChat.user.avatar} />
                      <AvatarFallback className="gradient-primary text-white font-semibold">
                        {getInitials(activeChat.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">{activeChat.user.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {activeChat.user.online ? 'В сети' : 'Не в сети'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-xl hover-lift">
                      <Icon name="Phone" size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl hover-lift">
                      <Icon name="Video" size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl hover-lift">
                      <Icon name="MoreVertical" size={20} />
                    </Button>
                  </div>
                </header>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-md px-4 py-3 rounded-2xl ${
                            msg.sender === 'me'
                              ? 'gradient-primary text-white rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <span className={`text-xs mt-1 block ${msg.sender === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t border-border p-4 bg-card">
                  <div className="flex items-center space-x-3 max-w-4xl mx-auto">
                    <Button variant="ghost" size="icon" className="rounded-xl hover-lift flex-shrink-0">
                      <Icon name="Paperclip" size={20} />
                    </Button>
                    
                    <Input
                      placeholder="Введите сообщение..."
                      className="flex-1 bg-input border-none rounded-xl"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    
                    <Button variant="ghost" size="icon" className="rounded-xl hover-lift flex-shrink-0">
                      <Icon name="Smile" size={20} />
                    </Button>
                    
                    <Button
                      size="icon"
                      className="gradient-primary rounded-xl hover-lift flex-shrink-0"
                      onClick={handleSendMessage}
                    >
                      <Icon name="Send" size={20} className="text-white" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <div className="w-24 h-24 rounded-full gradient-primary mx-auto mb-6 flex items-center justify-center">
                    <Icon name="MessageCircle" size={48} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Выберите чат</h2>
                  <p className="text-muted-foreground">Начните общение с друзьями и коллегами</p>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {activeSection === 'contacts' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold mb-4">Контакты</h2>
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по username..."
                className="pl-10 bg-input border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            {searchQuery && searchResults.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">РЕЗУЛЬТАТЫ ПОИСКА</h3>
                <div className="grid gap-4">
                  {searchResults.map((user) => (
                    <Card key={user.id} className="p-4 flex items-center justify-between hover-lift">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="gradient-primary text-white font-semibold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          {user.bio && <p className="text-xs text-muted-foreground mt-1">{user.bio}</p>}
                        </div>
                      </div>
                      {user.isContact ? (
                        <Badge variant="secondary">Добавлен</Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="gradient-primary text-white"
                          onClick={() => handleAddContact(user.username)}
                        >
                          Добавить
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">МОИ КОНТАКТЫ</h3>
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Users" size={64} className="mx-auto mb-4 opacity-50" />
                  <p>У вас пока нет контактов</p>
                  <p className="text-sm mt-2">Найдите друзей по username</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="p-4 flex items-center justify-between hover-lift">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback className="gradient-primary text-white font-semibold">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{contact.name}</h3>
                          <p className="text-sm text-muted-foreground">@{contact.username}</p>
                          {contact.bio && <p className="text-xs text-muted-foreground mt-1">{contact.bio}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartChat(contact.id)}
                      >
                        <Icon name="MessageCircle" size={16} className="mr-2" />
                        Написать
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {activeSection === 'profile' && (
        <div className="flex-1 flex items-center justify-center animate-fade-in">
          <Card className="w-full max-w-md p-8">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="gradient-primary text-white text-2xl font-bold">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-1">{user.display_name}</h2>
              <p className="text-muted-foreground mb-2">@{user.username}</p>
              <p className="text-sm text-muted-foreground mb-6">{user.email}</p>
              {user.bio && (
                <p className="text-sm mb-6 p-4 bg-muted rounded-xl">{user.bio}</p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти из аккаунта
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

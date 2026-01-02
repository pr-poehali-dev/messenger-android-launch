import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface Chat {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const mockChats: Chat[] = [
  { id: 1, name: 'Анна Петрова', username: '@anna_p', avatar: '', lastMessage: 'Привет! Как дела?', time: '14:23', unread: 3, online: true },
  { id: 2, name: 'Дизайн Team', username: '@design', avatar: '', lastMessage: 'Отправил новые макеты', time: '13:45', unread: 0, online: false },
  { id: 3, name: 'Максим Иванов', username: '@maxiv', avatar: '', lastMessage: 'Созвон в 15:00?', time: '12:10', unread: 1, online: true },
  { id: 4, name: 'HR Отдел', username: '@hr_team', avatar: '', lastMessage: 'Документы готовы', time: 'Вчера', unread: 0, online: false },
  { id: 5, name: 'Ольга Смирнова', username: '@olga_s', avatar: '', lastMessage: 'Спасибо за помощь!', time: 'Вчера', unread: 0, online: true },
];

const mockMessages: Message[] = [
  { id: 1, text: 'Привет! Как проект продвигается?', sender: 'other', time: '14:20' },
  { id: 2, text: 'Отлично! Уже почти закончил дизайн', sender: 'me', time: '14:21' },
  { id: 3, text: 'Круто! Покажешь скриншоты?', sender: 'other', time: '14:22' },
  { id: 4, text: 'Конечно, сейчас отправлю', sender: 'me', time: '14:23' },
];

export default function Index() {
  const [activeChat, setActiveChat] = useState<Chat | null>(mockChats[0]);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'chats' | 'channels' | 'contacts' | 'profile' | 'support'>('chats');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: messageText, sender: 'me', time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }]);
      setMessageText('');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
            className={`w-12 h-12 rounded-xl transition-all ${activeSection === 'channels' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
            onClick={() => setActiveSection('channels')}
          >
            <Icon name="Radio" size={22} />
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
          className={`w-12 h-12 rounded-xl transition-all ${activeSection === 'support' ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
          onClick={() => setActiveSection('support')}
        >
          <Icon name="HelpCircle" size={22} />
        </Button>
      </aside>

      <div className="w-80 bg-card border-r border-border flex flex-col animate-fade-in">
        <div className="p-4 border-b border-border">
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
          <div className="p-2 space-y-1">
            {mockChats.filter(chat => 
              chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              chat.username.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((chat) => (
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
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="gradient-primary text-white font-semibold">
                        {getInitials(chat.name)}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
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
        </ScrollArea>
      </div>

      <main className="flex-1 flex flex-col animate-scale-in">
        {activeChat ? (
          <>
            <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
              <div className="flex items-center space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activeChat.avatar} />
                  <AvatarFallback className="gradient-primary text-white font-semibold">
                    {getInitials(activeChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{activeChat.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeChat.online ? 'В сети' : 'Не в сети'}
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
    </div>
  );
}

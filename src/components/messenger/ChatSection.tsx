import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Chat, Message } from '@/lib/api';

interface ChatSectionProps {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  onChatSelect: (chat: Chat) => void;
  onSendMessage: (text: string) => Promise<void>;
  getInitials: (name: string) => string;
}

export function ChatSection({
  chats,
  activeChat,
  messages,
  onChatSelect,
  onSendMessage,
  getInitials
}: ChatSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    await onSendMessage(messageText);
    setMessageText('');
  };

  const filteredChats = chats.filter(chat =>
    chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Нет активных чатов</p>
              <p className="text-sm mt-2">Добавьте контакты, чтобы начать общение</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-muted group ${
                    activeChat?.id === chat.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onChatSelect(chat)}
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
  );
}

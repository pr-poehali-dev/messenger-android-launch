import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Contact, SearchUser } from '@/lib/api';

interface ContactsSectionProps {
  contacts: Contact[];
  onAddContact: (username: string) => Promise<void>;
  onStartChat: (contactId: number) => Promise<void>;
  onSearchUsers: (query: string) => Promise<SearchUser[]>;
  getInitials: (name: string) => string;
}

export function ContactsSection({
  contacts,
  onAddContact,
  onStartChat,
  onSearchUsers,
  getInitials
}: ContactsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(async () => {
        const results = await onSearchUsers(searchQuery);
        setSearchResults(results);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAddContact = async (username: string) => {
    await onAddContact(username);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
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
                    onClick={() => onStartChat(contact.id)}
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
  );
}

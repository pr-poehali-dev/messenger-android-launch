import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/lib/api';

interface ProfileSectionProps {
  user: User;
  onLogout: () => void;
  getInitials: (name: string) => string;
}

export function ProfileSection({ user, onLogout, getInitials }: ProfileSectionProps) {
  return (
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
            onClick={onLogout}
          >
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти из аккаунта
          </Button>
        </div>
      </Card>
    </div>
  );
}

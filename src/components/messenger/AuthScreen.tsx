import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, email: string, password: string, displayName: string) => Promise<void>;
}

export function AuthScreen({ onLogin, onRegister }: AuthScreenProps) {
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(loginUsername, loginPassword);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegister(regUsername, regEmail, regPassword, regDisplayName);
  };

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

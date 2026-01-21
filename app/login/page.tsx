'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { mockUsers } from '@/mocks/users';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'NON_ADMIN' | null>(null);
  const { setUser, setRole } = useStore();
  const router = useRouter();

  const handleLogin = () => {
    if (!selectedRole) return;
    
    const user = mockUsers.find(u => u.role === selectedRole);
    if (user) {
      setUser(user);
      setRole(selectedRole);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Lead Management System
          </h1>
          <p className="text-muted-foreground">Sign in to access your dashboard</p>
        </div>
        
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription className="text-base">Select your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant={selectedRole === 'ADMIN' ? 'default' : 'outline'}
                className={selectedRole === 'ADMIN' ? 'w-full h-12 gradient-primary shadow-md hover:shadow-lg transition-all' : 'w-full h-12 border-2 hover:border-primary/50'}
                onClick={() => setSelectedRole('ADMIN')}
              >
                <span className="font-semibold">Administrator</span>
              </Button>
              <Button
                variant={selectedRole === 'NON_ADMIN' ? 'default' : 'outline'}
                className={selectedRole === 'NON_ADMIN' ? 'w-full h-12 gradient-primary shadow-md hover:shadow-lg transition-all' : 'w-full h-12 border-2 hover:border-primary/50'}
                onClick={() => setSelectedRole('NON_ADMIN')}
              >
                <span className="font-semibold">Sales Executive</span>
              </Button>
            </div>
            <Button
              className="w-full h-12 gradient-primary shadow-md hover:shadow-lg transition-all font-semibold text-base"
              onClick={handleLogin}
              disabled={!selectedRole}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

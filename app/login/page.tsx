'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'sales'>('admin');
  const { setUser, setRole, setToken } = useStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://18.61.48.70:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('Login successful', data);
      
      const token = data.token || data.access_token;
      const apiRole = data.role || (data.user && data.user.role);

      // Strict Role Check based on Active Tab
      if (activeTab === 'admin') {
          if (apiRole !== 'ADMIN') {
              throw new Error('Access Denied: This account does not have administrator privileges.');
          }
      } else if (activeTab === 'sales') {
          if (apiRole === 'ADMIN') {
               throw new Error('Access Denied: Administrators must use the Admin Login.');
          }
      }
      
      // Map API role to our Role type
      let userRole: 'ADMIN' | 'NON_ADMIN' = 'ADMIN';
      
      if (apiRole) {
          if (apiRole === 'ADMIN') userRole = 'ADMIN';
          else if (apiRole === 'NON_ADMIN' || apiRole === 'SALES') userRole = 'NON_ADMIN';
      } else {
          // Fallback if no role returned
          userRole = activeTab === 'admin' ? 'ADMIN' : 'NON_ADMIN';
      }

      // Construct user object
      const user = {
        id: data.id || data.userId || (data.user && data.user.id) || 'user-id',
        name: data.name || (data.user && data.user.name) || (activeTab === 'admin' ? 'Administrator' : 'Sales Executive'),
        email: email,
        role: userRole
      };

      setUser(user);
      setRole(userRole);
      if (token) {
        setToken(token);
      }

      console.log('Setting user:', user);
      console.log('Setting role:', userRole);
      console.log('About to redirect to:', userRole === 'ADMIN' ? '/admin/dashboard' : '/sales/dashboard');

      // Redirect based on role - using window.location for reliable navigation
      const redirectUrl = userRole === 'ADMIN' ? '/admin/dashboard' : '/sales/dashboard';
      window.location.href = redirectUrl;
      
    } catch (err) {
      console.error('Login error:', err);
      // Display the actual error message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Enter your credentials to continue</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-white/50 backdrop-blur-sm rounded-lg border">
            <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'admin' 
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                Admin Login
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'sales'
                    ? 'bg-white shadow-sm text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
            >
                Sales Executive
            </button>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">
                {activeTab === 'admin' ? 'Admin Sign In' : 'Sales Sign In'}
            </CardTitle>
            <CardDescription>Enter your email and password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>
              
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 gradient-primary shadow-md hover:shadow-lg transition-all font-semibold text-base"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

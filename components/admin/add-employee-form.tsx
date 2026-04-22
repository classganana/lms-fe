'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store';
import { API_BASE_URL } from '@/lib/api';
import { UserPlus, Users, Smartphone, Mail, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AddEmployeeFormProps {
  onSuccess: () => void;
}

export function AddEmployeeForm({ onSuccess }: AddEmployeeFormProps) {
  const { token } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: "NON_ADMIN",
        isActive: true
      };

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create employee');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', mobile: '', password: '' });
      
      // Trigger parent refresh
      onSuccess();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
     <Card className="border border-border shadow-xl ring-1 ring-border/50 bg-card sticky top-6 overflow-hidden">
      <div className="h-2 gradient-primary w-full" />
      <CardHeader className="bg-muted/40 border-b border-border pb-5">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
          <div className="h-9 w-9 rounded-lg bg-info-soft flex items-center justify-center text-info shadow-sm">
              <UserPlus className="h-5 w-5" />
          </div>
          Register New Employee
        </CardTitle>
        <CardDescription>
          Create valid credentials for a new team member
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success && (
          <Alert className="mb-6 bg-success-soft border-success/30 text-success">
            <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                    <span className="text-success text-xs font-bold">✓</span>
                </div>
                <AlertTitle className="mb-0 font-medium">Employee created!</AlertTitle>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground font-medium">Full Name</Label>
            <div className="relative">
                <Input
                id="name"
                name="name"
                placeholder="e.g. Suman Kumar"
                value={formData.name}
                onChange={handleChange}
                required
                className="pl-10 h-11 bg-muted/40 border-border focus:bg-background transition-all"
                />
                <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground font-medium">Email Address</Label>
              <div className="relative">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 h-11 bg-muted/40 border-border focus:bg-background transition-all"
                />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="mobile" className="text-muted-foreground font-medium">Mobile Number</Label>
              <div className="relative">
                <Input
                    id="mobile"
                    name="mobile"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="pl-10 h-11 bg-muted/40 border-border focus:bg-background transition-all"
                />
                <Smartphone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground font-medium">Password</Label>
            <div className="relative">
                <Input
                id="password"
                name="password"
                type="text"
                placeholder="SecurePassword123!"
                value={formData.password}
                onChange={handleChange}
                required
                className="pl-10 h-11 bg-muted/40 border-border focus:bg-background transition-all"
                />
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              This will be the user&apos;s initial login password.
            </p>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 gradient-primary shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-semibold text-base"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Employee Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

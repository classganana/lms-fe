'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  ShoppingCart,
  LogOut,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useStore();

  const adminMenuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/influencers', label: 'Influencers', icon: Users },
    { href: '/admin/add-employee', label: 'Add Employee', icon: UserPlus },
    { href: '/sales/sales', label: 'Sales', icon: ShoppingCart },
  ];

  const salesMenuItems = [
    { href: '/sales/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sales/add-lead', label: 'Add Lead', icon: PlusCircle },
    { href: '/sales/sales', label: 'Sales', icon: ShoppingCart },
  ];

  const menuItems = role === 'ADMIN' ? adminMenuItems : salesMenuItems;

  return (
    <Card className="h-full p-6 shadow-lg border-0 bg-white">
      <div className="flex flex-col h-full">
        <div className="mb-8 pb-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">LMS</h2>
              <p className="text-xs text-muted-foreground font-medium">{role === 'ADMIN' ? 'Administrator' : 'Sales Executive'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-11 transition-all duration-200',
                    isActive 
                      ? 'gradient-primary shadow-md hover:shadow-lg' 
                      : 'hover:bg-accent/50'
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-4 w-4 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium",
                    isActive ? "text-primary-foreground" : ""
                  )}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" 
            onClick={logout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

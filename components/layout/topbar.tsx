'use client';

import { Card } from '@/components/ui/card';
import { useStore } from '@/store';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export function Topbar() {
  const { user } = useStore();


  return (
    <Card className="p-6 shadow-md border-0 bg-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text ">
            Lead Management System
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            Welcome back, <span className="text-foreground font-semibold">{user?.name || 'User'}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DateRangePicker />
        </div>
      </div>
    </Card>
  );
}

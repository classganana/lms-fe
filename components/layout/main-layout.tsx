'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useStore } from '@/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { role, _hasHydrated, loadInfluencers, loadLeads, loadInteractions, loadSales } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!role) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      await Promise.all([
        loadInfluencers(),
        loadLeads(),
        loadSales(),
        loadInteractions(),
      ]);
    };

    loadData();
  }, [role, _hasHydrated, router, loadInfluencers, loadLeads, loadInteractions, loadSales]);

  if (!_hasHydrated || !role) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex-none z-40 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 max-w-[1600px]">
          <Topbar />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1600px] h-full">
          <div className="grid grid-cols-12 gap-6 h-full pt-6">
            <div className="col-span-12 lg:col-span-2 hidden lg:block h-full pb-6">
              <div className="h-full overflow-y-auto no-scrollbar">
                <Sidebar />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-10 h-full overflow-y-auto no-scrollbar pb-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

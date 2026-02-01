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
    // Wait for hydration to finish before checking auth
    if (!_hasHydrated) return;

    if (!role) {
      router.push('/login');
      return;
    }
    
    // Load all data on mount without date filter
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

  // Don't render anything until hydrated and authenticated
  if (!_hasHydrated || !role) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Topbar - Remains stationary at the top */}
      <div className="flex-none z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-slate-50/60">
        <div className="container mx-auto px-6 py-4 max-w-[1600px]">
          <Topbar />
        </div>
      </div>
      
      {/* Main Layout Area - Fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1600px] h-full">
          <div className="grid grid-cols-12 gap-6 h-full pt-6">
            {/* Sidebar - Fixed/Independent Scroll */}
            <div className="col-span-12 lg:col-span-2 hidden lg:block h-full pb-6">
              <div className="h-full overflow-y-auto no-scrollbar">
                <Sidebar />
              </div>
            </div>
            
            {/* Page Content - Independent Scroll */}
            <div className="col-span-12 lg:col-span-10 h-full overflow-y-auto no-scrollbar pb-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

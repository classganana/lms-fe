'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useStore } from '@/store';

export default function AdminDashboardPage() {
  const { leads, sales, influencers, dateRange, openListModal, loadLeads, loadSales } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Reload data when date range changes
    loadLeads();
    loadSales();
  }, [dateRange, loadLeads, loadSales]);

  // KPI Calculations - data is already filtered by API
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.converted).length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const gstSales = sales.filter(s => s.gst).length;
  const gstPercentage = totalSales > 0 ? (gstSales / totalSales) * 100 : 0;
  const interestedLeads = leads.filter(l => l.rating !== null && l.rating >= 3).length;
  const nonInterestedLeads = leads.filter(l => l.rating !== null && l.rating <= 2).length;

  // Sales Executive Performance
  const executivePerformance = useMemo(() => {
    const stateMap = new Map<string, { name: string; leads: number; sales: number; revenue: number }>();
    
    leads.forEach(lead => {
      const state = stateMap.get(lead.state) || { name: lead.state, leads: 0, sales: 0, revenue: 0 };
      state.leads++;
      stateMap.set(lead.state, state);
    });

    sales.forEach(sale => {
      const lead = leads.find(l => l.id === sale.leadId);
      if (lead) {
        const state = stateMap.get(lead.state) || { name: lead.state, leads: 0, sales: 0, revenue: 0 };
        state.sales++;
        state.revenue += sale.amount;
        stateMap.set(lead.state, state);
      }
    });

    return Array.from(stateMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [leads, sales]);

  // Influencer-wise Sales
  const influencerSales = useMemo(() => {
    const infMap = new Map<string, { name: string; sales: number; revenue: number }>();
    
    sales.forEach(sale => {
      const influencer = influencers.find(i => i.id === sale.influencerId);
      if (influencer) {
        const inf = infMap.get(influencer.id) || { name: influencer.name, sales: 0, revenue: 0 };
        inf.sales++;
        inf.revenue += sale.amount;
        infMap.set(influencer.id, inf);
      }
    });

    return Array.from(infMap.values());
  }, [sales, influencers]);

  const handleCardClick = (type: 'leads' | 'sales') => {
    if (type === 'sales') {
      router.push('/sales/sales');
    } else {
      router.push('/sales/add-lead');
    }
  };

  const handleLeadsClick = (options?: { status?: string, rating?: string }) => {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.rating) params.set('rating', options.rating);
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your lead management system</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="kpi-card card-hover border-l-4 border-l-blue-500 cursor-pointer"
            onClick={() => handleLeadsClick()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">All time leads</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-green-500 cursor-pointer"
            onClick={() => handleLeadsClick({ status: 'converted' })}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Converted Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-green-600">{convertedLeads}</div>
              <p className="text-xs text-muted-foreground">Successfully converted</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-purple-500 cursor-pointer"
            onClick={() => handleLeadsClick({ status: 'converted' })} // Conversion rate card contextually relates to converted leads
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-purple-600">{conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Lead conversion percentage</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-orange-500 cursor-pointer"
            onClick={() => handleCardClick('sales')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-orange-600">{totalSales}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-emerald-500 cursor-pointer"
            onClick={() => handleCardClick('sales')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-emerald-600">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total revenue generated</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-indigo-500 cursor-pointer"
            onClick={() => handleCardClick('sales')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">GST %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3 mb-1">
                <div className="text-4xl font-bold text-indigo-600">{gstPercentage.toFixed(1)}%</div>
                <Badge variant="secondary" className="text-xs">{gstSales}/{totalSales}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">GST applicable sales</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-teal-500 cursor-pointer"
            onClick={() => handleLeadsClick({ rating: 'interested' })}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Interested Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-teal-600">{interestedLeads}</div>
              <p className="text-xs text-muted-foreground">Rating ≥ 3</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-red-500 cursor-pointer"
            onClick={() => handleLeadsClick({ rating: 'not-interested' })}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Non-Interested Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-red-600">{nonInterestedLeads}</div>
              <p className="text-xs text-muted-foreground">Rating ≤ 2</p>
            </CardContent>
          </Card>
        </div>


      </div>
    </MainLayout>
  );
}

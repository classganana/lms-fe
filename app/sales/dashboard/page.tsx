'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { User, MapPin, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SalesDashboardPage() {
  const { leads, sales, dateRange, openListModal, loadLeads, loadSales } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Reload data when date range changes
    loadLeads();
    loadSales();
  }, [dateRange, loadLeads, loadSales]);

  const currentMonthSales = useMemo(() => {
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    return sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      return isWithinInterval(saleDate, {
        start: currentMonthStart,
        end: currentMonthEnd,
      });
    });
  }, [sales]);

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

  const todayFollowUps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leads.filter(l => {
      if (!l.followUpDate) return false;
      const fDate = new Date(l.followUpDate);
      fDate.setHours(0, 0, 0, 0);
      return fDate.getTime() === today.getTime();
    });
  }, [leads]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Sales Dashboard</h1>
          <p className="text-muted-foreground">Your performance overview</p>
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
            onClick={() => handleLeadsClick({ status: 'converted' })}
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
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-4xl font-bold text-orange-600">{totalSales}</div>
                {currentMonthSales.length > 0 && (
                  <Badge variant="success" className="text-xs">
                    {currentMonthSales.length} this month
                  </Badge>
                )}
              </div>
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
          <Card
            className="kpi-card card-hover border-l-4 border-l-pink-500 cursor-pointer"
            onClick={() => router.push('/leads?view=today_followup')}
          >
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Today Follow-up
              </CardTitle>
              <Calendar className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-pink-600">{todayFollowUps.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

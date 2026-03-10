'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { User, MapPin, Phone, Calendar as LucideCalendar, Search, Filter, X, ChevronLeft, ChevronRight, LayoutDashboard, Target, CheckCircle, Star, Clock, Info, Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { subMonths, addMonths, format } from 'date-fns';
import { LeadForm } from '@/components/LeadForm';
import { Lead } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';

export default function SalesDashboardPage() {
  const { leads, sales, influencers, users, dateRange, loadLeads, loadSales, deleteLead, loadInfluencers, loadUsers, role } = useStore();
  const router = useRouter();

  useEffect(() => {
    loadLeads();
    loadSales();
    loadInfluencers();
    loadUsers();
  }, [loadLeads, loadSales, loadInfluencers, loadUsers]);

  const [auditMonth, setAuditMonth] = useState(new Date());
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditStatus, setAuditStatus] = useState('all');
  const [auditRating, setAuditRating] = useState('all');
  const [auditInfluencerFilter, setAuditInfluencerFilter] = useState('all');
  const [auditGstFilter, setAuditGstFilter] = useState('all');
  const [auditMinAmount, setAuditMinAmount] = useState('');
  const [auditMaxAmount, setAuditMaxAmount] = useState('');
  const [auditSourceCodeFilter, setAuditSourceCodeFilter] = useState('all');
  const [auditFollowUpDateFilter, setAuditFollowUpDateFilter] = useState<Date | undefined>(undefined);
  const [auditSalesPersonFilter, setAuditSalesPersonFilter] = useState('all');

  // Refetch leads from backend when auditor strategist filter changes,
  // so this funnel is server-driven for owner selection.
  useEffect(() => {
    if (auditSalesPersonFilter === 'all') {
      loadLeads();
    } else {
      loadLeads({ salesExecutiveId: auditSalesPersonFilter });
    }
  }, [auditSalesPersonFilter, loadLeads]);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<any>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      alert('Lead deleted successfully');
      loadSales();
    } catch (error) {
      alert('Failed to delete lead');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    if (rating >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

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

  const thisMonthLeadsCount = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return leads.filter(l => {
      const d = new Date(l.createdAt);
      return isWithinInterval(d, { start, end });
    }).length;
  }, [leads]);

  const auditedLeads = useMemo(() => {
    const start = startOfMonth(auditMonth);
    const end = endOfMonth(auditMonth);
    
    let filtered = leads.filter(l => {
      const d = new Date(l.createdAt);
      return isWithinInterval(d, { start, end });
    });

    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.mobile.includes(q));
    }

    if (auditStatus !== 'all') {
      filtered = filtered.filter(l => auditStatus === 'converted' ? l.converted : !l.converted);
    }

    if (auditRating !== 'all') {
      filtered = filtered.filter(l => l.rating === Number(auditRating));
    }

    if (auditInfluencerFilter !== 'all') {
        filtered = filtered.filter(l => l.influencerId === auditInfluencerFilter);
    }

    if (auditGstFilter !== 'all') {
        const isGst = auditGstFilter === 'yes';
        filtered = filtered.filter(l => l.gstCustomer === isGst);
    }

    if (auditSourceCodeFilter !== 'all') {
        filtered = filtered.filter(l => l.sourceCode === auditSourceCodeFilter);
    }

    if (auditFollowUpDateFilter) {
        const targetDate = format(auditFollowUpDateFilter, 'yyyy-MM-dd');
        filtered = filtered.filter(l => {
            if (!l.followUpDate) return false;
            return format(new Date(l.followUpDate), 'yyyy-MM-dd') === targetDate;
        });
    }

    if (auditSalesPersonFilter !== 'all') {
        filtered = filtered.filter(l => l.createdBy === auditSalesPersonFilter);
    }

    if (auditMinAmount || auditMaxAmount) {
        filtered = filtered.filter(l => {
             const amount = Number(l.salesAmount || 0);
             if (auditMinAmount && amount < Number(auditMinAmount)) return false;
             if (auditMaxAmount && amount > Number(auditMaxAmount)) return false;
             return true;
        });
    }

    return filtered;
  }, [leads, auditMonth, auditSearch, auditStatus, auditRating, auditInfluencerFilter, auditGstFilter, auditSourceCodeFilter, auditFollowUpDateFilter, auditMinAmount, auditMaxAmount, auditSalesPersonFilter]);

  // Filtered lists for KPI display
  const filteredLeads = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return leads;
    return leads.filter(l => {
      const d = new Date(l.createdAt);
      d.setHours(0,0,0,0);
      if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0,0,0,0);
        if (d < from) return false;
      }
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23,59,59,999);
        if (d > to) return false;
      }
      return true;
    });
  }, [leads, dateRange]);

  const filteredSales = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return sales;
    return sales.filter(s => {
      const d = new Date(s.saleDate);
      d.setHours(0,0,0,0);
      if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0,0,0,0);
        if (d < from) return false;
      }
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23,59,59,999);
        if (d > to) return false;
      }
      return true;
    });
  }, [sales, dateRange]);

  // KPI Calculations
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredLeads.filter(l => l.converted).length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  // GST % = (pending leads with GST YES/APPLIED / total pending leads) * 100 — only non-converted
  const isGstLead = (l: { gstStatus?: string; gstCustomer?: boolean; gst?: boolean }) =>
    l.gstStatus === 'YES' || l.gstStatus === 'APPLIED' || l.gstCustomer === true || l.gst === true;
  const pendingLeads = filteredLeads.filter(l => !l.converted).length;
  const gstPendingLeads = filteredLeads.filter(l => !l.converted && isGstLead(l)).length;
  const gstPercentage = pendingLeads > 0 ? (gstPendingLeads / pendingLeads) * 100 : 0;
  // "Interested" = rating >= 3 and NOT converted
  const interestedLeads = filteredLeads.filter(
    l => l.rating !== null && l.rating >= 3 && !l.converted
  ).length;
  const nonInterestedLeads = filteredLeads.filter(
    l => l.rating !== null && l.rating <= 2
  ).length;

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
      if (l.converted) return false;
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
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">Leads you created</p>
            </CardContent>
          </Card>

          <Card
            className="kpi-card card-hover border-l-4 border-l-sky-500 cursor-pointer shadow-indigo-100/50"
            onClick={() => setIsAuditOpen(true)}
          >
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                My Leads (This Month)
              </CardTitle>
              <Target className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-sky-600">{thisMonthLeadsCount}</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
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
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Sales</CardTitle>
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
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Revenue</CardTitle>
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
                <Badge variant="secondary" className="text-xs">{gstPendingLeads}/{pendingLeads}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Pending leads with GST</p>
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
              <LucideCalendar className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1 text-pink-600">{todayFollowUps.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>
        <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col border shadow-2xl rounded-xl">
            <DialogHeader className="p-6 bg-white border-b shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                    <LayoutDashboard className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                      Lead Audit - {format(auditMonth, 'MMMM yyyy')}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Viewing lead registrations for the selected period
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setAuditMonth(subMonths(auditMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-4 font-bold text-slate-700 min-w-[140px] text-center text-sm">
                    {format(auditMonth, 'MMM yyyy')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setAuditMonth(addMonths(auditMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search by name or mobile..." 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 gap-2 border-dashed border-slate-300 px-6 font-bold text-slate-700">
                      <Filter className="h-4 w-4" />
                      Funnel Filters
                      {(auditStatus !== 'all' || auditRating !== 'all' || auditInfluencerFilter !== 'all' || auditGstFilter !== 'all' || auditMinAmount || auditMaxAmount || auditSourceCodeFilter !== 'all' || auditFollowUpDateFilter || auditSalesPersonFilter !== 'all') && (
                        <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-[1.25rem] bg-blue-100 text-blue-700">
                          !
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-6 bg-white shadow-2xl rounded-2xl border-0 overflow-y-auto max-h-[80vh] scrollbar-hide" align="end">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-4">
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-base">Advance Audit Engine</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-4 text-xs font-bold text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setAuditStatus('all');
                            setAuditRating('all');
                            setAuditInfluencerFilter('all');
                            setAuditGstFilter('all');
                            setAuditMinAmount('');
                            setAuditMaxAmount('');
                            setAuditSourceCodeFilter('all');
                            setAuditFollowUpDateFilter(undefined);
                            setAuditSalesPersonFilter('all');
                            setAuditSearch('');
                          }}
                        >
                          Clear All
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pipeline Status</Label>
                          <Select value={auditStatus} onValueChange={setAuditStatus}>
                            <SelectTrigger className="h-10 bg-slate-50">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="all">Global Status</SelectItem>
                              <SelectItem value="converted">Lead Converted</SelectItem>
                              <SelectItem value="pending">Awaiting Audit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Engagement Rating</Label>
                          <Select value={auditRating} onValueChange={setAuditRating}>
                            <SelectTrigger className="h-10 bg-slate-50">
                              <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="all">Any Rating</SelectItem>
                              {[5,4,3,2,1].map(r => (
                                <SelectItem key={r} value={String(r)}>{r} Star Ranking</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Influencer Source</Label>
                          <Select value={auditInfluencerFilter} onValueChange={setAuditInfluencerFilter}>
                            <SelectTrigger className="h-10 bg-slate-50">
                              <SelectValue placeholder="Select Influencer" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="all">All Channels</SelectItem>
                              {influencers.map(inf => (
                                <SelectItem key={inf.id} value={inf.id}>{inf.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GST Recognition</Label>
                          <Select value={auditGstFilter} onValueChange={setAuditGstFilter}>
                            <SelectTrigger className="h-10 bg-slate-50">
                              <SelectValue placeholder="GST Mode" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="all">Universal GST</SelectItem>
                              <SelectItem value="yes">GST Enrolled</SelectItem>
                              <SelectItem value="no">Non-GST</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Interaction Schedule (Follow-up)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-bold bg-slate-50", !auditFollowUpDateFilter && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                {auditFollowUpDateFilter ? format(auditFollowUpDateFilter, 'PPPP') : 'Target a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={auditFollowUpDateFilter}
                                onSelect={setAuditFollowUpDateFilter}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Investment (Min)</Label>
                          <Input 
                            type="number" 
                            placeholder="Min ₹" 
                            className="h-10 bg-slate-50"
                            value={auditMinAmount}
                            onChange={(e) => setAuditMinAmount(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Investment (Max)</Label>
                          <Input 
                            type="number" 
                            placeholder="Max ₹" 
                            className="h-10 bg-slate-50"
                            value={auditMaxAmount}
                            onChange={(e) => setAuditMaxAmount(e.target.value)}
                          />
                        </div>

                        <div className="col-span-2 space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</Label>
                          <Select value={auditSalesPersonFilter} onValueChange={setAuditSalesPersonFilter}>
                            <SelectTrigger className="h-10 bg-slate-50">
                              <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="all">All Employees</SelectItem>
                              {users.filter(u => u.role === 'NON_ADMIN').map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-0 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 h-10 hover:bg-transparent">
                    <TableHead className="pl-6 h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">Lead Name</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">State</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">GST</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Rating</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow Up</TableHead>
                    <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Created Date</TableHead>
                    <TableHead className="pr-6 h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditedLeads.length > 0 ? auditedLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="h-12 hover:bg-slate-50 transition-colors cursor-pointer border-b"
                    >
                       <TableCell 
                        className="pl-6 font-medium text-sm text-slate-900"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >{lead.name}</TableCell>
                       <TableCell 
                        className="font-mono text-sm"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >{lead.mobile}</TableCell>
                       <TableCell 
                        className="text-sm text-slate-600"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >{lead.state}</TableCell>
                        <TableCell
                         onClick={() => {
                           setViewingLead(lead);
                           setIsViewDialogOpen(true);
                         }}
                        >
                          {lead.gstCustomer ? (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium h-6">
                              YES
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 font-normal h-6">
                              NO
                            </Badge>
                          )}
                        </TableCell>
                       <TableCell
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >
                         <Badge variant={lead.converted ? 'success' : 'secondary'} className="h-6 px-3">
                           {lead.converted ? 'Converted' : 'Pending'}
                         </Badge>
                       </TableCell>
                       <TableCell 
                        className="text-center"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >
                          <Badge variant="outline" className="h-6 px-2 font-bold text-sky-600 border-sky-100 bg-sky-50">
                             {lead.rating || '0'} ★
                          </Badge>
                       </TableCell>
                       <TableCell 
                        className="text-sm text-blue-600 font-medium"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >
                         {lead.followUpDate ? format(new Date(lead.followUpDate), 'MMM dd, yyyy') : '-'}
                       </TableCell>
                       <TableCell 
                        className="text-right"
                        onClick={() => {
                          setViewingLead(lead);
                          setIsViewDialogOpen(true);
                        }}
                       >
                         <div className="flex flex-col items-end">
                           <span className="text-sm font-medium">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                           <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(lead.createdAt), 'hh:mm a')}</span>
                         </div>
                       </TableCell>
                       <TableCell className="pr-6 text-right">
                         <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(lead);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {role === 'ADMIN' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(lead.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                         </div>
                       </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-72 text-center text-muted-foreground">
                         No records discovered
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-6 border-t bg-slate-50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                 <span>Total Leads: <span className="text-slate-900 font-bold">{auditedLeads.length}</span></span>
                 <div className="w-px h-4 bg-slate-300" />
                 <span>Converted: <span className="text-emerald-600 font-bold">{auditedLeads.filter(l => l.converted).length}</span></span>
               </div>
               <div className="flex gap-3">
                 <Button variant="outline" onClick={() => {
                    setAuditSearch('');
                    setAuditStatus('all');
                    setAuditRating('all');
                    setAuditMonth(new Date());
                 }}>
                   Reset Filters
                 </Button>
                 <Button
                  onClick={() => setIsAuditOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 font-bold px-8 shadow-md text-white"
                >
                  Close Audit
                </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Lead Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl bg-white rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">{viewingLead?.name}</DialogTitle>
                  <DialogDescription className="text-blue-100 font-medium">Lead Identity: AUD-#{viewingLead?.id?.slice(-8).toUpperCase() || 'N/A'}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {/* Core Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
                  <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    {viewingLead?.mobile}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-base font-bold text-slate-900">{viewingLead?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Location Data */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">State / Region</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {viewingLead?.state}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">City / Locale</p>
                  <p className="text-sm font-bold text-slate-700">{viewingLead?.city || 'N/A'}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Postal Address</p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                    {viewingLead?.address || 'No address provided'}
                    {viewingLead?.pincode ? ` - ${viewingLead.pincode}` : ''}
                  </p>
                </div>
              </div>

              {/* Status & Rating */}
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Status</p>
                  {viewingLead?.converted ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-1.5 rounded-lg font-bold">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      CONVERTED
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-4 py-1.5 rounded-lg font-bold shadow-none">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      PENDING AUDIT
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement Score</p>
                  <Badge className={cn("px-4 py-1.5 rounded-lg border-0 shadow-lg font-black", getRatingColor(viewingLead?.rating || null))}>
                    <Star className="h-4 w-4 mr-2 fill-current" />
                    {viewingLead?.rating ? `${viewingLead.rating}.0 / 5.0` : 'NOT SCORED'}
                  </Badge>
                </div>
              </div>

              {/* Workflow Anchors */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Interaction Plan</p>
                  <p className="text-sm font-black text-blue-600 flex items-center gap-2">
                    <LucideCalendar className="h-4 w-4" />
                    {viewingLead?.followUpDate ? format(new Date(viewingLead.followUpDate), 'MMMM dd, yyyy') : 'No follow-up scheduled'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Stamp</p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingLead?.createdAt ? format(new Date(viewingLead.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Notes Context */}
              {viewingLead?.notes && (
                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Context & Audit Notes</p>
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-sm text-amber-900 font-medium leading-relaxed italic">
                    "{viewingLead.notes}"
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="rounded-xl px-8 font-bold text-slate-600 bg-white border-slate-200">
                CLOSE DETAILS
              </Button>
              <Button 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsAuditOpen(false);
                  router.push(`/leads?search=${viewingLead.mobile}`);
                }} 
                className="rounded-xl px-8 font-extrabold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200/50"
              >
                VIEW FULL RECORD
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600">Delete Lead</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lead? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white scrollbar-hide">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Edit Lead</DialogTitle>
              <DialogDescription>
                Update the information for this lead using the standard form.
              </DialogDescription>
            </DialogHeader>
            <LeadForm 
              initialMobile={editingLead?.mobile} 
              initialData={editingLead || undefined}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                loadSales();
                loadLeads();
              }}
              onCancel={() => setIsEditDialogOpen(false)}
              showCardWrapper={false} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

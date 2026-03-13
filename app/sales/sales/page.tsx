'use client';

import { useMemo, useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  RefreshCcw, 
  Filter, 
  X, 
  Pencil, 
  Trash2, 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  Calendar as LucideCalendar
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadForm } from '@/components/LeadForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Lead, User } from '@/types';
import { API_BASE_URL } from '@/lib/api';

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
];

export default function SalesPage() {
  const { 
    sales, 
    leads, 
    influencers, 
    users, 
    employeeSales,
    dateRange, 
    loadSales, 
    loadLeads, 
    loadInfluencers, 
    loadUsers, 
    loadEmployeeSales,
    deleteLead, 
    updateLead, 
    role,
    token,
  } = useStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);


  const [influencerFilter, setInfluencerFilter] = useState<string>('all');
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>('all');
  const [gstFilter, setGstFilter] = useState<string>('all');
  const [mobileFilter, setMobileFilter] = useState<string>('');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('sales');

  // Advanced Filters
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [convertedFilter, setConvertedFilter] = useState<boolean | 'all'>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sourceCodeFilter, setSourceCodeFilter] = useState<string>('all');
  const [followUpDateFilter, setFollowUpDateFilter] = useState<Date | undefined>(undefined);
  // Admin: track per-user daily activity
  const [activityUserId, setActivityUserId] = useState<string>('all');
  const [activityDate, setActivityDate] = useState<Date>(new Date());
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<{
    date: string;
    userId: string;
    userName: string;
    createdCount: number;
    touchedCount: number;
    leads: Array<{
      id: string;
      name?: string;
      mobile: string;
      state?: string;
      city?: string;
      converted: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    createdLeadIds: string[];
    interactedLeadIds: string[];
  } | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [execPage, setExecPage] = useState(1);
  const [infPage, setInfPage] = useState(1);
  const ITEMS_PER_PAGE = 10;


  useEffect(() => {
    loadInfluencers();
    loadLeads();
    loadSales();
    loadUsers();
    if (role === 'ADMIN') {
      loadEmployeeSales();
    }
  }, [loadInfluencers, loadLeads, loadSales, loadUsers, loadEmployeeSales, role, dateRange?.from, dateRange?.to]);

  // Load activity whenever admin changes user or date
  useEffect(() => {
    const loadActivity = async () => {
      if (role !== 'ADMIN' || !token || activityUserId === 'all') {
        setActivityData(null);
        return;
      }
      try {
        setActivityLoading(true);
        setActivityError(null);
        const params = new URLSearchParams();
        params.set('userId', activityUserId);
        if (activityDate) {
          params.set('date', format(activityDate, 'yyyy-MM-dd'));
        }
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/user-activity?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load user activity');
        }
        const data = await response.json();
        const leads = Array.isArray(data?.leads)
          ? data.leads.map((l: any) => ({
              id: String(l.id || l._id),
              name: l.name ?? '',
              mobile: l.mobile,
              state: l.state ?? '',
              city: l.city ?? '',
              converted: !!l.converted,
              createdAt: l.createdAt,
              updatedAt: l.updatedAt,
            }))
          : [];
        setActivityData({
          date: data.date,
          userId: data.userId,
          userName: data.userName,
          createdCount: Number(data.createdCount ?? 0),
          touchedCount: Number(data.touchedCount ?? 0),
          leads,
          createdLeadIds: Array.isArray(data.createdLeadIds) ? data.createdLeadIds.map((id: any) => String(id)) : [],
          interactedLeadIds: Array.isArray(data.interactedLeadIds) ? data.interactedLeadIds.map((id: any) => String(id)) : [],
        });
      } catch (error: any) {
        console.error('Error loading user activity:', error);
        setActivityError(error?.message || 'Unable to load activity');
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivity();
  }, [activityUserId, activityDate, role, token]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExecPage(1);
    setInfPage(1);
  }, [influencerFilter, salesPersonFilter, gstFilter, mobileFilter, nameFilter, callStatusFilter, ratingFilter, convertedFilter, minAmount, maxAmount, sourceCodeFilter, followUpDateFilter, dateRange, activeTab]);

  // Non-admin: reset to Sales tab if on admin-only tab (Performance, Employee Sales, User Activity)
  useEffect(() => {
    if (role !== 'ADMIN' && ['executives', 'employee-sales', 'user-activity'].includes(activeTab)) {
      setActiveTab('sales');
    }
  }, [role, activeTab]);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      alert('Lead deleted successfully');
      loadSales(); // Refresh sales as well
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

  const handleRowClick = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewDialogOpen(true);
  };


  // ... (keeping other useMemos same) ...

  // Sales History Filtering
  const filteredSales = useMemo(() => {
    // START: Always show only converted leads
    let filtered = sales.filter(s => {
      const lead = leads.find(l => l.id === s.leadId);
      return lead?.converted === true;
    });
    // END: Always show only converted leads

    // Date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(s => {
        const saleDate = new Date(s.saleDate);
        saleDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          
          return saleDate >= fromDate && saleDate <= toDate;
        }
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return saleDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return saleDate <= toDate;
        }
        return true;
      });
    }

    if (influencerFilter !== 'all') {
      filtered = filtered.filter(s => s.influencerId === influencerFilter);
    }

    if (salesPersonFilter !== 'all') {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.createdBy === salesPersonFilter;
      });
    }

    if (gstFilter !== 'all') {
      const status = gstFilter as string;
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        const s2 = (lead as { gstStatus?: string })?.gstStatus;
        if (s2 && ['NO', 'YES', 'APPLIED', 'APPLIED_THROUGH_US'].includes(s2)) return s2 === status;
        if (status === 'APPLIED' || status === 'APPLIED_THROUGH_US') return false;
        if (status === 'NO') return !lead?.gstCustomer;
        return lead?.gstCustomer === true;
      });
    }

    if (mobileFilter) {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.mobile?.includes(mobileFilter);
      });
    }

    if (nameFilter) {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.name?.toLowerCase().includes(nameFilter.toLowerCase());
      });
    }

    // Call Status Filter (Indirectly via Lead)
    if (callStatusFilter !== 'all') {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.callStatus === callStatusFilter;
      });
    }

    // Rating Filter (Indirectly via Lead)
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.rating === ratingFilter;
      });
    }

    // Amount Range Filter
    if (minAmount) {
      filtered = filtered.filter(s => s.amount >= Number(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(s => s.amount <= Number(maxAmount));
    }

    if (sourceCodeFilter !== 'all') {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        return lead?.sourceCode === sourceCodeFilter;
      });
    }

    if (followUpDateFilter) {
      filtered = filtered.filter(s => {
        const lead = leads.find(l => l.id === s.leadId);
        if (!lead || !lead.followUpDate) return false;
        const fDate = new Date(lead.followUpDate);
        return fDate.toDateString() === followUpDateFilter.toDateString();
      });
    }

    return filtered;
  }, [sales, dateRange, influencerFilter, salesPersonFilter, gstFilter, mobileFilter, nameFilter, leads, callStatusFilter, ratingFilter, minAmount, maxAmount, sourceCodeFilter, followUpDateFilter]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);

  const totals = useMemo(() => {
    return {
      count: filteredSales.length,
      revenue: filteredSales.reduce((sum, s) => sum + s.amount, 0),
      gstCount: filteredSales.filter(s => s.gst).length,
    };
  }, [filteredSales]);

  // Leads filtered by createdAt (for Performance tab - respects global date filter)
  const leadsInDateRange = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return leads;
    return leads.filter(l => {
      const d = new Date(l.createdAt);
      d.setHours(0, 0, 0, 0);
      if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (d < from) return false;
      }
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [leads, dateRange]);

  // Performance Logic (uses date-filtered leads + sales)
  const filteredPerformance = useMemo(() => {
    const stateMap = new Map<string, { name: string; leads: number; sales: number; revenue: number }>();
    
    leadsInDateRange.forEach(lead => {
      const state = stateMap.get(lead.state) || { name: lead.state, leads: 0, sales: 0, revenue: 0 };
      state.leads++;
      stateMap.set(lead.state, state);
    });

    filteredSales.forEach(sale => {
      const lead = leads.find(l => l.id === sale.leadId);
      if (lead) {
        const state = stateMap.get(lead.state) || { name: lead.state, leads: 0, sales: 0, revenue: 0 };
        state.sales++;
        state.revenue += sale.amount;
        stateMap.set(lead.state, state);
      }
    });

    return Array.from(stateMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [leadsInDateRange, filteredSales, leads]);

  const execTotalPages = Math.ceil(filteredPerformance.length / ITEMS_PER_PAGE);
  const executivePerformance = useMemo(() => {
    const startIndex = (execPage - 1) * ITEMS_PER_PAGE;
    return filteredPerformance.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPerformance, execPage]);


  // Influencer Logic (uses filteredSales so date range and other filters apply)
  const filteredInfluencerSales = useMemo(() => {
    const infMap = new Map<string, { name: string; sales: number; revenue: number }>();
    
    filteredSales.forEach(sale => {
      const influencer = influencers.find(i => i.id === sale.influencerId);
      if (influencer) {
        const inf = infMap.get(influencer.id) || { name: influencer.name, sales: 0, revenue: 0 };
        inf.sales++;
        inf.revenue += sale.amount;
        infMap.set(influencer.id, inf);
      }
    });

    return Array.from(infMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, influencers]);

  const infTotalPages = Math.ceil(filteredInfluencerSales.length / ITEMS_PER_PAGE);
  const influencerSales = useMemo(() => {
    const startIndex = (infPage - 1) * ITEMS_PER_PAGE;
    return filteredInfluencerSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInfluencerSales, infPage]);


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight mb-0.5">Sales Overview</h1>
          <p className="text-sm text-muted-foreground">Manage sales records and view performance</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn("grid w-full max-w-xl mb-4", role === 'ADMIN' ? "grid-cols-3 md:grid-cols-5" : "grid-cols-2")}>
            <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Sales History
            </TabsTrigger>
            <TabsTrigger value="influencers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Influencers
            </TabsTrigger>
            {role === 'ADMIN' && (
              <>
                <TabsTrigger value="executives" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="employee-sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Employee Sales
                </TabsTrigger>
                <TabsTrigger value="user-activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  User Activity
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="sales" className="mt-0">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="py-3 px-4 border-b bg-gradient-to-r from-slate-50 to-white">
                <CardTitle className="text-lg font-semibold">Sales List</CardTitle>
                <p className="text-xs text-muted-foreground">Filter and view sales data</p>
              </CardHeader>
              <CardContent className="p-4">
              
                
                <div className="flex flex-wrap gap-2 mb-3 items-center">
                   <div className="flex-1 min-w-[160px] max-w-[200px]">
                        <Input
                            placeholder="Search by Mobile"
                            value={mobileFilter}
                            onChange={(e) => setMobileFilter(e.target.value)}
                            className="bg-white h-9 text-sm"
                        />
                   </div>
                   <div className="flex-1 min-w-[160px] max-w-[200px]">
                        <Input
                            placeholder="Search by Name"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="bg-white h-9 text-sm"
                        />
                   </div>

                   <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2 border-dashed border-gray-300">
                          <Filter className="h-4 w-4" />
                          Filters
                          {(influencerFilter !== 'all' || salesPersonFilter !== 'all' || gstFilter !== 'all' || callStatusFilter !== 'all' || ratingFilter !== 'all' || convertedFilter !== 'all' || minAmount || maxAmount || sourceCodeFilter !== 'all' || followUpDateFilter) && (
                            <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-[1.25rem]">
                              !
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                       <PopoverContent 
                         className="w-[400px] p-5 bg-white shadow-xl max-h-[60vh] overflow-y-auto" 
                         align="end" 
                         side="bottom" 
                         sideOffset={5}
                       >
                        <div className="space-y-5">
                          <div className="flex items-center justify-between border-b pb-3">
                            <h4 className="font-semibold text-sm">Filter Sales</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-muted-foreground"
                              onClick={() => {
                                setInfluencerFilter('all');
                                setSalesPersonFilter('all');
                                setGstFilter('all');
                                setCallStatusFilter('all');
                                setRatingFilter('all');
                                setConvertedFilter('all');
                                setMinAmount('');
                                setMaxAmount('');
                                setSourceCodeFilter('all');
                                setFollowUpDateFilter(undefined);
                              }}
                            >
                               Reset
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <Label>Follow-up Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal bg-white',
                                    !followUpDateFilter && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {followUpDateFilter ? format(followUpDateFilter, 'PPP') : 'Pick a date'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-white" align="start">
                                <Calendar
                                  mode="single"
                                  selected={followUpDateFilter}
                                  onSelect={setFollowUpDateFilter}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-3">
                            <Label>Influencer</Label>
                            <Select value={influencerFilter} onValueChange={(val) => {
                              setInfluencerFilter(val);
                              setSourceCodeFilter('all');
                            }}>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select Influencer" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="all">All Influencers</SelectItem>
                                {influencers.map((inf) => (
                                  <SelectItem key={inf.id} value={inf.id}>{inf.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {influencerFilter !== 'all' && (
                            <div className="space-y-3">
                              <Label>Source Code</Label>
                              <Select value={sourceCodeFilter} onValueChange={setSourceCodeFilter}>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select Source Code" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="all">All Codes</SelectItem>
                                  {(
                                    influencers.find(inf => inf.id === influencerFilter)?.sourceCodes ?? []
                                  ).map((sc: any) => (
                                    <SelectItem key={sc.code} value={sc.code}>{sc.code}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {role === 'ADMIN' && (
                            <div className="space-y-3">
                              <Label>Sales Person</Label>
                              <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select Sales Person" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="all">All Sales Persons</SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div className="space-y-3">
                             <Label>Call Status</Label>
                             <Select value={callStatusFilter} onValueChange={setCallStatusFilter}>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="CONNECTED">Connected</SelectItem>
                                  <SelectItem value="NOT_CONNECTED">Not Connected</SelectItem>
                                  <SelectItem value="BUSY">Busy</SelectItem>
                                  <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>

                          <div className="space-y-3">
                            <Label>Rating</Label>
                            <div className="flex gap-1.5 flex-wrap">
                               <Button 
                                variant={ratingFilter === 'all' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setRatingFilter('all')}
                                className="h-8"
                               >
                                All
                               </Button>
                               {[1, 2, 3, 4, 5].map(r => (
                                 <Button 
                                  key={r}
                                  variant={ratingFilter === r ? 'default' : 'outline'} 
                                  size="icon" 
                                  onClick={() => setRatingFilter(ratingFilter === r ? 'all' : r)}
                                  className="h-8 w-8"
                                 >
                                  {r}
                                 </Button>
                               ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Label>Sales Amount Range</Label>
                            <div className="flex gap-2">
                                <Input 
                                  type="number" 
                                  placeholder="Min" 
                                  value={minAmount} 
                                  onChange={(e) => setMinAmount(e.target.value)} 
                                  className="bg-white"
                                />
                              <Input 
                                type="number" 
                                placeholder="Max" 
                                value={maxAmount} 
                                onChange={(e) => setMaxAmount(e.target.value)} 
                                className="bg-white"
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <div className="space-y-3">
                              <Label>GST Status</Label>
                              <Select value={gstFilter} onValueChange={setGstFilter}>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="All GST" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="all">All GST</SelectItem>
                                  <SelectItem value="NO">No</SelectItem>
                                  <SelectItem value="YES">Yes</SelectItem>
                                  <SelectItem value="APPLIED">Applied</SelectItem>
                                  <SelectItem value="APPLIED_THROUGH_US">Applied Through Us</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                               <Checkbox 
                                id="converted-filter" 
                                checked={convertedFilter === true}
                                onCheckedChange={(c: boolean | 'indeterminate') => {
                                   if (c === true) setConvertedFilter(true);
                                   else setConvertedFilter('all');
                                }}
                               />
                               <Label htmlFor="converted-filter" className="font-normal cursor-pointer">
                                 Converted Leads Only
                               </Label>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                   </Popover>

                   {(influencerFilter !== 'all' || salesPersonFilter !== 'all' || gstFilter !== 'all' || callStatusFilter !== 'all' || ratingFilter !== 'all' || convertedFilter !== 'all' || minAmount || maxAmount || mobileFilter || nameFilter || dateRange.from || dateRange.to || sourceCodeFilter !== 'all' || followUpDateFilter) && (
                     <Button 
                       variant="ghost" 
                       onClick={() => {
                         setInfluencerFilter('all');
                         setSalesPersonFilter('all');
                         setGstFilter('all');
                         setCallStatusFilter('all');
                         setRatingFilter('all');
                         setConvertedFilter('all');
                          setMinAmount('');
                          setMaxAmount('');
                          setMobileFilter('');
                          setNameFilter('');
                          setSourceCodeFilter('all');
                          setFollowUpDateFilter(undefined);
                          useStore.getState().setDateRange({ from: undefined, to: undefined });
                       }}
                       className="h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-slate-100"
                     >
                       <X className="mr-2 h-4 w-4" />
                       Reset
                     </Button>
                   )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 h-10 hover:bg-transparent">
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Date</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Lead Name</TableHead>
                        {role === 'ADMIN' && (
                          <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sales Person</TableHead>
                        )}
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Influencer</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow Up</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">GST</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="h-10 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSales.length > 0 ? (
                        paginatedSales.map((sale) => {
                          const lead = leads.find(l => l.id === sale.leadId);
                          const influencer = influencers.find(i => i.id === sale.influencerId);
                          return (
                            <TableRow 
                              key={sale.id} 
                              className="h-10 hover:bg-slate-50 transition-colors cursor-pointer border-b"
                              onClick={() => {
                                if (lead) handleRowClick(lead);
                              }}
                            >
                              <TableCell className="py-2 px-2 font-medium text-xs">{format(new Date(sale.saleDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="py-2 px-2 text-xs font-medium">{lead?.name || 'N/A'}</TableCell>
                              {role === 'ADMIN' && (
                                <TableCell className="py-2 px-2 text-xs text-muted-foreground">
                                  {users.find(u => u.id === lead?.createdBy)?.name || 'Unknown'}
                                </TableCell>
                              )}
                              <TableCell className="py-2 px-2 font-mono text-xs">{lead?.mobile || 'N/A'}</TableCell>
                              <TableCell className="py-2 px-2 text-xs">{influencer?.name || 'N/A'}</TableCell>
                              <TableCell className="py-2 px-2 text-xs">
                                {lead?.followUpDate ? format(new Date(lead.followUpDate), 'MMM dd, yyyy') : '-'}
                              </TableCell>
                              <TableCell className="py-2 px-2 font-semibold text-xs text-emerald-600">₹{sale.amount.toLocaleString()}</TableCell>
                              <TableCell className="py-2 px-2">
                                <Badge variant={sale.gst ? 'success' : 'secondary'} className="h-5 px-1.5 text-[10px]">
                                  {sale.gst ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-2 text-xs font-medium">
                                <Badge className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                  Converted
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-2">
                                <div className="flex justify-start gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 hover:bg-blue-50 text-blue-600"
                                    onClick={() => lead && handleEditClick(lead)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  {role === 'ADMIN' && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 hover:bg-red-50 text-red-600"
                                      onClick={() => lead && handleDeleteClick(lead.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={role === 'ADMIN' ? 10 : 9} className="text-center text-muted-foreground py-12">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <p>No sales found matching your filters</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  useStore.getState().setDateRange({ from: undefined, to: undefined });
                                  setInfluencerFilter('all');
                                  setSalesPersonFilter('all');
                                  setGstFilter('all');
                                  setCallStatusFilter('all');
                                  setRatingFilter('all');
                                  setConvertedFilter('all');
                                   setMinAmount('');
                                   setMaxAmount('');
                                   setMobileFilter('');
                                   setNameFilter('');
                                   setSourceCodeFilter('all');
                                   setFollowUpDateFilter(undefined);
                                 }}
                                className="mt-2"
                              >
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Reset Filters
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/30">
                      <TableRow>
                        <TableCell colSpan={6} className="text-right font-semibold px-2">
                          Totals:
                        </TableCell>
                        <TableCell className="font-bold text-emerald-600 text-lg px-2">
                          ₹{totals.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell colSpan={3} className="px-2">
                          <Badge variant="secondary" className="font-semibold">
                            {totals.gstCount}/{totals.count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 bg-slate-50 p-2 rounded-lg border">
                    <div className="text-sm text-muted-foreground ml-2">
                      Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)}</span> of{' '}
                      <span className="font-medium">{filteredSales.length}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first, last, and pages around current
                            return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, idx, array) => (
                             <div key={page} className="flex items-center">
                               {idx > 0 && array[idx - 1] !== page - 1 && (
                                 <span className="px-1 text-muted-foreground text-xs">...</span>
                               )}
                               <Button
                                 variant={currentPage === page ? 'default' : 'outline'}
                                 size="sm"
                                 onClick={() => setCurrentPage(page)}
                                 className={cn("h-8 w-8 p-0", currentPage === page ? "bg-blue-600 hover:bg-blue-700 font-bold" : "")}
                               >
                                 {page}
                               </Button>
                             </div>
                          ))
                        }
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs mt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Total Sales:</span>
                    <Badge variant="outline" className="font-semibold">{totals.count}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Total Revenue:</span>
                    <span className="font-bold text-emerald-600">₹{totals.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">GST Sales:</span>
                    <Badge variant="success" className="font-semibold">{totals.gstCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executives" className="mt-0">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                <CardTitle className="text-xl font-semibold">Sales Performance by State</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Performance metrics grouped by state</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">State</TableHead>
                        <TableHead className="font-semibold">Leads</TableHead>
                        <TableHead className="font-semibold">Sales</TableHead>
                        <TableHead className="font-semibold text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executivePerformance.length > 0 ? (
                        executivePerformance.map((exec, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">{exec.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{exec.leads}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{exec.sales}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              ₹{exec.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Performance Pagination */}
                {execTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 bg-slate-50 p-3 rounded-lg border mx-4 mb-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{(execPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(execPage * ITEMS_PER_PAGE, filteredPerformance.length)}</span> of{' '}
                      <span className="font-medium">{filteredPerformance.length}</span> states
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExecPage(prev => Math.max(1, prev - 1))}
                        disabled={execPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: execTotalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === execTotalPages || (page >= execPage - 1 && page <= execPage + 1))
                          .map((page, idx, array) => (
                             <div key={page} className="flex items-center">
                               {idx > 0 && array[idx - 1] !== page - 1 && (
                                 <span className="px-1 text-muted-foreground text-xs">...</span>
                               )}
                               <Button
                                 variant={execPage === page ? 'default' : 'outline'}
                                 size="sm"
                                 onClick={() => setExecPage(page)}
                                 className={cn("h-8 w-8 p-0", execPage === page ? "bg-blue-600 hover:bg-blue-700 font-bold" : "")}
                               >
                                 {page}
                               </Button>
                             </div>
                          ))
                        }
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExecPage(prev => Math.min(execTotalPages, prev + 1))}
                        disabled={execPage === execTotalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

            </Card>
          </TabsContent>

          <TabsContent value="influencers" className="mt-0">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                <CardTitle className="text-xl font-semibold">Influencer-wise Sales</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Sales breakdown by influencer</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Influencer</TableHead>
                        <TableHead className="font-semibold">Sales</TableHead>
                        <TableHead className="font-semibold text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {influencerSales.length > 0 ? (
                        influencerSales.map((inf, idx) => {
                          
                          
                          return (
                          <TableRow 
                            key={idx} 
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => {
                  
                                const selectedInfluencer = influencers.find(i => i.name === inf.name);
                                if (selectedInfluencer) {
                                    setInfluencerFilter(selectedInfluencer.id);
                                    setGstFilter('all');
                                    setMobileFilter('');
                                    setNameFilter('');
                                    setSourceCodeFilter('all');
                                    setFollowUpDateFilter(undefined);

                                    setActiveTab('sales');
                                }
                            }}
                          >
                            <TableCell className="font-medium">{inf.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{inf.sales}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              ₹{inf.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )})
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Influencer Pagination */}
                {infTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 bg-slate-50 p-3 rounded-lg border mx-4 mb-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{(infPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(infPage * ITEMS_PER_PAGE, filteredInfluencerSales.length)}</span> of{' '}
                      <span className="font-medium">{filteredInfluencerSales.length}</span> influencers
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInfPage(prev => Math.max(1, prev - 1))}
                        disabled={infPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: infTotalPages }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === infTotalPages || (page >= infPage - 1 && page <= infPage + 1))
                          .map((page, idx, array) => (
                             <div key={page} className="flex items-center">
                               {idx > 0 && array[idx - 1] !== page - 1 && (
                                 <span className="px-1 text-muted-foreground text-xs">...</span>
                               )}
                               <Button
                                 variant={infPage === page ? 'default' : 'outline'}
                                 size="sm"
                                 onClick={() => setInfPage(page)}
                                 className={cn("h-8 w-8 p-0", infPage === page ? "bg-blue-600 hover:bg-blue-700 font-bold" : "")}
                               >
                                 {page}
                               </Button>
                             </div>
                          ))
                        }
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInfPage(prev => Math.min(infTotalPages, prev + 1))}
                        disabled={infPage === infTotalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

            </Card>
          </TabsContent>

          {role === 'ADMIN' && (
            <TabsContent value="employee-sales" className="mt-0">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-xl font-semibold">
                    Employee Sales{dateRange?.from || dateRange?.to ? ' (Selected Period)' : ' (This Month)'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dateRange?.from && dateRange?.to
                      ? `Total sales from ${format(new Date(dateRange.from), 'MMM d, yyyy')} to ${format(new Date(dateRange.to), 'MMM d, yyyy')}`
                      : 'Total sales amount per employee for the current month'}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Employee</TableHead>
                          <TableHead className="font-semibold text-right">Sales (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeSales.length > 0 ? (
                          employeeSales.map((emp) => (
                            <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">{emp.name}</TableCell>
                              <TableCell className="text-right font-semibold text-emerald-600">
                                ₹{emp.sales.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                              No employee sales recorded for the selected period
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {role === 'ADMIN' && (
            <TabsContent value="user-activity" className="mt-0">
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-xl font-semibold">User Daily Activity</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    See which leads a selected user has created or updated on a given day.
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="min-w-[200px]">
                      <Label>Sales User</Label>
                      <Select value={activityUserId} onValueChange={setActivityUserId}>
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">Select user</SelectItem>
                          {users
                            .filter((u) => u.role === 'NON_ADMIN')
                            .map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[220px]">
                      <Label>Activity Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal bg-white mt-1',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {activityDate ? format(activityDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={activityDate}
                            onSelect={(d) => d && setActivityDate(d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {activityError && (
                    <div className="text-sm text-red-600">
                      {activityError}
                    </div>
                  )}

                  {activityLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-5 w-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : activityData && activityUserId !== 'all' ? (
                    <>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <Badge variant="outline">
                          Date: <span className="ml-1 font-semibold">{activityData.date}</span>
                        </Badge>
                        <Badge variant="outline">
                          User: <span className="ml-1 font-semibold">{activityData.userName}</span>
                        </Badge>
                        <Badge variant="secondary">
                          Created Today: <span className="ml-1 font-semibold">{activityData.createdCount}</span>
                        </Badge>
                        <Badge variant="secondary">
                          Follow up Today: <span className="ml-1 font-semibold">{activityData.touchedCount}</span>
                        </Badge>
                        <Badge>
                          Total Leads Touched: <span className="ml-1 font-semibold">{activityData.leads.length}</span>
                        </Badge>
                      </div>

                      <div className="overflow-x-auto mt-3">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Lead Name</TableHead>
                              <TableHead>Mobile</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Created At</TableHead>
                              <TableHead className="text-right">Last Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activityData.leads.length > 0 ? (
                              activityData.leads.map((lead) => {
                                const isCreated = activityData.createdLeadIds.includes(lead.id);
                                const isUpdated = activityData.interactedLeadIds.includes(lead.id);
                                let statusLabel = '';
                                let statusVariant: 'outline' | 'secondary' | 'default' = 'outline';
                                if (isCreated && isUpdated) {
                                  statusLabel = 'Created & Updated';
                                  statusVariant = 'default';
                                } else if (isCreated) {
                                  statusLabel = 'Created';
                                  statusVariant = 'secondary';
                                } else if (isUpdated) {
                                  statusLabel = 'Updated';
                                  statusVariant = 'outline';
                                }
                                return (
                                  <TableRow key={lead.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">{lead.name || 'N/A'}</TableCell>
                                    <TableCell className="font-mono text-sm">{lead.mobile}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {[lead.city, lead.state].filter(Boolean).join(', ') || '-'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-1">
                                        {statusLabel && (
                                          <Badge variant={statusVariant} className="w-fit text-[10px]">
                                            {statusLabel}
                                          </Badge>
                                        )}
                                        {lead.converted && (
                                          <Badge variant="success" className="w-fit text-[10px]">
                                            Converted
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs">
                                      {lead.createdAt ? format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-xs">
                                      {lead.updatedAt ? format(new Date(lead.updatedAt), 'MMM dd, yyyy HH:mm') : '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No activity recorded for this user on the selected date.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground py-6">
                      Select a user to see their activity for the chosen date.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

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
              key={editingLead?.id}
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

        {/* View Lead Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">{viewingLead?.name}</DialogTitle>
                  <DialogDescription className="text-blue-100 font-medium">Lead Identity: AUD-#{viewingLead?.id?.slice(-8).toUpperCase() || 'N/A'}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Core Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
                  <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-blue-600" />
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
                    <MapPinIcon className="h-4 w-4 text-slate-400" />
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
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      CONVERTED
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-4 py-1.5 rounded-lg font-bold shadow-none">
                      <ClockIcon className="h-4 w-4 mr-2 text-slate-400" />
                      PENDING AUDIT
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement Score</p>
                  <Badge className={cn("px-4 py-1.5 rounded-lg border-0 shadow-lg font-black", getRatingColor(viewingLead?.rating || null))}>
                    <StarIcon className="h-4 w-4 mr-2 fill-current" />
                    {viewingLead?.rating ? `${viewingLead.rating}.0 / 5.0` : 'NOT SCORED'}
                  </Badge>
                </div>
              </div>

              {/* Workflow Anchors */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Interaction Plan</p>
                  <p className="text-sm font-black text-blue-600 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
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

            <DialogFooter className="p-8 border-t bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="rounded-xl px-8 font-bold text-slate-600 bg-white border-slate-200">
                CLOSE JOURNAL
              </Button>
              <Button 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditClick(viewingLead!);
                }} 
                className="rounded-xl px-8 font-extrabold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200/50"
              >
                MODIFY NODES
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

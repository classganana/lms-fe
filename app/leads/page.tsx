'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { User, Phone, MapPin, Star, Calendar as LucideCalendar, CheckCircle, Clock, Pencil, Trash2, Search, X, Filter, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { LeadForm } from '@/components/LeadForm';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';


function LeadsContent() {
  const { leads, dateRange, deleteLead, loadLeads, influencers, loadInfluencers, users, loadUsers, role } = useStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadLeads();
    loadInfluencers();
    loadUsers();
  }, [loadLeads, loadInfluencers, loadUsers]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [mobileFilter, setMobileFilter] = useState<string>('');
  const [showTodayFollowUp, setShowTodayFollowUp] = useState(false);
  
  const [influencerFilter, setInfluencerFilter] = useState('all');
  const [gstFilter, setGstFilter] = useState('all');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sourceCodeFilter, setSourceCodeFilter] = useState('all');
  const [followUpDateFilter, setFollowUpDateFilter] = useState<Date | undefined>(undefined);
  const [salesPersonFilter, setSalesPersonFilter] = useState('all');

  // Reset source code when influencer changes to 'all' (source codes are per-influencer)
  useEffect(() => {
    if (influencerFilter === 'all') setSourceCodeFilter('all');
  }, [influencerFilter]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const view = searchParams.get('view');
    const gst = searchParams.get('gst');
    
    if (status) setStatusFilter(status);
    if (rating) setRatingFilter(rating);
    if (view === 'today_followup') setShowTodayFollowUp(true);
    if (gst === 'yes' || gst === 'no') setGstFilter(gst);
  }, [searchParams]);

  // Reload leads from server when sales executive filter changes
  useEffect(() => {
    if (salesPersonFilter === 'all') {
      loadLeads();
    } else {
      loadLeads({ salesExecutiveId: salesPersonFilter });
    }
  }, [salesPersonFilter, loadLeads]);

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Priority 1: Today's Follow-up Mode (followup_date = today AND status != converted)
    if (showTodayFollowUp) {
      const todayStr = new Date().toDateString();
      filtered = filtered.filter(l => {
        if (l.converted) return false;
        if (!l.followUpDate) return false;
        // Compare by local date string to ignore time components
        return new Date(l.followUpDate).toDateString() === todayStr;
      });
    }

    // 1. Search filters (Combined name and mobile search)
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.mobile.includes(q));
    }

    // 2. Creation Date range filter (createdAt)
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(l => {
        const createdDate = new Date(l.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return createdDate >= fromDate && createdDate <= toDate;
        }
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return createdDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return createdDate <= toDate;
        }
        return true;
      });
    }

    // 3. Status filter
    if (statusFilter === 'converted') {
      filtered = filtered.filter(l => l.converted);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(l => !l.converted);
    }

    // 4. Rating filter
    if (ratingFilter === 'interested') {
      // "Interested" view: rating >= 3 and NOT converted
      filtered = filtered.filter(
        l => l.rating !== null && l.rating >= 3 && !l.converted
      );
    } else if (ratingFilter === 'not-interested') {
      filtered = filtered.filter(l => l.rating !== null && l.rating <= 2);
    } else if (ratingFilter !== 'all') {
      filtered = filtered.filter(l => l.rating === Number(ratingFilter));
    }

    // 5. Advanced Funnel Filters
    if (influencerFilter !== 'all') {
      filtered = filtered.filter(l => l.influencerId === influencerFilter);
    }

    if (gstFilter !== 'all') {
      const isGst = gstFilter === 'yes';
      filtered = filtered.filter(l => l.gstCustomer === isGst);
    }

    if (callStatusFilter !== 'all') {
      filtered = filtered.filter(l => l.callStatus === callStatusFilter);
    }

    if (sourceCodeFilter !== 'all') {
      filtered = filtered.filter(l => l.sourceCode === sourceCodeFilter);
    }

    if (followUpDateFilter) {
      const targetDate = format(followUpDateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(l => {
        if (!l.followUpDate) return false;
        return format(new Date(l.followUpDate), 'yyyy-MM-dd') === targetDate;
      });
    }

    if (salesPersonFilter !== 'all') {
      filtered = filtered.filter(l => l.createdBy === salesPersonFilter);
    }

    if (minAmount || maxAmount) {
      filtered = filtered.filter(l => {
        const amount = Number(l.salesAmount || 0);
        if (minAmount && amount < Number(minAmount)) return false;
        if (maxAmount && amount > Number(maxAmount)) return false;
        return true;
      });
    }

    return filtered;
  }, [leads, dateRange, statusFilter, ratingFilter, nameFilter, mobileFilter, showTodayFollowUp, influencerFilter, gstFilter, callStatusFilter, minAmount, maxAmount, sourceCodeFilter, followUpDateFilter, salesPersonFilter]);

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleRowClick = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert('Failed to delete lead');
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    if (rating >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <MainLayout>
      <div className="space-y-8 h-full overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {showTodayFollowUp ? "Today's Follow-ups" : "Leads"}
            </h1>
            <p className="text-muted-foreground">
              {showTodayFollowUp ? "Managing leads scheduled for today" : "Manage and track your leads"}
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-semibold">Leads Directory</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Filter and view lead details</p>
              </div>
              <div className="flex items-center gap-2">
                 <DateRangePicker />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search leads with phone and name..." 
                className="pl-10 h-11 bg-white border-slate-200"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 gap-2 border-dashed border-slate-300 px-6 font-bold text-slate-700 bg-white">
                  <Filter className="h-4 w-4" />
                  Leads Funnel
                  {(statusFilter !== 'all' || ratingFilter !== 'all' || influencerFilter !== 'all' || gstFilter !== 'all' || callStatusFilter !== 'all' || minAmount || maxAmount || sourceCodeFilter !== 'all' || followUpDateFilter || salesPersonFilter !== 'all') && (
                    <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-[1.25rem] bg-blue-100 text-blue-700">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[95vw] md:w-[800px] p-8 bg-white shadow-2xl rounded-2xl border-0 overflow-y-auto max-h-[60vh] scrollbar-hide" align="end">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-base">Leads Search Engine</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-4 text-xs font-bold text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setStatusFilter('all');
                        setRatingFilter('all');
                        setInfluencerFilter('all');
                        setGstFilter('all');
                        setCallStatusFilter('all');
                        setMinAmount('');
                        setMaxAmount('');
                        setSourceCodeFilter('all');
                        setFollowUpDateFilter(undefined);
                        setSalesPersonFilter('all');
                        setNameFilter('');
                        setMobileFilter('');
                      }}
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {role === 'ADMIN' && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employee</Label>
                        <Select value={salesPersonFilter} onValueChange={setSalesPersonFilter}>
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
                    )}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Workflow Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 bg-slate-50">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">Any Status</SelectItem>
                          <SelectItem value="converted">Converted Only</SelectItem>
                          <SelectItem value="pending">Pending Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Engagement Score</Label>
                      <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger className="h-10 bg-slate-50">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">Any Rating</SelectItem>
                          <SelectItem value="interested">High Interest (3+ ★)</SelectItem>
                          <SelectItem value="not-interested">Low Interest (1-2 ★)</SelectItem>
                          {[5,4,3,2,1].map(r => (
                            <SelectItem key={r} value={String(r)}>{r} Star Ranking</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Origin Channel (Influencer)</Label>
                      <Select value={influencerFilter} onValueChange={setInfluencerFilter}>
                        <SelectTrigger className="h-10 bg-slate-50">
                          <SelectValue placeholder="Select Channel" />
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
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GST Intelligence</Label>
                    <Select value={gstFilter} onValueChange={setGstFilter}>
                      <SelectTrigger className="h-10 bg-slate-50">
                        <SelectValue placeholder="GST Mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Any Status</SelectItem>
                        <SelectItem value="yes">GST Verified</SelectItem>
                        <SelectItem value="no">Non-GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Call Status</Label>
                      <Select value={callStatusFilter} onValueChange={setCallStatusFilter}>
                        <SelectTrigger className="h-10 bg-slate-50">
                          <SelectValue placeholder="Call Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">Any Status</SelectItem>
                          <SelectItem value="CONNECTED">Connected</SelectItem>
                          <SelectItem value="NOT_CONNECTED">Not Connected</SelectItem>
                          <SelectItem value="BUSY">Busy</SelectItem>
                          <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {influencerFilter !== 'all' && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Source Code</Label>
                        <Select value={sourceCodeFilter} onValueChange={setSourceCodeFilter}>
                          <SelectTrigger className="h-10 bg-slate-50">
                            <SelectValue placeholder="Source Code" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="all">All Codes</SelectItem>
                            {(influencers.find(inf => inf.id === influencerFilter)?.sourceCodes ?? [])
                              .filter((sc: { status?: string }) => sc.status !== 'INACTIVE')
                              .map((sc: { code: string }) => (
                                <SelectItem key={sc.code} value={sc.code}>{sc.code}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Planned Interaction Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-bold bg-slate-50", !followUpDateFilter && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                          {followUpDateFilter ? format(followUpDateFilter, 'PPPP') : 'Target a date'}
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

                    <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Investment (Min)</Label>
                    <Input 
                      type="number" 
                      placeholder="Min ₹" 
                      className="h-10 bg-slate-50"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Investment (Max)</Label>
                    <Input 
                      type="number" 
                      placeholder="Max ₹" 
                      className="h-10 bg-slate-50"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-[200px]">
              <DateRangePicker />
            </div>
          </div>
          
          {showTodayFollowUp && (
              <div className="mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 px-6 pt-2">
                <Badge className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 flex items-center gap-2">
                  <LucideCalendar className="h-3 w-3" />
                  Viewing: Today&apos;s Follow-ups
                  <X 
                    className="h-3 w-3 cursor-pointer ml-1 hover:text-red-200" 
                    onClick={() => setShowTodayFollowUp(false)} 
                  />
                </Badge>
                <span className="text-xs text-muted-foreground italic">
                  Showing only leads scheduled for follow-up on {format(new Date(), 'MMM dd, yyyy')}
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 h-11 hover:bg-transparent">
                    {role === 'ADMIN' && (
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Employee</TableHead>
                    )}
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mobile</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">State</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Rating</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">GST</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Follow-up</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Created</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="hover:bg-muted/30 transition-colors group border-b h-14 cursor-pointer"
                        onClick={() => handleRowClick(lead)}
                      >
                        {role === 'ADMIN' && (
                          <TableCell>
                            <span className="text-sm font-medium text-slate-600">
                              {users.find(u => u.id === lead.createdBy)?.name || '—'}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {lead.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono text-slate-600">{lead.mobile}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-white">
                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                            {lead.state}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-medium", getRatingColor(lead.rating))}>
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {lead.rating || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.gstCustomer ? (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium">
                              YES
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 font-normal">
                              NO
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.converted ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Converted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-blue-600/80 text-xs font-semibold">
                            <LucideCalendar className="h-3.5 w-3.5" />
                            {lead.followUpDate ? format(new Date(lead.followUpDate), 'MMM dd, yyyy') : '--'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <LucideCalendar className="h-3.5 w-3.5" />
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
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
                                size="icon"
                                className="h-8 w-8 text-rose-600 hover:bg-rose-50"
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={role === 'ADMIN' ? 10 : 9} className="text-center text-muted-foreground py-16">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-8 w-8 text-slate-300" />
                          <p>No leads found matching your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-muted/10 border-t">
                  <TableRow>
                    <TableCell colSpan={role === 'ADMIN' ? 10 : 9} className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
                      Records Found: {filteredLeads.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

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
                loadLeads();
              }}
              onCancel={() => setIsEditDialogOpen(false)}
              showCardWrapper={false} 
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-2">Delete Lead</DialogTitle>
              <DialogDescription className="py-4 text-slate-600">
                Are you sure you want to delete this lead? This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 rounded-b-lg">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="bg-white">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Lead Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
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

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
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

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="text-muted-foreground font-medium">Loading leads...</div>
          </div>
        </div>
      </MainLayout>
    }>
      <LeadsContent />
    </Suspense>
  );
}

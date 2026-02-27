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
import { User, Phone, MapPin, Star, Calendar, CheckCircle, Clock, Pencil, Trash2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { LeadForm } from '@/components/LeadForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';


function LeadsContent() {
  const { leads, dateRange, deleteLead, loadLeads } = useStore();
  const searchParams = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [mobileFilter, setMobileFilter] = useState<string>('');
  const [showTodayFollowUp, setShowTodayFollowUp] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const view = searchParams.get('view');
    
    if (status) setStatusFilter(status);
    if (rating) setRatingFilter(rating);
    if (view === 'today_followup') setShowTodayFollowUp(true);
  }, [searchParams]);

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Search filters
    if (nameFilter) {
      filtered = filtered.filter(l => l.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }
    if (mobileFilter) {
      filtered = filtered.filter(l => l.mobile.includes(mobileFilter));
    }

    // Date filter
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

    // Status filter
    if (statusFilter === 'converted') {
      filtered = filtered.filter(l => l.converted);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(l => !l.converted);
    }

    // Rating filter
    if (ratingFilter === 'interested') {
      filtered = filtered.filter(l => l.rating !== null && l.rating >= 3);
    } else if (ratingFilter === 'not-interested') {
      filtered = filtered.filter(l => l.rating !== null && l.rating <= 2);
    }

    // Today's Follow-up filter
    if (showTodayFollowUp) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(l => {
        if (!l.followUpDate) return false;
        const fDate = new Date(l.followUpDate);
        fDate.setHours(0, 0, 0, 0);
        return fDate.getTime() === today.getTime();
      });
    }

    return filtered;
  }, [leads, dateRange, statusFilter, ratingFilter, nameFilter, mobileFilter, showTodayFollowUp]);

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by mobile..."
                  value={mobileFilter}
                  onChange={(e) => setMobileFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter by Interest" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="interested">Interested (3+)</SelectItem>
                    <SelectItem value="not-interested">Not Interested (&lt;3)</SelectItem>
                  </SelectContent>
                </Select>

                {(nameFilter || mobileFilter || statusFilter !== 'all' || ratingFilter !== 'all' || showTodayFollowUp) && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setNameFilter('');
                      setMobileFilter('');
                      setStatusFilter('all');
                      setRatingFilter('all');
                      setShowTodayFollowUp(false);
                    }}
                    className="shrink-0 hover:bg-slate-100 text-rose-500"
                    title="Clear all filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {showTodayFollowUp && (
              <div className="mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Badge className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mobile</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">State</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Rating</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">GST</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Created</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="hover:bg-muted/30 transition-colors group border-b h-14"
                      >
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
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditClick(lead)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteClick(lead.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
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
                    <TableCell colSpan={7} className="text-right text-xs font-medium text-muted-foreground px-6 py-3">
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

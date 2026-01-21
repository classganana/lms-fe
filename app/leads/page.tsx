'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { User, Phone, MapPin, Star, Calendar, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';


export default function LeadsPage() {
  const { leads, dateRange, setDateRange, openModal } = useStore();
  const searchParams = useSearchParams();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Initialize filters from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    
    if (status) setStatusFilter(status);
    if (rating) setRatingFilter(rating);
  }, [searchParams]);

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Date filter is handled by store's loadLeads/useEffect in layout or manually here if we want client-side filtering on top of server data
    // The store's loadLeads uses api with dateRange. But leads might be loaded already.
    // Let's implement client side filtering for safety as shown in SalesPage
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

    return filtered;
  }, [leads, dateRange, statusFilter, ratingFilter]);

  const getRatingColor = (rating: number | null) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    if (rating >= 4) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Leads</h1>
          <p className="text-muted-foreground">Manage and track your leads</p>
        </div>

        <Card className="shadow-lg border-0">
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
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Interest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="interested">Interested (3+)</SelectItem>
                  <SelectItem value="not-interested">Not Interested (&lt;3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Mobile</TableHead>
                    <TableHead className="font-semibold">State</TableHead>
                    <TableHead className="font-semibold">Rating</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => openModal(lead, 'lead')}
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
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-mono">{lead.mobile}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
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
                          {lead.converted ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Converted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No leads found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={6} className="text-right text-muted-foreground">
                      Total Leads: {filteredLeads.length}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

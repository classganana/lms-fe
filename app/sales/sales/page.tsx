'use client';

import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store';
import { format } from 'date-fns';

export default function SalesPage() {
  const { sales, leads, influencers, dateRange } = useStore();
  const [influencerFilter, setInfluencerFilter] = useState<string>('all');
  const [gstFilter, setGstFilter] = useState<string>('all');

  // Sales History Filtering
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

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

    if (gstFilter === 'yes') {
      filtered = filtered.filter(s => s.gst);
    } else if (gstFilter === 'no') {
      filtered = filtered.filter(s => !s.gst);
    }

    return filtered;
  }, [sales, dateRange, influencerFilter, gstFilter]);

  const totals = useMemo(() => {
    return {
      count: filteredSales.length,
      revenue: filteredSales.reduce((sum, s) => sum + s.amount, 0),
      gstCount: filteredSales.filter(s => s.gst).length,
    };
  }, [filteredSales]);

  // Performance Logic
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

  // Influencer Logic
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

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Sales Overview</h1>
          <p className="text-muted-foreground">Manage sales records and view performance</p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Sales History
            </TabsTrigger>
            <TabsTrigger value="executives" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Performance
            </TabsTrigger>
            <TabsTrigger value="influencers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Influencers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                <CardTitle className="text-xl font-semibold">Sales List</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Filter and view sales data</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4 mb-6">
                  <Select value={influencerFilter} onValueChange={setInfluencerFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by influencer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Influencers</SelectItem>
                      {influencers.map((inf) => (
                        <SelectItem key={inf.id} value={inf.id}>
                          {inf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={gstFilter} onValueChange={setGstFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by GST" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">With GST</SelectItem>
                      <SelectItem value="no">Without GST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Sale Date</TableHead>
                        <TableHead className="font-semibold">Lead Name</TableHead>
                        <TableHead className="font-semibold">Mobile</TableHead>
                        <TableHead className="font-semibold">Influencer</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold">GST</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length > 0 ? (
                        filteredSales.map((sale) => {
                          const lead = leads.find(l => l.id === sale.leadId);
                          const influencer = influencers.find(i => i.id === sale.influencerId);
                          return (
                            <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">{format(new Date(sale.saleDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>{lead?.name || 'N/A'}</TableCell>
                              <TableCell className="font-mono text-sm">{lead?.mobile || 'N/A'}</TableCell>
                              <TableCell>{influencer?.name || 'N/A'}</TableCell>
                              <TableCell className="text-right font-semibold text-emerald-600">₹{sale.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={sale.gst ? 'success' : 'secondary'}>
                                  {sale.gst ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No sales found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter className="bg-muted/30">
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-semibold">
                          Totals:
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 text-lg">
                          ₹{totals.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {totals.gstCount}/{totals.count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-wrap gap-6 text-sm">
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
            <Card className="shadow-lg border-0">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="influencers" className="mt-0">
            <Card className="shadow-lg border-0">
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
                        influencerSales.map((inf, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium">{inf.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{inf.sales}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">
                              ₹{inf.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

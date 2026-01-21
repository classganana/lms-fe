'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

export default function AdminInfluencersPage() {
  const { influencers, addSourceCode, addInfluencer } = useStore();
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Add Influencer State
  const [addInfluencerOpen, setAddInfluencerOpen] = useState(false);
  const [newInfluencerName, setNewInfluencerName] = useState('');

  const handleAddInfluencer = async () => {
    if (!newInfluencerName.trim()) return;
    await addInfluencer({
      name: newInfluencerName.trim(),
    });
    setNewInfluencerName('');
    setAddInfluencerOpen(false);
  };

  const handleAddSourceCode = async () => {
    if (!selectedInfluencer || !newCode.trim()) return;
    await addSourceCode(selectedInfluencer, newCode.trim());
    setNewCode('');
    setDialogOpen(false);
    setSelectedInfluencer(null);
  };

  const activeInfluencers = influencers.map(inf => ({
    ...inf,
    sourceCodes: inf.sourceCodes.filter(sc => sc.status === 'ACTIVE'),
  }));

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Influencers</h1>
            <p className="text-muted-foreground">Manage influencer source codes and history</p>
          </div>
          <Dialog open={addInfluencerOpen} onOpenChange={setAddInfluencerOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-200">
                <Plus className="mr-2 h-5 w-5" />
                Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add New Influencer</DialogTitle>
                <DialogDescription>
                  Create a new influencer profile.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Influencer Name</label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={newInfluencerName}
                    onChange={(e) => setNewInfluencerName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddInfluencerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddInfluencer} disabled={!newInfluencerName.trim()}>
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {activeInfluencers.length > 0 ? (
            activeInfluencers.map((influencer) => (
              <Card key={influencer.id} className="shadow-lg border-0">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{influencer.name}</CardTitle>
                    <Dialog open={dialogOpen && selectedInfluencer === influencer.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) {
                        setSelectedInfluencer(null);
                        setNewCode('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInfluencer(influencer.id);
                            setDialogOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Source Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white">
                        <DialogHeader>
                          <DialogTitle>Add Source Code</DialogTitle>
                          <DialogDescription>
                            Add a new source code for {influencer.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Input
                            placeholder="Source Code"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddSourceCode}>
                            Add
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Active Source Codes</h3>
                      <div className="flex flex-wrap gap-2">
                        {influencer.sourceCodes.length > 0 ? (
                          influencer.sourceCodes.map((sc) => (
                            <Badge key={sc.id} variant="success" className="px-3 py-1 text-sm">
                              {sc.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No active codes</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Source Code History</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Code</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Updated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {influencers
                              .find(i => i.id === influencer.id)
                              ?.sourceCodes.length ? (
                                influencers
                                .find(i => i.id === influencer.id)
                                ?.sourceCodes.map((sc) => (
                                  <TableRow key={sc.id}>
                                    <TableCell className="font-medium">{sc.code}</TableCell>
                                    <TableCell>
                                      <Badge variant={sc.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                        {sc.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {format(new Date(sc.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {format(new Date(sc.updatedAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                    No history available
                                  </TableCell>
                                </TableRow>
                              )
                            }
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="text-center py-12 bg-white rounded-lg shadow border border-dashed">
                <h3 className="text-lg font-medium text-slate-900">No influencers found</h3>
                <p className="text-muted-foreground mt-1">Get started by adding a new influencer.</p>
             </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminInfluencersPage() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Add Influencer State
  const [addInfluencerOpen, setAddInfluencerOpen] = useState(false);
  const [newInfluencerName, setNewInfluencerName] = useState('');

  // Edit Influencer State
  const [editInfluencerOpen, setEditInfluencerOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<{ id: string, name: string } | null>(null);
  const [editName, setEditName] = useState('');

  const { influencers, addSourceCode, addInfluencer, updateInfluencer, deleteInfluencer, loadInfluencers, token } = useStore();

  useEffect(() => {
    loadInfluencers();
  }, [loadInfluencers]);



  const handleAddInfluencer = async () => {
    if (!newInfluencerName.trim()) return;

    try {
      if (!token) {
         alert('Authentication token missing. Please login again.');
         return;
      }
      const response = await fetch('http://18.61.48.70:3000/admin/influencers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newInfluencerName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create influencer');
      }

      await addInfluencer({
        name: newInfluencerName.trim(),
      });
      setNewInfluencerName('');
      setAddInfluencerOpen(false);
    } catch (error) {
      console.error('Error creating influencer:', error);
      alert('Failed to add influencer. Please try again.');
    }
  };



  const handleAddSourceCode = async () => {
    if (!selectedInfluencer || !newCode.trim()) return;
    try {
        await addSourceCode(selectedInfluencer, newCode.trim());
        setNewCode('');
        setDialogOpen(false);
        setSelectedInfluencer(null);
    } catch (error: any) {
        alert(error.message || 'Failed to add source code');
    }
  };

  const handleUpdateInfluencer = async () => {
    if (!editingInfluencer || !editName.trim()) return;
    try {
      await updateInfluencer(editingInfluencer.id, { name: editName.trim() });
      setEditInfluencerOpen(false);
      setEditingInfluencer(null);
      setEditName('');
    } catch (error: any) {
      alert(error.message || 'Failed to update influencer');
    }
  };

  const handleDeleteInfluencer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete influencer "${name}"?`)) return;
    try {
      await deleteInfluencer(id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete influencer');
    }
  };

  // Debug: Log influencers to check data structure
  console.log('Current Influencers State:', influencers);

  const activeInfluencers = influencers.map(inf => ({
    ...inf,
    sourceCodes: inf.sourceCodes?.filter(sc => sc.status === 'ACTIVE') || [],
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
            activeInfluencers.map((influencer) => {
              const fullInfluencer = influencers.find(i => i.id === influencer.id);
              const historySourceCodes = fullInfluencer?.sourceCodes ?? [];

              return (
              <Card key={influencer.id} className="shadow-lg border-0">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{influencer.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setEditingInfluencer({ id: influencer.id, name: influencer.name });
                          setEditName(influencer.name);
                          setEditInfluencerOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteInfluencer(influencer.id, influencer.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="w-px h-6 bg-slate-200 mx-1" />
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 pt-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Active Source Codes</h3>
                      <div className="flex flex-wrap gap-2">
                        {(influencer.sourceCodes ?? []).length > 0 ? (
                          (influencer.sourceCodes ?? []).map((sc) => (
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
                              <TableHead>Activated</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historySourceCodes.length ? (
                                historySourceCodes.map((sc: any) => (
                                  <TableRow key={sc.id}>
                                    <TableCell className="font-medium">{sc.code}</TableCell>
                                    <TableCell>
                                      <Badge variant={sc.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                        {sc.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {sc.activatedAt && !isNaN(new Date(sc.activatedAt).getTime()) 
                                        ? format(new Date(sc.activatedAt), 'MMM dd, yyyy')
                                        : '-'}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
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
            )})
          ) : (
             <div className="text-center py-12 bg-white rounded-lg shadow border border-dashed">
                <h3 className="text-lg font-medium text-slate-900">No influencers found</h3>
                <p className="text-muted-foreground mt-1">Get started by adding a new influencer.</p>
             </div>
          )}
        </div>

        {/* Edit Influencer Dialog */}
        <Dialog open={editInfluencerOpen} onOpenChange={setEditInfluencerOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Edit Influencer</DialogTitle>
              <DialogDescription>
                Update influencer details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Influencer Name</label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditInfluencerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateInfluencer} disabled={!editName.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

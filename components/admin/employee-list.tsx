'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store';
import { API_BASE_URL } from '@/lib/api';
import { Pencil, Trash2, Users, Smartphone, Mail, Lock, Shield, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface EmployeeListProps {
  employees: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function EmployeeList({ employees, loading, onRefresh }: EmployeeListProps) {
  const { token } = useStore();

  // Edit State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '' 
  });
  const [updating, setUpdating] = useState(false);

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;

    try {
      // Try DELETE on the collection route with path param
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to delete employee (${response.status})`);
      }
      
      // Refresh list
      onRefresh();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete employee');
    }
  };

  // Edit Handlers
  const openEditDialog = (employee: any) => {
    setCurrentEmployee(employee);
    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      mobile: employee.mobile || '',
      password: '' 
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!currentEmployee) return;
    setUpdating(true);

    try {
      const payload: any = {};
      // Update fields if changed
      if (editFormData.name && editFormData.name !== currentEmployee.name) {
        payload.name = editFormData.name;
      }
      if (editFormData.email && editFormData.email !== currentEmployee.email) {
        payload.email = editFormData.email;
      }
      if (editFormData.mobile && editFormData.mobile !== currentEmployee.mobile) {
        payload.mobile = editFormData.mobile;
      }
      // Include password if user typed a new one
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      console.log('Sending patch with payload:', payload);

      if (Object.keys(payload).length === 0) {
        setEditDialogOpen(false);
        setUpdating(false);
        return;
      }

      const id = currentEmployee.id || currentEmployee._id;
      // PATCH on collection route with path param
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Edit API failed:', errData);
        throw new Error(errData.message || `Failed to update employee (${response.status})`);
      }

      setEditDialogOpen(false);
      onRefresh(); 
    } catch (err: any) {
      console.error('Update error:', err);
      alert(err.message || 'Failed to update employee details');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
     <Card className="border border-border shadow-xl ring-1 ring-border/50 bg-card h-full overflow-hidden flex flex-col">
        <CardHeader className="border-b border-border bg-muted/40 backdrop-blur-sm py-5 px-6 flex flex-row items-center justify-between sticky top-0 z-10">
            <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-foreground">Team Directory</CardTitle>
                <CardDescription>View and manage {employees.length} active registered users</CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1 bg-card shadow-sm border-border text-foreground">
                {employees.length} Total Users
            </Badge>
        </CardHeader>
        <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-[30%] pl-6 py-4 font-semibold text-muted-foreground">Employee Details</TableHead>
                            <TableHead className="w-[25%] font-semibold text-muted-foreground">Contact</TableHead>
                            <TableHead className="w-[15%] font-semibold text-muted-foreground">Role</TableHead>
                            <TableHead className="w-[15%] font-semibold text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right w-[15%] pr-6 font-semibold text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [1,2,3].map((i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="h-16 px-6">
                                       <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center p-6">
                                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-lg font-medium text-foreground">No employees found</p>
                                        <p className="text-sm text-muted-foreground max-w-xs mt-1">Get started by adding a new sales executive via the form on the left.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee: any) => (
                                <TableRow key={employee.id || employee._id} className="hover:bg-muted/40 transition-colors group">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{employee.name}</span>
                                                <span className="text-xs text-muted-foreground lg:hidden">{employee.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                {employee.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                                {employee.mobile || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={employee.role === 'ADMIN' ? 'default' : 'soft-info'}
                                            className="px-2.5 py-0.5 text-xs font-semibold tracking-wide"
                                        >
                                            {employee.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`h-2 w-2 rounded-full ${employee.isActive ? 'bg-success' : 'bg-destructive'}`} />
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {employee.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 bg-info text-info-foreground hover:bg-info/85 rounded-lg"
                                                onClick={() => openEditDialog(employee)}
                                                title="Edit Employee"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {employee.role !== 'ADMIN' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 bg-destructive text-destructive-foreground hover:bg-destructive/85 rounded-lg"
                                                    onClick={() => handleDelete(employee.id || employee._id)}
                                                    title="Delete Employee"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
     </Card>

     {/* Edit Modal */}
     <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
                <Shield className="h-5 w-5 text-info" />
                Edit Employee Details
            </DialogTitle>
            <DialogDescription>
                Update account information for <span className="font-semibold text-foreground">{currentEmployee?.name}</span>
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-muted-foreground">
                    Full Name
                </Label>
                <div className="relative">
                    <Input
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({...prev, name: e.target.value}))}
                        className="pl-9"
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-muted-foreground">
                    Email Address
                </Label>
                <div className="relative">
                    <Input
                        id="edit-email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData(prev => ({...prev, email: e.target.value}))}
                        className="pl-9"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-mobile" className="text-muted-foreground">
                    Mobile Number
                </Label>
                <div className="relative">
                    <Input
                        id="edit-mobile"
                        value={editFormData.mobile}
                        onChange={(e) => setEditFormData(prev => ({...prev, mobile: e.target.value}))}
                        className="pl-9"
                    />
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-muted-foreground">
                    Reset Password
                </Label>
                <div className="relative">
                    <Input
                        id="edit-password"
                        type="text"
                        placeholder="Enter new password (optional)"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData(prev => ({...prev, password: e.target.value}))}
                        className="pl-9"
                    />
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground ml-1">Leave blank to keep current password.</p>
            </div>
        </div>
        <DialogFooter className="border-t border-border pt-4">
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updating} className="gradient-primary">
                {updating ? 'Saving Changes...' : 'Save Changes'}
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

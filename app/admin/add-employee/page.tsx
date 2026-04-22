'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { API_BASE_URL } from '@/lib/api';
import { RefreshCw } from 'lucide-react';
import { AddEmployeeForm } from '@/components/admin/add-employee-form';
import { EmployeeList } from '@/components/admin/employee-list';

export default function AddEmployeePage() {
  const { token } = useStore();
  
  // View Employees State
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch Employees on mount
  useEffect(() => {
    if (token) {
        fetchEmployees();
    }
  }, [token]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto pt-8 px-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Employee Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage sales executives, accounts, and permissions</p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={fetchEmployees}
                disabled={loadingEmployees}
                className="shadow-sm"
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingEmployees ? 'animate-spin' : ''}`} />
                Refresh List
            </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Add Employee Form */}
            <div className="xl:col-span-4 space-y-6">
                 <AddEmployeeForm onSuccess={fetchEmployees} />
            </div>

            {/* Right Column: Employee Table */}
            <div className="xl:col-span-8">
                 <EmployeeList 
                    employees={employees} 
                    loading={loadingEmployees} 
                    onRefresh={fetchEmployees} 
                 />
            </div>
        </div>
      </div>
    </MainLayout>
  );
}

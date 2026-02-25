'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { LeadForm } from '@/components/LeadForm';

export default function AddLeadPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Add New Lead</h1>
          <p className="text-muted-foreground">Create or update lead information</p>
        </div>
        <LeadForm />
      </div>
    </MainLayout>
  );
}

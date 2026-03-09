'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { LeadForm } from '@/components/LeadForm';
import { Lead } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function AddLeadContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId') ?? searchParams.get('leadid');
  const fromDuplicate = searchParams.get('duplicate') === '1';
  const initialData: Lead | undefined = leadId ? { id: leadId } as Lead : undefined;

  return (
    <MainLayout>
      <div className="space-y-8">
        {fromDuplicate && (
          <Alert className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-lg font-semibold text-amber-800 dark:text-amber-200">
              Duplicate lead detected
            </AlertTitle>
            <AlertDescription className="mt-1 text-amber-700 dark:text-amber-300">
              A lead with this mobile number already exists. You&apos;ve been redirected to the existing lead — update the details here instead of creating a new entry.
            </AlertDescription>
          </Alert>
        )}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {leadId ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <p className="text-muted-foreground">
            {leadId ? 'Update existing lead information' : 'Create or update lead information'}
          </p>
        </div>
        <LeadForm initialData={initialData} />
      </div>
    </MainLayout>
  );
}

export default function AddLeadPage() {
  return (
    <Suspense fallback={<MainLayout><div className="p-8">Loading...</div></MainLayout>}>
      <AddLeadContent />
    </Suspense>
  );
}

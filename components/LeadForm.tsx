'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { CalendarIcon, Star, CheckCircle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';
import { useLeadFormBootstrap } from '@/hooks/useLeadFormBootstrap';
import {
  extractId,
  gstStatuses,
  leadCallStatuses,
  mapLeadToFormValues,
} from '@/lib/lead-form-map';

const toId = extractId;

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
];

const GST_LABELS: Record<(typeof gstStatuses)[number], string> = {
  NO: 'No',
  YES: 'Yes',
  APPLIED: 'Applied',
  APPLIED_THROUGH_US: 'Applied Through Us',
};

const leadSchema = z.object({
  mobile: z.string().min(10, 'Mobile is too short').max(15, 'Mobile is too long'),
  name: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  email: z.string().email('Invalid email address').or(z.literal('')),
  influencerId: z.string().min(1, 'Please select an influencer'),
  sourceCode: z.string().optional(),
  callStatus: z.enum(leadCallStatuses).or(z.literal('')).refine((v) => v !== '', 'Please select call status'),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().min(1, 'Notes are required'),
  followUpDate: z.date().nullable().optional(),
  converted: z.boolean(),
  salesAmount: z.number().min(0).optional().nullable(),
  gstStatus: z.enum(gstStatuses).default('NO'),
  paymentInfoShared: z.boolean().default(false),
});

type LeadFormData = z.input<typeof leadSchema>;

interface LeadFormProps {
  initialMobile?: string;
  initialData?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCardWrapper?: boolean;
}

export function LeadForm({ initialMobile, initialData, onSuccess, onCancel, showCardWrapper = true }: LeadFormProps) {
  const router = useRouter();
  const { influencers, addLead, updateLead, loadLeads, role } = useStore();
  const bootstrap = useLeadFormBootstrap(initialData?.id);

  const [originalLead, setOriginalLead] = useState<Lead | null>(null);
  const [discoveredLead, setDiscoveredLead] = useState<Lead | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [influencerReadOnly, setInfluencerReadOnly] = useState(false);

  const hydrationKeyRef = useRef<string | null>(null);
  const discoverySnapshotRef = useRef<{ mobileDigits: string; leadId: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      mobile: initialMobile || initialData?.mobile || '',
      name: '',
      state: '',
      city: '',
      address: '',
      pincode: '',
      email: '',
      influencerId: '',
      sourceCode: '',
      callStatus: '',
      rating: null,
      notes: '',
      followUpDate: null,
      converted: false,
      salesAmount: null,
      gstStatus: 'NO',
      paymentInfoShared: false,
    },
  });

  const mobile = watch('mobile');
  const converted = watch('converted');
  const followUpDate = watch('followUpDate');
  const rating = watch('rating');
  const gstStatus = watch('gstStatus');
  const paymentInfoShared = watch('paymentInfoShared');
  const influencerId = watch('influencerId');

  // Reset source code when user manually changes influencer (new influencer has different codes).
  // Don't clear during initial form population - only when switching from one influencer to another.
  const prevInfluencerRef = useRef<string>('');
  useEffect(() => {
    if (prevInfluencerRef.current !== influencerId) {
      const wasInitialSet = prevInfluencerRef.current === '';
      prevInfluencerRef.current = influencerId || '';
      if (!wasInitialSet) {
        setValue('sourceCode', '');
      }
    }
  }, [influencerId, setValue]);

  useEffect(() => {
    if (bootstrap.status === 'loading') {
      hydrationKeyRef.current = null;
    }
  }, [bootstrap.status]);

  /**
   * Single hydration pass after bootstrap: edit = API lead + influencer options in store; create = empty row.
   */
  useEffect(() => {
    if (bootstrap.status !== 'ready') return;

    if (bootstrap.lead) {
      const lead = bootstrap.lead;
      const key = `edit:${lead.id}:${String(lead.updatedAt ?? '')}`;
      if (hydrationKeyRef.current === key) return;
      hydrationKeyRef.current = key;

      const infList = useStore.getState().influencers;
      const values = mapLeadToFormValues(lead, infList);
      prevInfluencerRef.current = values.influencerId;
      setOriginalLead(lead);
      setDiscoveredLead(null);
      setShowAlert(false);
      setInfluencerReadOnly(!!lead.influencerId);
      reset(values);
      return;
    }

    const createKey = 'create';
    if (hydrationKeyRef.current === createKey) return;
    hydrationKeyRef.current = createKey;

    prevInfluencerRef.current = '';
    setOriginalLead(null);
    setDiscoveredLead(null);
    setShowAlert(false);
    setInfluencerReadOnly(false);
    discoverySnapshotRef.current = null;
    reset({
      mobile: initialMobile || '',
      name: '',
      state: '',
      city: '',
      address: '',
      pincode: '',
      email: '',
      influencerId: '',
      sourceCode: '',
      callStatus: '',
      rating: null,
      notes: '',
      followUpDate: null,
      converted: false,
      salesAmount: null,
      gstStatus: 'NO',
      paymentInfoShared: false,
    });
  }, [bootstrap, initialMobile, reset]);

  /**
   * After options + leads list are loaded: detect duplicate mobile (add flow only).
   */
  useEffect(() => {
    if (bootstrap.status !== 'ready' || bootstrap.lead || initialData?.id) return;

    const clean = (mobile || '').replace(/\D/g, '');
    if (clean.length < 10) {
      setDiscoveredLead(null);
      setShowAlert(false);
      setInfluencerReadOnly(false);
      discoverySnapshotRef.current = null;
      return;
    }

    const mobileDigits = clean.slice(-10);
    const { leads, influencers: infList } = useStore.getState();
    const found = leads.find((l) => l.mobile.replace(/\D/g, '').slice(-10) === mobileDigits);

    if (!found) {
      setDiscoveredLead(null);
      setShowAlert(false);
      setInfluencerReadOnly(false);
      discoverySnapshotRef.current = null;
      return;
    }

    const snap = discoverySnapshotRef.current;
    if (snap && snap.mobileDigits === mobileDigits && snap.leadId === found.id) {
      return;
    }
    discoverySnapshotRef.current = { mobileDigits, leadId: found.id };

    const values = mapLeadToFormValues(found, infList);
    prevInfluencerRef.current = values.influencerId;
    setDiscoveredLead(found);
    setShowAlert(true);
    setInfluencerReadOnly(true);
    reset(values);
  }, [bootstrap, mobile, initialData?.id, reset]);

  const currentSourceCode = watch('sourceCode');
  const currentInfluencerId = watch('influencerId');

  const activeInfluencers = influencers.map(inf => {
    const activeCodes = (inf.sourceCodes ?? []).filter(sc => sc.status === 'ACTIVE');
    const hasCurrentInActive = activeCodes.some(sc => sc.code === currentSourceCode);
    const isSelectedInfluencer = toId(inf.id) === toId(currentInfluencerId);
    const existingCode = (inf.sourceCodes ?? []).find(sc => sc.code === currentSourceCode);
    // When editing, preserve the lead's existing sourceCode so Radix Select can pre-fill it:
    //  - INACTIVE codes: include the real entry so it shows with current status.
    //  - Removed/unknown codes: inject a synthetic INACTIVE option so the value renders
    //    instead of silently disappearing (fixes edit-lead dropdown wipe).
    let codesToShow = activeCodes;
    if (currentSourceCode && isSelectedInfluencer && !hasCurrentInActive) {
      if (existingCode) {
        codesToShow = [...activeCodes, existingCode];
      } else {
        const syntheticNow = new Date().toISOString();
        const synthetic = {
          id: `synthetic:${currentSourceCode}`,
          code: currentSourceCode,
          status: 'INACTIVE' as const,
          createdAt: syntheticNow,
          updatedAt: syntheticNow,
        };
        codesToShow = [...activeCodes, synthetic];
      }
    }
    return { ...inf, sourceCodes: codesToShow };
  });

  const sourceCodeOptions = activeInfluencers.find(i => toId(i.id) === toId(currentInfluencerId))?.sourceCodes ?? [];

  const isEditingExistingLead =
    Boolean(initialData?.id) || Boolean(originalLead?.id) || Boolean(discoveredLead?.id);
  const isMobileReadOnly = role !== 'ADMIN' && isEditingExistingLead;

  const onSubmit = async (data: LeadFormData) => {
    try {
      let savedLead: Lead;
      
      const selectedInfluencer = influencers.find(i => String(i.id) === String(data.influencerId));
      const activeSourceCode = data.sourceCode || '';

      if (data.influencerId && !activeSourceCode) {
        setSubmitError('Please select a source code.');
        return;
      }

      const ratingNum = data.rating != null ? Number(data.rating) : undefined;

      const payload: any = {
        name: data.name || '',
        mobile: data.mobile,
        state: data.state || '',
        city: data.city || '',
        address: data.address || '',
        pincode: data.pincode || '',
        ...(data.email?.trim() && { email: data.email.trim() }),
        influencerId: data.influencerId,
        sourceCode: data.sourceCode || activeSourceCode,
        callStatus: data.callStatus,
        ...(ratingNum != null && ratingNum >= 1 && ratingNum <= 5 && { rating: ratingNum }),
        notes: data.notes,
        converted: data.converted,
        amount: Number(data.salesAmount) || 0,
        salesAmount: Number(data.salesAmount) || 0,
        gstStatus: data.gstStatus || 'NO',
        gst: ['YES', 'APPLIED', 'APPLIED_THROUGH_US'].includes(data.gstStatus || 'NO'),
        gstCustomer: ['YES', 'APPLIED', 'APPLIED_THROUGH_US'].includes(data.gstStatus || 'NO'),
        paymentInfoShared: data.paymentInfoShared,
        followUpDate: data.followUpDate ? data.followUpDate.toISOString() : null,
      };

      console.log('🚀 Preparing to save lead. ID:', originalLead?.id || 'NEW');
      console.log('📦 Content:', payload);

      if (originalLead) {
        // Update existing lead (Edit Mode)
        const patchPayload = { ...payload };
        if (role !== 'ADMIN') delete patchPayload.mobile;
        await updateLead(originalLead.id, patchPayload);
        savedLead = { 
          ...originalLead, 
          ...data,
          followUpDate: payload.followUpDate,
          updatedAt: new Date().toISOString() 
        } as Lead;
      } else if (discoveredLead) {
        // Update discovered lead (Add Mode turned into Edit)
        const patchPayload = { ...payload };
        if (role !== 'ADMIN') delete patchPayload.mobile;
        await updateLead(discoveredLead.id, patchPayload);
        savedLead = { 
          ...discoveredLead, 
          ...data, 
          followUpDate: payload.followUpDate,
          updatedAt: new Date().toISOString() 
        } as Lead;
      } else {
        // Create new lead
        savedLead = await addLead(payload);
      }

      // Create sale if converted is true and sale details are provided
      if (data.converted && data.salesAmount && data.salesAmount > 0) {
        // Check if sale already exists for this lead
        const { sales, addSale } = useStore.getState();
        const existingSale = sales.find(s => s.leadId === savedLead.id);
        
        if (!existingSale) {
          await addSale({
            leadId: savedLead.id,
            influencerId: savedLead.influencerId,
            amount: data.salesAmount || 0,
            gst: ['YES', 'APPLIED', 'APPLIED_THROUGH_US'].includes(data.gstStatus || 'NO'),
            saleDate: new Date().toISOString(),
          });
        }
      }
      
      setShowConfirmDialog(true);
      setSubmitError(null);
    } catch (error) {
      console.error('Error saving lead:', error);
      const message = error instanceof Error ? error.message : 'Failed to save lead. Please try again.';
      const existingLeadId = (error as Error & { leadId?: string }).leadId;
      setSubmitError(message);
      // Same-user duplicate: navigate to edit so they can update their own lead (no page refresh)
      if (existingLeadId) {
        router.push(`/sales/add-lead?leadId=${encodeURIComponent(existingLeadId)}&duplicate=1`);
        return;
      }
    }
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    // Ensure store is updated before navigating
    const { loadLeads, loadSales } = useStore.getState();
    await loadLeads();
    await loadSales();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/sales/dashboard');
    }
  };

  const handleRatingClick = (value: number) => {
    if (watch('callStatus') === 'WRONG_NUMBER') {
      setValue('rating', null);
      return;
    }
    setValue('rating', value);
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <Alert variant="destructive" className="border-l-4 border-l-destructive bg-danger-soft border-destructive/20 shadow-md mb-4">
          <AlertTitle className="font-semibold text-destructive">Validation Error</AlertTitle>
          <AlertDescription className="mt-1 text-destructive">{submitError}</AlertDescription>
        </Alert>
      )}
      {(showAlert && (discoveredLead || originalLead)) && (
        <Alert className="border-l-4 border-l-blue-500 shadow-md mb-4">
          <AlertTitle className="font-semibold">Lead Information</AlertTitle>
          <AlertDescription className="mt-1">
            {originalLead 
              ? `You are editing ${originalLead.name}'s details.` 
              : `A lead with this mobile number already exists (${discoveredLead?.name}). Switching to edit mode.`}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Mobile Number <span className="text-destructive">*</span></label>
          <Input
            {...register('mobile')}
            placeholder="9876543210"
            readOnly={isMobileReadOnly}
            autoComplete={isMobileReadOnly ? 'off' : 'tel'}
            className={cn(
              "h-11 border-2 transition-colors",
              isMobileReadOnly ? 'bg-muted cursor-not-allowed' : 'hover:border-primary/50 focus:border-primary',
              errors.mobile && 'border-destructive'
            )}
          />
          {isMobileReadOnly && (
            <p className="text-xs text-muted-foreground">Mobile can only be changed by an administrator.</p>
          )}
          {errors.mobile && (
            <p className="text-sm text-red-600 font-medium">{errors.mobile.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Name</label>
          <Input 
            {...register('name')} 
            placeholder="John Doe"
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.name && 'border-destructive'
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">State</label>
          <Select
            value={watch('state')}
            onValueChange={(value) => setValue('state', value)}
          >
            <SelectTrigger className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50",
              errors.state && 'border-destructive'
            )}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-600 font-medium">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">City</label>
          <Input 
            {...register('city')} 
            placeholder="Bangalore"
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.city && 'border-destructive'
            )}
          />
          {errors.city && (
            <p className="text-sm text-red-600 font-medium">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Address</label>
          <Input 
            {...register('address')} 
            placeholder="123 Main Street"
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.address && 'border-destructive'
            )}
          />
          {errors.address && (
            <p className="text-sm text-red-600 font-medium">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Pincode</label>
          <Input 
            {...register('pincode')} 
            placeholder="560001"
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.pincode && 'border-destructive'
            )}
          />
          {errors.pincode && (
            <p className="text-sm text-red-600 font-medium">{errors.pincode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Email</label>
          <Input 
            {...register('email')} 
            placeholder="jane.doe@example.com"
            type="email"
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.email && 'border-destructive'
            )}
          />
          {errors.email && (
            <p className="text-sm text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Influencer <span className="text-destructive">*</span></label>
          <Select
            value={watch('influencerId')}
            onValueChange={(value) => setValue('influencerId', value)}
            disabled={influencerReadOnly}
          >
            <SelectTrigger className={cn(
              "h-11 border-2 transition-colors",
              influencerReadOnly ? 'bg-muted cursor-not-allowed' : 'hover:border-primary/50',
              errors.influencerId && 'border-destructive'
            )}>
              <SelectValue placeholder="Select influencer" />
            </SelectTrigger>
            <SelectContent>
              {activeInfluencers.map((inf) => (
                <SelectItem key={inf.id} value={inf.id}>
                  {inf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.influencerId && (
            <p className="text-sm text-red-600 font-medium">{errors.influencerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Source Code <span className="text-destructive">*</span></label>
          <Select
            value={watch('sourceCode') || 'placeholder'}
            onValueChange={(value: string) => {
              if (value === 'placeholder') {
                setValue('sourceCode', '');
                return;
              }
              setValue('sourceCode', value);
            }}
            disabled={!watch('influencerId')}
          >
            <SelectTrigger className={cn(
              "h-11 border-2 transition-colors",
              !watch('influencerId') ? 'bg-muted' : 'hover:border-primary/50',
              errors.sourceCode && 'border-destructive'
            )}>
              <SelectValue placeholder="Select source code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">
                Select source code
              </SelectItem>
              {sourceCodeOptions.map((sc) => (
                <SelectItem key={sc.code} value={sc.code}>
                  {sc.code}
                  {sc.status === 'INACTIVE' ? ' (inactive)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!watch('influencerId') && (
            <p className="text-sm text-muted-foreground">Select an influencer first</p>
          )}
          {watch('influencerId') && (activeInfluencers.find(i => String(i.id) === String(watch('influencerId')))?.sourceCodes ?? []).length === 0 && (
            <p className="text-sm text-amber-600">No active source codes — contact admin to activate</p>
          )}
          {errors.sourceCode && (
            <p className="text-sm text-red-600 font-medium">{errors.sourceCode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Call Status <span className="text-destructive">*</span></label>
          <Select
            value={watch('callStatus') || 'placeholder'}
            onValueChange={(value: string) => {
              if (value === 'placeholder') {
                setValue('callStatus', '');
                return;
              }
              setValue('callStatus', value as (typeof leadCallStatuses)[number]);
              if (value === 'WRONG_NUMBER') {
                setValue('rating', null);
              }
            }}
          >
            <SelectTrigger className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50",
              errors.callStatus && 'border-destructive'
            )}>
              <SelectValue placeholder="Select call status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">
                Select call status
              </SelectItem>
              {leadCallStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.callStatus && (
            <p className="text-sm text-red-600 font-medium">{errors.callStatus.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                type="button"
                variant={rating === value ? 'default' : 'outline'}
                size="icon"
                onClick={() => handleRatingClick(value)}
                disabled={watch('callStatus') === 'WRONG_NUMBER'}
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    rating && rating >= value ? 'fill-yellow-400 text-yellow-400' : ''
                  )}
                />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Notes <span className="text-destructive">*</span></label>
          <Input 
            {...register('notes')} 
            placeholder="Enter notes here..."
            className={cn(
              "h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary",
              errors.notes && 'border-destructive'
            )}
          />
          {errors.notes && (
            <p className="text-sm text-red-600 font-medium">{errors.notes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Follow-up Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !followUpDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {followUpDate ? format(followUpDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 border border-border rounded-md shadow-md">
              <Calendar
                mode="single"
                selected={followUpDate || undefined}
                onSelect={(date) => setValue('followUpDate', date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Converted</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('converted', !converted)}
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                converted ? "bg-emerald-500" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-card shadow-lg transition-transform",
                  converted ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm font-semibold transition-colors", converted ? "text-emerald-600" : "text-muted-foreground")}>
              {converted ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">GST Status</label>
          <Select
            value={gstStatus || 'NO'}
            onValueChange={(v) => setValue('gstStatus', v as (typeof gstStatuses)[number])}
          >
            <SelectTrigger className={cn("h-11 border-2 transition-colors hover:border-primary/50", errors.gstStatus && "border-destructive")}>
              <SelectValue placeholder="Select GST status" />
            </SelectTrigger>
            <SelectContent>
              {gstStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {GST_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gstStatus && (
            <p className="text-sm text-red-600 font-medium">{errors.gstStatus.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <Checkbox
            id="paymentInfoShared"
            checked={paymentInfoShared}
            onCheckedChange={(c) => setValue('paymentInfoShared', c === true)}
          />
          <div className="space-y-1">
            <label htmlFor="paymentInfoShared" className="text-sm font-semibold text-foreground cursor-pointer leading-none">
              Payment information shared with lead
            </label>
            <p className="text-xs text-muted-foreground">
              Check when payment-related details have been communicated to this lead.
            </p>
          </div>
        </div>

        {converted && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Sale Amount <span className="text-destructive">*</span></label>
              <Input
                type="number"
                {...register('salesAmount', { valueAsNumber: true })}
                placeholder="50000"
                className="h-11 border-2 transition-colors hover:border-primary/50 focus:border-primary"
              />
              {errors.salesAmount && (
                <p className="text-sm text-red-600 font-medium">{errors.salesAmount.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <Button 
          type="submit" 
          className="h-11 px-8 gradient-primary shadow-md hover:shadow-lg font-semibold"
        >
          Save Lead
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => (onCancel ? onCancel() : router.back())}
          className="h-11 px-8 font-semibold"
        >
          Cancel
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-success-soft border border-success/30 sm:max-w-md">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
            <div className="rounded-full bg-success/20 p-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl text-success">Lead Saved Successfully!</DialogTitle>
            <DialogDescription className="text-success font-medium">
              The lead details have been recorded in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pb-4">
            <Button
              onClick={handleConfirm}
              className="bg-success text-success-foreground hover:bg-success/85 min-w-[120px]"
            >
              Okay, Great!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );

  const blockingLoader = (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium text-center px-4">
        Loading influencers, source codes, and lead data…
      </p>
    </div>
  );

  if (bootstrap.status === 'error') {
    const errWrap = (
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Could not load lead form</AlertTitle>
        <AlertDescription className="mt-2">{bootstrap.message}</AlertDescription>
        <Button type="button" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Alert>
    );
    if (!showCardWrapper) {
      return <div className="space-y-4">{errWrap}</div>;
    }
    return (
      <div className="space-y-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">{errWrap}</CardContent>
        </Card>
      </div>
    );
  }

  if (bootstrap.status === 'loading') {
    if (!showCardWrapper) {
      return <div className="min-h-[240px] flex items-center justify-center">{blockingLoader}</div>;
    }
    return (
      <div className="space-y-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-10">{blockingLoader}</CardContent>
        </Card>
      </div>
    );
  }

  if (!showCardWrapper) {
    return (
      <div className="space-y-6">
        {formContent}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-2xl font-semibold">Lead Information</CardTitle>
          <CardDescription className="mt-1.5">Enter the lead details below. All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
}

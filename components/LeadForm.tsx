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
import { CalendarIcon, Star, CheckCircle } from 'lucide-react';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
];

const callStatuses = ['CONNECTED', 'NOT_CONNECTED', 'BUSY', 'WRONG_NUMBER'] as const;

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
  callStatus: z.enum(callStatuses).or(z.literal('')).refine((v) => v !== '', 'Please select call status'),
  rating: z.number().min(1).max(5).nullable().optional(),
  notes: z.string().min(1, 'Notes are required'),
  followUpDate: z.date().nullable().optional(),
  converted: z.boolean(),
  salesAmount: z.number().min(0).optional().nullable(),
  gstCustomer: z.boolean().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialMobile?: string;
  initialData?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCardWrapper?: boolean;
}

export function LeadForm({ initialMobile, initialData, onSuccess, onCancel, showCardWrapper = true }: LeadFormProps) {
  const router = useRouter();
  const { influencers, users, addLead, updateLead, loadLeads, loadUsers, loadInfluencers } = useStore();
  const [originalLead, setOriginalLead] = useState<Lead | null>(null);
  const [discoveredLead, setDiscoveredLead] = useState<Lead | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mobileReadOnly, setMobileReadOnly] = useState(false);
  const [influencerReadOnly, setInfluencerReadOnly] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadInfluencers();
    loadLeads();
  }, [loadUsers, loadInfluencers, loadLeads]);


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
      gstCustomer: false,
    },
  });

  const mobile = watch('mobile');
  const converted = watch('converted');
  const followUpDate = watch('followUpDate');
  const rating = watch('rating');
  const gstCustomer = watch('gstCustomer');
  const influencerId = watch('influencerId');

  // Reset source code when influencer changes (new influencer may have different codes)
  const prevInfluencerRef = useRef<string>('');
  useEffect(() => {
    if (prevInfluencerRef.current !== influencerId) {
      prevInfluencerRef.current = influencerId || '';
      setValue('sourceCode', '');
    }
  }, [influencerId, setValue]);

  // Check for existing lead and populate form
  useEffect(() => {
    const isTrue = (val: any) => val === true || val === 'true' || val === 1 || val === '1';

    const populateForm = async () => {
      // Prevent redundant runs that overwrite fetched state with stale parent props
      if (!isInitialLoad) return;

      let leadToUse = initialData;

      // 1. Fetch fresh FULL data from API if we are editing (have ID)
      if (initialData?.id) {
        setIsLoading(true);
        try {
          const { token } = useStore.getState();
          const response = await fetch(`${API_BASE_URL}/sales/leads/${initialData.id}`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          if (response.ok) {
            const freshData = await response.json();
            console.log('📡 Fetched Full Lead Details:', freshData);
            leadToUse = {
              ...freshData,
              id: String(freshData.id || freshData._id)
            };
          }
        } catch (error) {
          console.error('Error fetching lead details:', error);
        } finally {
          setIsLoading(false);
        }
      }

      if (leadToUse) {
        setOriginalLead(leadToUse);
        
        const backendAmount = Number(leadToUse.salesAmount || (leadToUse as any).amount || 0);
        const isConverted = isTrue(leadToUse.converted) || backendAmount > 0;
        const isGst = leadToUse.gstStatus === 'YES' || isTrue(leadToUse.gstStatus) || isTrue(leadToUse.gst) || isTrue(leadToUse.gstCustomer);

        // Robust date parsing
        let fDate: Date | null = null;
        if (leadToUse.followUpDate) {
          const parsed = new Date(leadToUse.followUpDate);
          if (!isNaN(parsed.getTime())) fDate = parsed;
        }

        reset({
          mobile: String(leadToUse.mobile || ''),
          name: String(leadToUse.name || ''),
          state: String(leadToUse.state || ''),
          city: String(leadToUse.city || ''),
          address: String(leadToUse.address || ''),
          pincode: String(leadToUse.pincode || ''),
          email: String(leadToUse.email || ''),
          influencerId: String(leadToUse.influencerId || ''),
          sourceCode: String(leadToUse.sourceCode || ''),
            callStatus: leadToUse.callStatus || '',
          rating: leadToUse.rating ?? null,
          notes: String(leadToUse.notes || ''),
          followUpDate: fDate,
          converted: isConverted,
          salesAmount: backendAmount || null,
          gstCustomer: isGst,
        });

        if (leadToUse.influencerId) setInfluencerReadOnly(true);
      } else if (mobile && mobile.replace(/[^0-9]/g, '').length >= 10 && !initialData) {
        const { leads } = useStore.getState();
        const cleanSearchMobile = mobile.slice(-10);
        const found = leads.find((l) => l.mobile.includes(cleanSearchMobile));
        
        if (found) {
          setDiscoveredLead(found);
          setShowAlert(true);
          
          const backendAmount = Number(found.salesAmount || (found as any).amount || 0);
          const isConverted = isTrue(found.converted) || backendAmount > 0;
          const isGst = found.gstStatus === 'YES' || isTrue(found.gstStatus) || isTrue(found.gst) || isTrue(found.gstCustomer);

          let fDate: Date | null = null;
          if (found.followUpDate) {
            const parsed = new Date(found.followUpDate);
            if (!isNaN(parsed.getTime())) fDate = parsed;
          }

          reset({
            mobile: found.mobile || '',
            name: found.name || '',
            state: found.state || '',
            city: found.city || '',
            address: found.address || '',
            pincode: found.pincode || '',
            email: found.email || '',
            influencerId: found.influencerId || '',
            sourceCode: found.sourceCode || '',
            callStatus: found.callStatus || '',
            rating: found.rating ?? null,
            notes: found.notes || '',
            followUpDate: fDate,
            converted: isConverted,
            salesAmount: backendAmount || null,
            gstCustomer: isGst,
          });

          setInfluencerReadOnly(true);
        } else {
          setDiscoveredLead(null);
          setShowAlert(false);
          setInfluencerReadOnly(false);
        }
      }
      
      // Mark as initialized so re-renders don't wipe the form
      setIsInitialLoad(false);
    };

    populateForm();
  }, [initialData, mobile, reset, isInitialLoad]);


  const activeInfluencers = influencers.map(inf => ({
    ...inf,
    sourceCodes: (inf.sourceCodes ?? []).filter(sc => sc.status === 'ACTIVE'),
  }));

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
        gstStatus: data.gstCustomer ? 'YES' : 'NO',
        gst: Boolean(data.gstCustomer),
        gstCustomer: Boolean(data.gstCustomer),
        followUpDate: data.followUpDate ? data.followUpDate.toISOString() : null,
      };

      console.log('🚀 Preparing to save lead. ID:', originalLead?.id || 'NEW');
      console.log('📦 Content:', payload);

      if (originalLead) {
        // Update existing lead (Edit Mode)
        await updateLead(originalLead.id, payload);
        savedLead = { 
          ...originalLead, 
          ...data,
          followUpDate: payload.followUpDate,
          updatedAt: new Date().toISOString() 
        } as Lead;
      } else if (discoveredLead) {
        // Update discovered lead (Add Mode turned into Edit)
        await updateLead(discoveredLead.id, payload);
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
            gst: data.gstCustomer || false,
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
      if (existingLeadId) {
        window.location.href = `/sales/add-lead?leadId=${encodeURIComponent(existingLeadId)}&duplicate=1`;
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
        <Alert variant="destructive" className="border-l-4 border-l-destructive shadow-md mb-4">
          <AlertTitle className="font-semibold">Validation Error</AlertTitle>
          <AlertDescription className="mt-1">{submitError}</AlertDescription>
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
            readOnly={mobileReadOnly}
            className={cn(
              "h-11 border-2 transition-colors",
              mobileReadOnly ? 'bg-muted cursor-not-allowed' : 'hover:border-primary/50 focus:border-primary',
              errors.mobile && 'border-destructive'
            )}
          />
          {errors.mobile && (
            <p className="text-sm text-destructive font-medium">{errors.mobile.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
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
            <SelectContent className="bg-white">
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-destructive font-medium">{errors.state.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.city.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.address.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.pincode.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
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
            <SelectContent className="bg-white">
              {activeInfluencers.map((inf) => (
                <SelectItem key={inf.id} value={inf.id}>
                  {inf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.influencerId && (
            <p className="text-sm text-destructive font-medium">{errors.influencerId.message}</p>
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
            <SelectContent className="bg-white">
              <SelectItem value="placeholder">
                Select source code
              </SelectItem>
              {(activeInfluencers
                .find(i => String(i.id) === String(watch('influencerId')))
                ?.sourceCodes ?? []
              ).map((sc) => (
                <SelectItem key={sc.code} value={sc.code}>
                  {sc.code}
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
            <p className="text-sm text-destructive font-medium">{errors.sourceCode.message}</p>
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
              setValue('callStatus', value as typeof callStatuses[number]);
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
            <SelectContent className="bg-white">
              <SelectItem value="placeholder">
                Select call status
              </SelectItem>
              {callStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.callStatus && (
            <p className="text-sm text-destructive font-medium">{errors.callStatus.message}</p>
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
            <p className="text-sm text-destructive font-medium">{errors.notes.message}</p>
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
            <PopoverContent className="w-auto p-4 bg-white border rounded-md shadow-md">
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
                converted ? "bg-emerald-500" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
                  converted ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm font-semibold transition-colors", converted ? "text-emerald-600" : "text-slate-500")}>
              {converted ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">GST Customer</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('gstCustomer', !gstCustomer)}
              className={cn(
                "relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                gstCustomer ? "bg-blue-500" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
                  gstCustomer ? "translate-x-8" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm font-semibold transition-colors", gstCustomer ? "text-blue-600" : "text-slate-500")}>
              {gstCustomer ? 'Yes' : 'No'}
            </span>
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
                <p className="text-sm text-destructive font-medium">{errors.salesAmount.message}</p>
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
        <DialogContent className="bg-emerald-50 border-emerald-200 sm:max-w-md">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl text-emerald-800">Lead Saved Successfully!</DialogTitle>
            <DialogDescription className="text-emerald-700 font-medium">
              The lead details have been recorded in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center pb-4">
            <Button 
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              Okay, Great!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );

  if (!showCardWrapper) {
    return (
      <div className="space-y-6">
        {formContent}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground font-medium">Fetching latest lead details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
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

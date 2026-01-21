'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/store';
import { format } from 'date-fns';
import { CalendarIcon, Star } from 'lucide-react';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';

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
  mobile: z.string().min(10, 'Mobile number must be 10 digits').max(10, 'Mobile number must be 10 digits'),
  name: z.string().min(1, 'Name is required'),
  state: z.string().min(1, 'State is required'),
  influencerId: z.string().min(1, 'Influencer is required'),
  callStatus: z.enum(callStatuses),
  rating: z.number().min(1).max(5).nullable(),
  followUpDate: z.date().nullable(),
  converted: z.boolean(),
  saleAmount: z.number().min(0).optional(),
  saleGst: z.boolean().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function AddLeadPage() {
  const router = useRouter();
  const { influencers, addLead, updateLead, loadLeads } = useStore();
  const [existingLead, setExistingLead] = useState<Lead | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mobileReadOnly, setMobileReadOnly] = useState(false);
  const [influencerReadOnly, setInfluencerReadOnly] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      mobile: '',
      name: '',
      state: '',
      influencerId: '',
      callStatus: 'CONNECTED',
      rating: null,
      followUpDate: null,
      converted: false,
      saleAmount: 0,
      saleGst: false,
    },
  });

  const mobile = watch('mobile');
  const converted = watch('converted');
  const followUpDate = watch('followUpDate');
  const rating = watch('rating');
  const saleGst = watch('saleGst');

  // Check for existing lead when mobile changes
  useEffect(() => {
    const checkExistingLead = async () => {
      if (mobile && mobile.length === 10) {
        // Reload leads to get latest data
        await loadLeads();
        const updatedLeads = useStore.getState().leads;
        const existing = updatedLeads.find(l => l.mobile === mobile);
        
        if (existing) {
          setExistingLead(existing);
          setShowAlert(true);
          setMobileReadOnly(true);
          
          // Auto-fill form
          setValue('name', existing.name);
          setValue('state', existing.state);
          setValue('influencerId', existing.influencerId);
          setInfluencerReadOnly(true);
          setValue('callStatus', existing.callStatus);
          setValue('rating', existing.rating);
          setValue('converted', existing.converted);
          if (existing.followUpDate) {
            setValue('followUpDate', new Date(existing.followUpDate));
          }
        } else {
          setExistingLead(null);
          setShowAlert(false);
          setMobileReadOnly(false);
          setInfluencerReadOnly(false);
        }
      }
    };

    checkExistingLead();
  }, [mobile, setValue, loadLeads]);

  const activeInfluencers = influencers.map(inf => ({
    ...inf,
    sourceCodes: inf.sourceCodes.filter(sc => sc.status === 'ACTIVE'),
  }));

  const onSubmit = async (data: LeadFormData) => {
    try {
      let savedLead: Lead;
      
      if (existingLead) {
        // Update existing lead
        await updateLead(existingLead.id, {
          ...data,
          followUpDate: data.followUpDate ? data.followUpDate.toISOString() : null,
        });
        // Reload leads to get updated lead
        const { loadLeads } = useStore.getState();
        await loadLeads();
        const updatedLeads = useStore.getState().leads;
        savedLead = updatedLeads.find(l => l.id === existingLead.id) || existingLead;
      } else {
        // Create new lead using store's addLead function
        savedLead = await addLead({
          ...data,
          followUpDate: data.followUpDate ? data.followUpDate.toISOString() : null,
        });
      }

      // Create sale if converted is true and sale details are provided
      if (data.converted && data.saleAmount && data.saleAmount > 0) {
        // Check if sale already exists for this lead
        const { sales, addSale } = useStore.getState();
        const existingSale = sales.find(s => s.leadId === savedLead.id);
        
        if (!existingSale) {
          await addSale({
            leadId: savedLead.id,
            influencerId: savedLead.influencerId,
            amount: data.saleAmount || 0,
            gst: data.saleGst || false,
            saleDate: new Date().toISOString(),
          });
        }
      }
      
      setShowConfirmDialog(true);
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Failed to save lead. Please try again.');
    }
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    // Ensure store is updated before navigating
    const { loadLeads, loadSales } = useStore.getState();
    await loadLeads();
    await loadSales();
    router.push('/sales/dashboard');
  };

  const handleRatingClick = (value: number) => {
    // eslint-disable-next-line react-hooks/incompatible-library
    if (watch('callStatus') === 'WRONG_NUMBER') {
      setValue('rating', null);
      return;
    }
    setValue('rating', value);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Add New Lead</h1>
          <p className="text-muted-foreground">Create or update lead information</p>
        </div>

        {showAlert && existingLead && (
          <Alert className="border-l-4 border-l-blue-500 shadow-md">
            <AlertTitle className="font-semibold">Lead Found</AlertTitle>
            <AlertDescription className="mt-1">
              A lead with this mobile number already exists. The form has been auto-filled with existing data.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="text-2xl font-semibold">Lead Information</CardTitle>
            <CardDescription className="mt-1.5">Enter the lead details below. All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <label className="text-sm font-semibold text-foreground">Name <span className="text-destructive">*</span></label>
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
                  <label className="text-sm font-semibold text-foreground">State <span className="text-destructive">*</span></label>
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
                    <SelectContent className="bg-white dark:bg-gray-200">
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
                    <SelectContent className="bg-white dark:bg-gray-200">
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
                  <label className="text-sm font-medium">Call Status *</label>
                  <Select
                    value={watch('callStatus')}
                    onValueChange={(value: typeof callStatuses[number]) => {
                      setValue('callStatus', value);
                      if (value === 'WRONG_NUMBER') {
                        setValue('rating', null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-200">
                      {callStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <PopoverContent className="w-auto p-0">
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
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={converted}
                      onCheckedChange={(checked) => setValue('converted', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {converted ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {converted && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sale Amount *</label>
                      <Input
                        type="number"
                        {...register('saleAmount', { valueAsNumber: true })}
                        placeholder="50000"
                      />
                      {errors.saleAmount && (
                        <p className="text-sm text-destructive">{errors.saleAmount.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">GST</label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={saleGst}
                          onCheckedChange={(checked) => setValue('saleGst', checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {saleGst ? 'Yes' : 'No'}
                        </span>
                      </div>
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
                  onClick={() => router.back()}
                  className="h-11 px-8 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lead Saved</DialogTitle>
              <DialogDescription>
                The lead has been saved successfully.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleConfirm}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

'use client';

import { useStore } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Influencer, Lead, LeadInteraction, Sale } from '@/types';
import { format } from 'date-fns';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Star,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function DetailModal() {
  const { selectedItem, selectedItemType, isModalOpen, closeModal } = useStore();

  const renderContent = () => {
    // Show detail view
    if (selectedItem && selectedItemType) {
      switch (selectedItemType) {
        case 'influencer':
          return <InfluencerDetails influencer={selectedItem as Influencer} />;
        case 'lead':
          return <LeadDetails lead={selectedItem as Lead} />;
        case 'interaction':
          return <InteractionDetails interaction={selectedItem as LeadInteraction} />;
        case 'sale':
          return <SaleDetails sale={selectedItem as Sale} />;
        default:
          return null;
      }
    }

    return null;
  };

  const getTitle = () => {
    if (selectedItemType) {
      return selectedItemType.charAt(0).toUpperCase() + selectedItemType.slice(1) + ' Details';
    }
    return 'Details';
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 bg-card">
        <DialogHeader className="px-8 py-5 border-b border-border bg-muted/40">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(95vh-80px)] overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Detail Components
function InfluencerDetails({ influencer }: { influencer: Influencer }) {
  const { leads } = useStore();
  // Lead Source / Conversion Source: unique sourceCode values from leads under this influencer
  const leadSourceCodes = [...new Set(
    leads
      .filter((l) => l.influencerId === influencer.id && l.sourceCode?.trim())
      .map((l) => l.sourceCode!.trim())
  )].sort();
  const sourceDisplay = leadSourceCodes.length > 0
    ? leadSourceCodes.join(' / ')
    : 'N/A';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={User} label="Influencer ID" value={influencer.id} />
        <InfoCard icon={User} label="Name" value={influencer.name} valueClass="text-xl font-bold" />
        <InfoCard icon={TrendingUp} label="Lead Source / Conversion Source" value={sourceDisplay} valueClass="font-semibold" />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Source Codes
        </h3>
        <div className="grid gap-3">
          {(influencer.sourceCodes ?? []).length > 0 ? (
            (influencer.sourceCodes ?? []).map((sc) => (
              <div key={sc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center gap-3">
                  <code className="px-3 py-1 bg-muted text-foreground rounded-md font-mono text-sm font-semibold">
                    {sc.code}
                  </code>
                  <Badge variant={sc.status === 'ACTIVE' ? 'default' : 'secondary'} className="font-normal">
                    {sc.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {format(new Date(sc.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">No source codes available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadDetails({ lead }: { lead: Lead }) {
  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/50'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">{lead.name}</h2>
          <p className="text-muted-foreground">Lead ID: {lead.id}</p>
        </div>
        {lead.converted ? (
          <Badge variant="soft-success" className="text-base px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            Converted
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Badge>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={Phone} label="Mobile" value={lead.mobile} />
        <InfoCard icon={MapPin} label="State" value={lead.state} />
        <InfoCard 
          icon={Star} 
          label="Rating" 
          value={
            <div className="flex items-center gap-2">
              <div className="flex gap-1">{getRatingStars(lead.rating)}</div>
              <span className="text-sm font-semibold">{lead.rating ? `${lead.rating}/5` : 'Not rated'}</span>
            </div>
          } 
        />
        <InfoCard 
          icon={Calendar} 
          label="Created At" 
          value={format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm')} 
        />
        <InfoCard 
          icon={Calendar} 
          label="Last Updated" 
          value={format(new Date(lead.updatedAt), 'MMM dd, yyyy HH:mm')} 
        />
      </div>
    </div>
  );
}

function InteractionDetails({ interaction }: { interaction: LeadInteraction }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={User} label="Interaction ID" value={interaction.id} />
        <InfoCard icon={User} label="Lead ID" value={interaction.leadId} />
      </div>

      <Separator />

      {interaction.notes && (
        <div className="p-4 bg-muted/40 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Notes</h3>
          <p className="text-sm leading-relaxed">{interaction.notes}</p>
        </div>
      )}

      <InfoCard 
        icon={Calendar} 
        label="Created At" 
        value={format(new Date(interaction.createdAt), 'MMM dd, yyyy HH:mm')} 
      />
    </div>
  );
}

function SaleDetails({ sale }: { sale: Sale }) {
  const { leads, influencers } = useStore();
  const lead = leads.find(l => l.id === sale.leadId);
  const influencer = influencers.find(i => i.id === sale.influencerId);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex bg-success-soft rounded-lg border-2 border-success/25 p-6 shadow-sm">
        <div className="flex-1">
          <p className="text-sm font-medium text-success mb-1">Total Sales Amount</p>
          <p className="text-4xl font-bold text-success">₹{sale.amount.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Badge variant={sale.gst ? 'info' : 'secondary'} className="text-sm px-4 py-1.5">
            {sale.gst ? 'GST Included' : 'No GST'}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">ID: {sale.id}</span>
        </div>
      </div>

      <Separator />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-info" />
            Customer Details
          </h3>
          <div className="grid gap-3 pl-1">
             <InfoCard icon={User} label="Name" value={lead?.name || 'Unknown'} valueClass="font-bold text-foreground" />
             <InfoCard icon={Phone} label="Mobile" value={lead?.mobile || 'N/A'} valueClass="font-mono text-foreground" />
             <InfoCard icon={User} label="Email" value={lead?.email || 'N/A'} />
          </div>
        </div>

        {/* Location & Source */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-destructive" />
            Location & Source
          </h3>
           <div className="grid gap-3 pl-1">
             <div className="grid grid-cols-2 gap-3">
               <InfoCard icon={MapPin} label="State" value={lead?.state || 'N/A'} />
               <InfoCard icon={MapPin} label="City" value={lead?.city || 'N/A'} />
             </div>
             <InfoCard icon={MapPin} label="Address" value={`${lead?.address || ''} ${lead?.pincode ? `- ${lead.pincode}` : ''}` || 'N/A'} />
             <InfoCard icon={User} label="Influencer" value={influencer?.name || 'Direct / ID:' + sale.influencerId} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard 
          icon={Calendar} 
          label="Sale Date" 
          value={format(new Date(sale.saleDate), 'MMM dd, yyyy')} 
        />
        <InfoCard 
          icon={Star} 
          label="Rating" 
          value={lead?.rating ? `${lead.rating} / 5` : 'Not Rated'} 
        />
        <InfoCard 
          icon={Phone} 
          label="Call Status" 
          value={lead?.callStatus || 'N/A'} 
        />
      </div>

      {/* Notes Section */}
      {lead?.notes && (
        <div className="bg-muted/40 border border-border rounded-lg p-4 mt-2">
           <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
             <TrendingUp className="h-4 w-4" />
             Notes
           </h4>
           <p className="text-muted-foreground text-sm leading-relaxed">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}

// Utility Component
function InfoCard({ 
  icon: Icon, 
  label, 
  value, 
  valueClass = '' 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: React.ReactNode; 
  valueClass?: string;
}) {
  return (
    <div className="p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="font-medium">{label}</span>
      </div>
      <div className={`font-semibold ${valueClass || 'text-base'}`}>
        {value}
      </div>
    </div>
  );
}

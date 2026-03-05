export type Role = 'ADMIN' | 'NON_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Influencer {
  id: string;
  name: string;
  sourceCodes: SourceCode[];
}

export interface SourceCode {
  id: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
}

export interface Lead {
  id: string;
  mobile: string;
  name: string;
  state: string;
  city?: string;
  address?: string;
  pincode?: string;
  email?: string;
  influencerId: string;
  sourceCode?: string;
  callStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'BUSY' | 'WRONG_NUMBER';
  rating: number | null;
  notes?: string;
  followUpDate: string | null;
  converted: boolean;
  gst?: boolean;
  gstStatus?: 'YES' | 'NO';
  gstCustomer?: boolean;
  salesAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type Interaction = LeadInteraction;

export interface LeadInteraction {
  id: string;
  leadId: string;
  interactionType: 'CALL' | 'FOLLOW_UP' | 'CONVERSION';
  notes: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  leadId: string;
  influencerId: string;
  amount: number;
  gst: boolean;
  saleDate: string;
  createdAt: string;
}

export interface EmployeeSales {
  id: string;
  name: string;
  sales: number;
}

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
}

export interface Lead {
  id: string;
  mobile: string;
  name: string;
  state: string;
  influencerId: string;
  callStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'BUSY' | 'WRONG_NUMBER';
  rating: number | null;
  followUpDate: string | null;
  converted: boolean;
  createdAt: string;
  updatedAt: string;
}

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

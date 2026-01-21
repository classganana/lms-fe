import { User, Influencer, Lead, LeadInteraction, Sale, SourceCode } from '@/types';
import { mockUsers } from '@/mocks/users';
import { mockInfluencers } from '@/mocks/influencers';
import { mockLeads } from '@/mocks/leads';
import { mockInteractions } from '@/mocks/interactions';
import { mockSales } from '@/mocks/sales';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Store for runtime data
const runtimeLeads: Lead[] = [...mockLeads];
const runtimeSales: Sale[] = [...mockSales];

export const fakeApi = {
  // Users
  async getUsers(): Promise<User[]> {
    await delay(300);
    return [...mockUsers];
  },

  async getUserById(id: string): Promise<User | null> {
    await delay(200);
    return mockUsers.find(u => u.id === id) || null;
  },

  // Influencers
  async getInfluencers(): Promise<Influencer[]> {
    await delay(300);
    return [...mockInfluencers];
  },

  async getInfluencerById(id: string): Promise<Influencer | null> {
    await delay(200);
    return mockInfluencers.find(i => i.id === id) || null;
  },

  async addSourceCode(influencerId: string, code: string): Promise<SourceCode> {
    await delay(400);
    const influencer = mockInfluencers.find(i => i.id === influencerId);
    if (!influencer) throw new Error('Influencer not found');

    // Deactivate existing active source codes
    influencer.sourceCodes.forEach(sc => {
      if (sc.status === 'ACTIVE') {
        sc.status = 'INACTIVE';
        sc.updatedAt = new Date().toISOString();
      }
    });

    const newSourceCode: SourceCode = {
      id: Date.now().toString(),
      code,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    influencer.sourceCodes.push(newSourceCode);
    return newSourceCode;
  },

  async createInfluencer(influencer: Omit<Influencer, 'id' | 'sourceCodes'>): Promise<Influencer> {
    await delay(400);
    const newInfluencer: Influencer = {
      ...influencer,
      id: Date.now().toString(),
      sourceCodes: [],
    };
    mockInfluencers.push(newInfluencer);
    return newInfluencer;
  },

  // Leads
  async getLeads(dateRange?: { from?: Date; to?: Date }): Promise<Lead[]> {
    await delay(300);
    let filteredLeads = [...runtimeLeads];

    if (dateRange?.from || dateRange?.to) {
      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        leadDate.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return leadDate >= fromDate && leadDate <= toDate;
        }
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return leadDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return leadDate <= toDate;
        }
        return true;
      });
    }

    return filteredLeads;
  },

  async getLeadByMobile(mobile: string): Promise<Lead | null> {
    await delay(200);
    return runtimeLeads.find(l => l.mobile === mobile) || null;
  },

  async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    await delay(400);
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    runtimeLeads.push(newLead);
    return newLead;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    await delay(400);
    const lead = runtimeLeads.find(l => l.id === id);
    if (!lead) throw new Error('Lead not found');
    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    return lead;
  },

  // Interactions
  async getInteractions(): Promise<LeadInteraction[]> {
    await delay(300);
    return [...mockInteractions];
  },

  async getInteractionsByLeadId(leadId: string): Promise<LeadInteraction[]> {
    await delay(200);
    return mockInteractions.filter(i => i.leadId === leadId);
  },

  async createInteraction(interaction: Omit<LeadInteraction, 'id' | 'createdAt'>): Promise<LeadInteraction> {
    await delay(400);
    const newInteraction: LeadInteraction = {
      ...interaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    mockInteractions.push(newInteraction);
    return newInteraction;
  },

  // Sales
  async getSales(dateRange?: { from?: Date; to?: Date }): Promise<Sale[]> {
    await delay(300);
    let filteredSales = [...runtimeSales];

    if (dateRange?.from || dateRange?.to) {
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        saleDate.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return saleDate >= fromDate && saleDate <= toDate;
        }
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return saleDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return saleDate <= toDate;
        }
        return true;
      });
    }

    return filteredSales;
  },

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    await delay(400);
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    runtimeSales.push(newSale);
    return newSale;
  },
};

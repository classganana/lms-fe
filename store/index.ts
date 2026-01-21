import { create } from 'zustand';
import { User, Influencer, Lead, LeadInteraction, Sale, Role } from '@/types';
import { fakeApi } from '@/services/fakeApi';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface Store {
  // Auth
  user: User | null;
  role: Role | null;
  setUser: (user: User | null) => void;
  setRole: (role: Role | null) => void;
  logout: () => void;

  // Date filter
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // Data
  influencers: Influencer[];
  leads: Lead[];
  interactions: LeadInteraction[];
  sales: Sale[];

  // Modal state
  selectedItem: Influencer | Lead | LeadInteraction | Sale | null;
  selectedItemType: 'influencer' | 'lead' | 'interaction' | 'sale' | null;
  selectedItems: (Influencer | Lead | LeadInteraction | Sale)[] | null;
  selectedItemsType: 'influencers' | 'leads' | 'interactions' | 'sales' | null;
  isModalOpen: boolean;
  openModal: (item: Influencer | Lead | LeadInteraction | Sale, type: 'influencer' | 'lead' | 'interaction' | 'sale') => void;
  openListModal: (items: (Influencer | Lead | LeadInteraction | Sale)[], type: 'influencers' | 'leads' | 'interactions' | 'sales') => void;
  closeModal: () => void;

  // Actions
  loadInfluencers: () => Promise<void>;
  loadLeads: () => Promise<void>;
  loadInteractions: () => Promise<void>;
  loadSales: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  addSourceCode: (influencerId: string, code: string) => Promise<void>;
  addInfluencer: (influencer: Omit<Influencer, 'id' | 'sourceCodes'>) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  // Auth
  user: null,
  role: null,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  logout: () => set({ user: null, role: null }),

  // Date filter
  dateRange: { from: undefined, to: undefined },
  setDateRange: (range) => set({ dateRange: range }),

  // Data
  influencers: [],
  leads: [],
  interactions: [],
  sales: [],

  // Modal state
  selectedItem: null,
  selectedItemType: null,
  selectedItems: null,
  selectedItemsType: null,
  isModalOpen: false,
  openModal: (item, type) => set({ selectedItem: item, selectedItemType: type, selectedItems: null, selectedItemsType: null, isModalOpen: true }),
  openListModal: (items, type) => set({ selectedItems: items, selectedItemsType: type, selectedItem: null, selectedItemType: null, isModalOpen: true }),
  closeModal: () => set({ selectedItem: null, selectedItemType: null, selectedItems: null, selectedItemsType: null, isModalOpen: false }),

  // Actions
  loadInfluencers: async () => {
    const data = await fakeApi.getInfluencers();
    set({ influencers: data });
  },

  loadLeads: async () => {
    const { dateRange } = get();
    const data = await fakeApi.getLeads(dateRange);
    set({ leads: data });
  },

  loadInteractions: async () => {
    const data = await fakeApi.getInteractions();
    set({ interactions: data });
  },

  loadSales: async () => {
    const { dateRange } = get();
    const data = await fakeApi.getSales(dateRange);
    set({ sales: data });
  },

  addLead: async (lead) => {
    const newLead = await fakeApi.createLead(lead);
    await get().loadLeads();
    return newLead;
  },

  updateLead: async (id, updates) => {
    await fakeApi.updateLead(id, updates);
    await get().loadLeads();
  },

  addSale: async (sale) => {
    await fakeApi.createSale(sale);
    await get().loadSales();
    await get().loadLeads();
  },

  addSourceCode: async (influencerId, code) => {
    await fakeApi.addSourceCode(influencerId, code);
    await get().loadInfluencers();
  },

  addInfluencer: async (influencer) => {
    await fakeApi.createInfluencer(influencer);
    await get().loadInfluencers();
  },
}));

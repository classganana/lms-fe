import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  token: string | null;
  setUser: (user: User | null) => void;
  setRole: (role: Role | null) => void;
  setToken: (token: string | null) => void;
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
  deleteInfluencer: (id: string) => Promise<void>;
  updateInfluencer: (id: string, updates: Partial<Influencer>) => Promise<void>;
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      role: null,
      token: null,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setToken: (token) => set({ token }),
      logout: () => {
        set({ user: null, role: null, token: null });
        localStorage.removeItem('lms-store');
      },

      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

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
        try {
          const { token } = get();
          if (!token) {
            console.warn('No token found, cannot load influencers from API');
            return;
          }
          const response = await fetch('http://18.61.48.70:3000/admin/influencers', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch influencers');
          }
          const data = await response.json();
          console.log('Fetched Influencers Raw Data:', data);

          // Safety mapping to ensure types match
          const safeData = Array.isArray(data) ? data.map((i: any) => ({
            ...i,
            id: String(i.id || i._id),
            sourceCodes: Array.isArray(i.sourceCodes) ? i.sourceCodes : []
          })) : [];

          set({ influencers: safeData });
        } catch (error) {
          console.error('Error loading influencers:', error);
         
        }
      },

      loadLeads: async () => {
        try {
          const { token, dateRange } = get();
          // Construct URL with query parameters if needed
          let url = 'http://18.61.48.70:3000/sales/leads';

     
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, { headers });
          if (!response.ok) {
            console.warn('Failed to fetch leads from API, falling back to fakeApi or empty');
         
            console.error(`Failed to fetch leads: ${response.status}`);
            return;
          }
          const data = await response.json();
          // Ensure data is array and normalize IDs
          const cleanData = Array.isArray(data) ? data.map((l: any) => ({
            ...l,
            id: String(l.id || l._id),
          })) : [];
          set({ leads: cleanData });
        } catch (error) {
          console.error('Error loading leads:', error);
          // Fallback to fakeApi if absolutely necessary? 
          // const data = await fakeApi.getLeads(get().dateRange);
          // set({ leads: data });
        }
      },

      loadInteractions: async () => {
        const data = await fakeApi.getInteractions();
        set({ interactions: data });
      },

      loadSales: async () => {
        try {
          const { token, dateRange } = get();
          let url = 'http://18.61.48.70:3000/sales/leads';
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, { headers });
          if (!response.ok) {
            console.error(`Failed to fetch sales source (leads): ${response.status}`);
            return;
          }
          const data = await response.json();
          // Map leads to sales
          // Assuming 'data' indicates Sales if they are converted or just all leads visualization in Sales table
          const salesData: Sale[] = Array.isArray(data) ? data.map((item: any) => ({
            id: String(item.id || item._id), // Use lead ID as sale ID/reference
            leadId: String(item.id || item._id), // mapping lead itself as the relation
            influencerId: item.influencerId || '',
            amount: Number(item.salesAmount || item.amount || 0),
            gst: item.gst === true || item.gst === 'true' || item.gstCustomer === true || String(item.gstCustomer) === 'true',
            saleDate: item.updatedAt || item.createdAt || new Date().toISOString(),
            createdAt: item.createdAt || new Date().toISOString()
          })) : [];

          // Apply date filtering client-side if API doesn't support it directly yet for consistency
          // (Optional: The view handles filtering too, but storing raw data is better)
          set({ sales: salesData });

        } catch (error) {
          console.error('Error loading sales:', error);
          // Fallback
          // const data = await fakeApi.getSales(get().dateRange);
          // set({ sales: data });
        }
      },

      addLead: async (lead) => {
        try {
          const { token } = get();
          // Note: Token might be required. If not, remove Authorization header.
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch('http://18.61.48.70:3000/sales/leads', {
            method: 'POST',
            headers,
            body: JSON.stringify(lead),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add lead: ${response.status} ${errorText}`);
          }

          const newLead = await response.json();
          // Update local state directly since loadLeads might still be using fakeApi
          set((state) => ({ leads: [...state.leads, newLead] }));
          return newLead;
        } catch (error) {
          console.error('Error adding lead:', error);
          throw error;
        }
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

      addSourceCode: async (influencerId: string, code: string) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');

          console.log(`Adding source code for influencer: ${influencerId}`);

          // Using specific endpoint for adding source code
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${influencerId}/source-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              code: code
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to add source code: ${response.status} ${errText}`);
          }
          await get().loadInfluencers();
        } catch (error) {
          console.error('Add source code error:', error);
          throw error;
        }
      },

      addInfluencer: async (influencer) => {
        // await fakeApi.createInfluencer(influencer); // Removed to avoid stale data
        await get().loadInfluencers();
      },

      deleteInfluencer: async (id: string) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');

          console.log(`Deleting influencer with ID: ${id}`);
          // Attempting both Path parameter and Query parameter styles just in case
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${id}?id=${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Delete response status:', response.status);
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to delete influencer: ${response.status} ${errText}`);
          }
          await get().loadInfluencers();
        } catch (error) {
          console.error('Delete influencer error:', error);
          throw error;
        }
      },

      updateInfluencer: async (id: string, updates: Partial<Influencer>) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');

          console.log(`Updating influencer with ID: ${id}`);
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${id}?id=${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
          });

          console.log('Update response status:', response.status);
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to update influencer: ${response.status} ${errText}`);
          }
          await get().loadInfluencers();
        } catch (error) {
          console.error('Update influencer error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'lms-store',
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

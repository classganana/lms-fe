import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, Sale, Interaction, Influencer, DateRange, User, Role } from '@/types';
import { fakeApi } from '@/services/fakeApi';

interface Store {
  user: User | null;
  role: Role | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setRole: (role: Role | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  leads: Lead[];
  sales: Sale[];
  interactions: Interaction[];
  influencers: Influencer[];
  users: User[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  loadLeads: () => Promise<void>;
  loadSales: () => Promise<void>;
  loadInteractions: () => Promise<void>;
  loadInfluencers: () => Promise<void>;
  loadUsers: () => Promise<void>;

  // UI state for modals
  isListModalOpen: boolean;
  modalLeads: Lead[];
  modalTitle: string;
  openListModal: (leads: Lead[], title: string) => void;
  closeListModal: () => void;

  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;

  addInfluencer: (influencer: Omit<Influencer, 'id'>) => Promise<void>;
  updateInfluencer: (id: string, updates: Partial<Influencer>) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  addSourceCode: (influencerId: string, code: string) => Promise<void>;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, role: null, token: null }),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      leads: [],
      sales: [],
      interactions: [],
      influencers: [],
      users: [],
      dateRange: {
        from: undefined,
        to: undefined,
      },
      setDateRange: (dateRange) => set({ dateRange }),

      // Modal state
      isListModalOpen: false,
      modalLeads: [],
      modalTitle: '',
      openListModal: (leads, title) => set({ isListModalOpen: true, modalLeads: leads, modalTitle: title }),
      closeListModal: () => set({ isListModalOpen: false, modalLeads: [], modalTitle: '' }),

      loadInfluencers: async () => {
        try {
          const { token } = get();
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch('http://18.61.48.70:3000/admin/influencers', { headers });
          if (!response.ok) return;
          const data = await response.json();
          set({ influencers: Array.isArray(data) ? data.map((i: any) => ({ ...i, id: String(i.id || i._id) })) : [] });
        } catch (error) {
          console.error('Error loading influencers:', error);
        }
      },

      loadUsers: async () => {
        try {
          const { token } = get();
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch('http://18.61.48.70:3000/admin/users', { headers }); // Assuming this endpoint
          if (!response.ok) return;
          const data = await response.json();
          set({ users: Array.isArray(data) ? data.map((u: any) => ({ ...u, id: String(u.id || u._id) })) : [] });
        } catch (error) {
          console.error('Error loading users:', error);
        }
      },

      loadLeads: async () => {
        try {
          const { token } = get();
          let url = 'http://18.61.48.70:3000/sales/leads';
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch(url, { headers });
          if (!response.ok) return;
          const data = await response.json();

          const cleanData = Array.isArray(data) ? data.map((l: any) => ({
            ...l,
            id: String(l.id || l._id),
            gstCustomer: l.gstStatus !== undefined ? l.gstStatus === 'YES' :
              (l.gstCustomer !== undefined ? l.gstCustomer :
                (l.gst !== undefined ? l.gst : false)),
          })) : [];

          set({ leads: cleanData });
        } catch (error) {
          console.error('Error loading leads:', error);
        }
      },

      loadSales: async () => {
        try {
          const { token } = get();
          let url = 'http://18.61.48.70:3000/sales/leads';
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch(url, { headers });
          if (!response.ok) return;
          const data = await response.json();
          const isTrue = (val: any) => val === true || val === 'true' || val === 1 || val === '1';

          const salesData: Sale[] = Array.isArray(data) ? data
            .filter((item: any) => isTrue(item.converted) || Number(item.salesAmount || item.amount || 0) > 0)
            .map((item: any) => ({
              id: String(item.id || item._id),
              leadId: String(item.id || item._id),
              influencerId: item.influencerId || '',
              amount: Number(item.salesAmount || item.amount || 0),
              gst: item.gstStatus === 'YES' || item.gst === true || item.gst === 'true' || item.gstCustomer === true || String(item.gstCustomer) === 'true',
              saleDate: item.updatedAt || item.createdAt || new Date().toISOString(),
              createdAt: item.createdAt || new Date().toISOString()
            })) : [];

          set({ sales: salesData });
        } catch (error) {
          console.error('Error loading sales:', error);
        }
      },

      loadInteractions: async () => {
        const data = await fakeApi.getInteractions();
        set({ interactions: data });
      },

      addLead: async (lead) => {
        try {
          const { token } = get();
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch('http://18.61.48.70:3000/sales/leads', {
            method: 'POST',
            headers,
            body: JSON.stringify(lead),
          });

          if (!response.ok) throw new Error('Failed to add lead');
          const rawLead = await response.json();
          const newLead = {
            ...rawLead,
            id: String(rawLead.id || rawLead._id),
            gstCustomer: rawLead.gstStatus === 'YES' || rawLead.gstCustomer === true
          };
          set((state) => ({ leads: [...state.leads, newLead] }));
          return newLead;
        } catch (error) {
          console.error('Error adding lead:', error);
          throw error;
        }
      },

      updateLead: async (id, updates) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');
          const response = await fetch(`http://18.61.48.70:3000/sales/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updates)
          });
          if (!response.ok) throw new Error('Failed to update lead');
          await get().loadLeads();
          await get().loadSales();
        } catch (error) {
          console.error('Update lead error:', error);
          throw error;
        }
      },

      deleteLead: async (id) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');
          const response = await fetch(`http://18.61.48.70:3000/sales/leads/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to delete lead');
          await get().loadLeads();
        } catch (error) {
          console.error('Delete lead error:', error);
          throw error;
        }
      },

      addSale: async (sale) => {
        await fakeApi.createSale(sale);
        await get().loadSales();
        await get().loadLeads();
      },

      addInfluencer: async (influencer) => {
        await get().loadInfluencers();
      },

      updateInfluencer: async (id, updates) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updates)
          });
          if (!response.ok) throw new Error('Failed to update influencer');
          await get().loadInfluencers();
        } catch (error) {
          console.error('Update influencer error:', error);
          throw error;
        }
      },

      deleteInfluencer: async (id) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to delete influencer');
          await get().loadInfluencers();
        } catch (error) {
          console.error('Delete influencer error:', error);
          throw error;
        }
      },

      addSourceCode: async (influencerId, code) => {
        try {
          const { token } = get();
          if (!token) throw new Error('No auth token');
          const response = await fetch(`http://18.61.48.70:3000/admin/influencers/${influencerId}/source-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ code })
          });
          if (!response.ok) throw new Error('Failed to add source code');
          await get().loadInfluencers();
        } catch (error) {
          console.error('Add source code error:', error);
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, Sale, Interaction, Influencer, DateRange, User, Role, EmployeeSales } from '@/types';
import { fakeApi } from '@/services/fakeApi';
import { API_BASE_URL, parseApiError } from '@/lib/api';

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
  employeeSales: EmployeeSales[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  loadLeads: (opts?: { salesExecutiveId?: string }) => Promise<void>;
  loadSales: () => Promise<void>;
  loadInteractions: () => Promise<void>;
  loadInfluencers: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadEmployeeSales: () => Promise<void>;

  // UI state for modals
  isListModalOpen: boolean;
  modalLeads: Lead[];
  modalTitle: string;
  openListModal: (leads: Lead[], title: string) => void;
  closeListModal: () => void;

  // Detail modal state
  selectedItem: Lead | Sale | Interaction | Influencer | null;
  selectedItemType: 'lead' | 'sale' | 'interaction' | 'influencer' | null;
  isModalOpen: boolean;
  openModal: (item: Lead | Sale | Interaction | Influencer, type: 'lead' | 'sale' | 'interaction' | 'influencer') => void;
  closeModal: (open?: boolean) => void;

  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;

  addInfluencer: (influencer: Omit<Influencer, 'id' | 'sourceCodes'>) => Promise<void>;
  updateInfluencer: (id: string, updates: Partial<Influencer>) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
  addSourceCode: (influencerId: string, code: string) => Promise<void>;
  updateSourceCodeStatus: (influencerId: string, code: string, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  deleteSourceCode: (influencerId: string, code: string) => Promise<void>;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const authFetch = async (url: string, options: RequestInit = {}) => {
        const { token, role, logout } = get();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> | undefined),
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
          logout();
          if (typeof window !== 'undefined') {
            const target = role === 'ADMIN' ? '/admin/login' : '/login';
            window.location.href = target;
          }
          throw new Error('UNAUTHORIZED');
        }

        return response;
      };

      return {
        user: null,
        role: null,
        token: null,
        setUser: (user) => set({ user }),
        setRole: (role) => set({ role }),
        setToken: (token) => set({ token }),
        logout: () => set({ user: null, role: null, token: null, leads: [], sales: [] }),

        _hasHydrated: false,
        setHasHydrated: (state) => set({ _hasHydrated: state }),

        leads: [],
        sales: [],
        interactions: [],
        influencers: [],
        users: [],
        employeeSales: [],
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

        // Detail modal state
        selectedItem: null,
        selectedItemType: null,
        isModalOpen: false,
        openModal: (item, type) => set({ selectedItem: item, selectedItemType: type, isModalOpen: true }),
        closeModal: (open) => {
          if (open === false || open === undefined) {
            set({ isModalOpen: false, selectedItem: null, selectedItemType: null });
          }
        },

        loadInfluencers: async () => {
          try {
            const response = await authFetch(`${API_BASE_URL}/admin/influencers`);
            if (!response.ok) return;
            const data = await response.json();
            set({ influencers: Array.isArray(data) ? data.map((i: any) => ({ ...i, id: String(i.id || i._id) })) : [] });
          } catch (error) {
            console.error('Error loading influencers:', error);
          }
        },

        loadUsers: async () => {
          try {
            const response = await authFetch(`${API_BASE_URL}/admin/users`); // Assuming this endpoint
            if (!response.ok) return;
            const data = await response.json();
            set({ users: Array.isArray(data) ? data.map((u: any) => ({ ...u, id: String(u.id || u._id) })) : [] });
          } catch (error) {
            console.error('Error loading users:', error);
          }
        },

        loadEmployeeSales: async () => {
          try {
            const { dateRange } = get();
            const params = new URLSearchParams();
            if (dateRange?.from) params.set('startDate', new Date(dateRange.from).toISOString());
            if (dateRange?.to) params.set('endDate', new Date(dateRange.to).toISOString());
            const qs = params.toString();
            const url = qs ? `${API_BASE_URL}/admin/dashboard/employee-sales?${qs}` : `${API_BASE_URL}/admin/dashboard/employee-sales`;
            const response = await authFetch(url);
            if (!response.ok) return;
            const data = await response.json();
            const employees = Array.isArray(data?.employees) ? data.employees : [];

            const mapped: EmployeeSales[] = employees.map((e: any, index: number) => ({
              id: String(e.id || e._id || index),
              name: e.name ?? 'Unknown',
              sales: Number(e.sales ?? 0),
            }));

            set({ employeeSales: mapped });
          } catch (error) {
            console.error('Error loading employee sales:', error);
          }
        },

        loadLeads: async (opts) => {
          try {
            let url = `${API_BASE_URL}/sales/leads`;
            const params = new URLSearchParams();
            if (opts?.salesExecutiveId) {
              params.set('salesExecutiveId', opts.salesExecutiveId);
            }
            const qs = params.toString();
            if (qs) {
              url += `?${qs}`;
            }

            const response = await authFetch(url);
            if (!response.ok) return;
            const data = await response.json();

            const toId = (v: unknown) => {
              if (v == null) return '';
              if (typeof v === 'string') return v;
              if (typeof v === 'object' && v !== null && '$oid' in v) return String((v as { $oid?: string }).$oid || '');
              if (typeof (v as any)?.toString === 'function') return (v as any).toString();
              return String(v);
            };
            const cleanData = Array.isArray(data) ? data.map((l: any) => ({
              ...l,
              id: String(l.id || l._id),
              createdBy: toId(l.createdBy) || l.createdBy,
              gstCustomer: l.gstStatus !== undefined ? (l.gstStatus === 'YES' || l.gstStatus === 'APPLIED' || l.gstStatus === 'APPLIED_THROUGH_US') :
                (l.gstCustomer !== undefined ? l.gstCustomer :
                  (l.gst !== undefined ? l.gst : false)),
              gstStatus: l.gstStatus,
            })) : [];

            set({ leads: cleanData });
          } catch (error) {
            console.error('Error loading leads:', error);
          }
        },

        loadSales: async () => {
          try {
            const url = `${API_BASE_URL}/sales/leads`;
            const response = await authFetch(url);
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
                gst: (item.gstStatus === 'YES' || item.gstStatus === 'APPLIED' || item.gstStatus === 'APPLIED_THROUGH_US') || item.gst === true || item.gst === 'true' || item.gstCustomer === true || String(item.gstCustomer) === 'true',
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
            const response = await authFetch(`${API_BASE_URL}/sales/leads`, {
              method: 'POST',
              body: JSON.stringify(lead),
            });

            if (!response.ok) {
              const body = await response.json().catch(() => ({}));
              const message = body?.message ?? `Request failed (${response.status})`;
              const err = new Error(Array.isArray(message) ? message.join('. ') : message) as Error & { leadId?: string };
              if (response.status === 409 && (body?.leadId ?? body?.leadid)) {
                err.leadId = String(body.leadId ?? body.leadid);
              }
              throw err;
            }
            const rawLead = await response.json();
            const newLead = {
              ...rawLead,
              id: String(rawLead.id || rawLead._id),
              gstCustomer: (rawLead.gstStatus === 'YES' || rawLead.gstStatus === 'APPLIED' || rawLead.gstStatus === 'APPLIED_THROUGH_US') || rawLead.gstCustomer === true
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
            const response = await authFetch(`${API_BASE_URL}/sales/leads/${id}`, {
              method: 'PATCH',
              body: JSON.stringify(updates),
            });
            if (!response.ok) {
              const message = await parseApiError(response);
              throw new Error(message);
            }
            await get().loadLeads();
            await get().loadSales();
          } catch (error) {
            console.error('Update lead error:', error);
            throw error;
          }
        },

        deleteLead: async (id) => {
          try {
            const response = await authFetch(`${API_BASE_URL}/sales/leads/${id}`, {
              method: 'DELETE',
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
            const response = await authFetch(`${API_BASE_URL}/admin/influencers/${id}`, {
              method: 'PUT',
              body: JSON.stringify(updates),
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
            const response = await authFetch(`${API_BASE_URL}/admin/influencers/${id}`, {
              method: 'DELETE',
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
            const response = await authFetch(`${API_BASE_URL}/admin/influencers/${influencerId}/source-code`, {
              method: 'POST',
              body: JSON.stringify({ code }),
            });
            if (!response.ok) throw new Error('Failed to add source code');
            await get().loadInfluencers();
          } catch (error) {
            console.error('Add source code error:', error);
            throw error;
          }
        },

        updateSourceCodeStatus: async (influencerId, code, status: 'ACTIVE' | 'INACTIVE') => {
          try {
            const response = await authFetch(`${API_BASE_URL}/admin/influencers/${influencerId}/source-code/status`, {
              method: 'PUT',
              body: JSON.stringify({ code, status }),
            });
            if (!response.ok) throw new Error('Failed to update source code status');
            await get().loadInfluencers();
          } catch (error) {
            console.error('Update source code status error:', error);
            throw error;
          }
        },

        deleteSourceCode: async (influencerId, code) => {
          try {
            const params = new URLSearchParams();
            params.set('code', code);
            const response = await authFetch(`${API_BASE_URL}/admin/influencers/${influencerId}/source-code?${params.toString()}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete source code');
            await get().loadInfluencers();
          } catch (error) {
            console.error('Delete source code error:', error);
            throw error;
          }
        },
      };
    },
    {
      name: 'lms-store',
      partialize: (state) => ({ user: state.user, role: state.role, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

import { LeadInteraction } from '@/types';

export const mockInteractions: LeadInteraction[] = [
  {
    id: '1',
    leadId: '1',
    interactionType: 'CALL',
    notes: 'Initial call - very interested',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: '2',
    leadId: '1',
    interactionType: 'FOLLOW_UP',
    notes: 'Follow-up call - confirmed interest',
    createdAt: '2024-03-05T14:00:00Z',
  },
  {
    id: '3',
    leadId: '1',
    interactionType: 'CONVERSION',
    notes: 'Sale completed',
    createdAt: '2024-03-10T16:00:00Z',
  },
  {
    id: '4',
    leadId: '2',
    interactionType: 'CALL',
    notes: 'Initial call - moderate interest',
    createdAt: '2024-03-02T11:00:00Z',
  },
  {
    id: '5',
    leadId: '3',
    interactionType: 'CALL',
    notes: 'Could not connect',
    createdAt: '2024-03-03T09:00:00Z',
  },
];

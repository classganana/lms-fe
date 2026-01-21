import { Influencer } from '@/types';

export const mockInfluencers: Influencer[] = [
  {
    id: '1',
    name: 'John Doe',
    sourceCodes: [
      {
        id: '1',
        code: 'JOHN001',
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        code: 'JOHN002',
        status: 'INACTIVE',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
      },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    sourceCodes: [
      {
        id: '3',
        code: 'JANE001',
        status: 'ACTIVE',
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z',
      },
    ],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    sourceCodes: [
      {
        id: '4',
        code: 'MIKE001',
        status: 'ACTIVE',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: '5',
        code: 'MIKE002',
        status: 'INACTIVE',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-02-10T00:00:00Z',
      },
    ],
  },
];

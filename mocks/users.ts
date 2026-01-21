import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@lms.com',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Sales Executive',
    email: 'sales@lms.com',
    role: 'NON_ADMIN',
  },
];

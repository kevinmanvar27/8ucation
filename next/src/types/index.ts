// Re-export all Prisma types
export * from '@prisma/client';

// Session user type for NextAuth
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  permissions: string[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form state types
export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

// Filter/Search types
export interface TableFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

// Dashboard KPI types
export interface DashboardKPI {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
}

// Menu/Navigation types
export interface MenuItem {
  label: string;
  href: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

// Notification types
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

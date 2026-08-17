export interface ModuleRecord {
  key: string;
  name: string;
  category: 'core' | 'operations' | 'finance' | 'hr';
  is_active: boolean;
  requires: string[];
  description: string;
}

export interface Company {
  id: number;
  name: string;
  parent_id?: number | null;
  currency: string;
  timezone: string;
  tax_id?: string | null;
  commercial_registry?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Permission {
  id: number;
  key: string;
  description?: string | null;
  module_key: string;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
}

export interface User {
  id: number;
  company_id: number;
  username: string;
  email?: string | null;
  full_name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: number;
  company_id: number;
  username: string;
  email?: string | null;
  full_name: string;
  roles: Role[];
  permissions: string[];
}

export type PartnerSubType = 'customer' | 'vendor' | 'partner' | 'contact';

export interface Partner {
  id: number;
  company_id: number;
  parent_id?: number | null;
  name: string;
  sub_type: PartnerSubType;
  is_company: number;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  tax_id?: string | null;
  commercial_registry?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  credit_limit_cents: number;
  notes?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerInput {
  company_id: number;
  parent_id?: number | null;
  name: string;
  sub_type: PartnerSubType;
  is_company: boolean;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  tax_id?: string | null;
  commercial_registry?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  credit_limit_cents?: number | null;
  notes?: string | null;
}

export interface ActivityLog {
  id: number;
  company_id: number;
  entity_type: string;
  entity_id: number;
  user_id?: number | null;
  action: string;
  summary: string;
  details_json?: string | null;
  created_at: string;
}

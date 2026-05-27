export interface Milestone {
  id: string;
  task_title: string;
  is_completed: boolean;
}

export interface FreelancerProfile {
  agency_name: string;
  freelancer_name: string;
  role_title: string;
  bio: string;
  website_url: string;
  github_url?: string;
  twitter_url?: string;
  upi_id?: string;
  logo_data?: string; // Base64 optional branding logo
  business_type?: 'services' | 'ecommerce';
  digital_store_installed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in INR
  category: string;
  file_name: string;
  file_size: string;
  created_at: string;
  is_active: boolean;
  image_color?: string; // Background decorative color styling (e.g. bg-blue-500)
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  avatar_color?: string; // color styling key e.g. bg-blue-500
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string; // links to ClientRecord.id
  client_name: string;
  project_id?: string; // links to Project.id (optional if standalone billing)
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  tax_rate: number; // VAT or GST percentage e.g. 18
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
}

export interface Project {
  id: string;
  owner_id?: string;
  client_name: string;
  project_name: string;
  amount_due: number; // in INR
  is_paid: boolean;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  created_at: string;
  milestones: Milestone[];
  qr_code_data?: string; // Base64 encoding of manual UPI QR code
  qr_code_name?: string;
  agency_profile?: FreelancerProfile; // Frozen embedded freelancer snapshot for client view
  client_id?: string; // associated client ID
}

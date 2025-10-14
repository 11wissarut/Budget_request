export type Role = 'admin' | 'planner' | 'procurement' | 'board'
export type User = { id: string; name: string; username: string; role: Role }
export type Disbursement = {
  id: number;
  requestId: string;
  disbursedAmount: number;
  disbursedDate: string;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export type BudgetRequest = {
  id: string;
  title: string;
  category: string;
  fiscal_year: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'partially_disbursed' | 'disbursed';
  createdAt: string;
  // Optional fields
  approvedAmount?: number;
  approvalNote?: string;
  note?: string;
  fileName?: string;
  fileUrl?: string;
  // Fields from JOINs
  createdBy?: string;
  createdByName?: string;
  details?: any; // Or a more specific type for equipment_details
  quotations?: any[]; // Or a more specific type for quotations
  disbursements?: Disbursement[];
  totalDisbursed?: number;
}
export type Submission = { id: string; name: string; note?: string; fileName: string; fileUrl: string; createdAt: string }

export type ModuleKey = 'dashboard' | 'users' | 'requests' | 'manage_requests' | 'forms_download' | 'forms_submit' | 'disbursements'

// แมพสิทธิ์แบบเดียวกับฝั่ง server
export const RoleAccess: Record<Role, ModuleKey[]> = {
  admin: ['dashboard','users','requests','manage_requests','forms_download','forms_submit', 'disbursements'],
  planner: ['dashboard','requests','manage_requests','forms_download','forms_submit', 'disbursements'],
  procurement: ['dashboard','manage_requests','forms_download','forms_submit', 'disbursements'],
  board: ['dashboard','requests','forms_download','manage_requests','disbursements'],
}

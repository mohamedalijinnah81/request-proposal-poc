export type UserRole = "customer" | "expert";

export type RequestStatus = "created" | "sent" | "completed";

export type ProposalStatus =
  | "requested"
  | "proposal_received"
  | "under_refinement"
  | "updated_proposal_received"
  | "proposal_accepted"
  | "not_selected";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  identifier: string;
}

export interface Customer extends User {
  role: "customer";
}

export interface Expert extends User {
  role: "expert";
  domain: string;
}

export interface Request {
  id: number;
  customer_id: number;
  title: string;
  description: string;
  budget: string;
  timeframe: string;
  notes?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface RequestWithExperts extends Request {
  experts: ExpertProposalView[];
  accepted_proposal_id?: number | null;
}

export interface Proposal {
  id: number;
  request_id: number;
  expert_id: number;
  subject: string;
  message: string;
  price: string;
  attachment_name?: string | null;
  status: ProposalStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalWithExpert extends Proposal {
  expert_name: string;
  expert_domain: string;
}

export interface ExpertProposalView {
  expert_id: number;
  expert_name: string;
  expert_domain: string;
  proposal: Proposal | null;
}

export interface Event {
  id: number;
  request_id?: number;
  type: string;
  text: string;
  created_at: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  domain?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
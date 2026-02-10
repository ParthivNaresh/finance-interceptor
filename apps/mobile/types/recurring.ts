export type StreamType = 'inflow' | 'outflow';

export type FrequencyType =
  | 'weekly'
  | 'biweekly'
  | 'semi_monthly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually'
  | 'irregular'
  | 'unknown';

export type StreamStatus = 'mature' | 'early_detection' | 'tombstoned';

export type AlertType =
  | 'price_increase'
  | 'price_decrease'
  | 'new_subscription'
  | 'cancelled_subscription'
  | 'missed_payment';

export type AlertSeverity = 'low' | 'medium' | 'high';

export type AlertStatus = 'unread' | 'read' | 'dismissed' | 'actioned';

export type UserActionType = 'dismissed' | 'cancelled_subscription' | 'kept' | 'watching';

export interface RecurringStream {
  id: string;
  user_id: string;
  plaid_item_id: string;
  account_id: string;
  stream_id: string;
  stream_type: StreamType;
  description: string;
  merchant_name: string | null;
  category_primary: string | null;
  category_detailed: string | null;
  frequency: FrequencyType;
  first_date: string;
  last_date: string;
  predicted_next_date: string | null;
  average_amount: number;
  last_amount: number;
  iso_currency_code: string;
  is_active: boolean;
  status: StreamStatus;
  is_user_modified: boolean;
  transaction_ids: string[];
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringStreamListResponse {
  inflow_streams: RecurringStream[];
  outflow_streams: RecurringStream[];
  total_monthly_inflow: number;
  total_monthly_outflow: number;
  last_synced_at: string | null;
}

export interface UpcomingBill {
  stream: RecurringStream;
  days_until_due: number;
  expected_amount: number;
}

export interface UpcomingBillsListResponse {
  bills: UpcomingBill[];
  total_amount: number;
  period_days: number;
}

export interface RecurringSyncResult {
  streams_synced: number;
  streams_created: number;
  streams_updated: number;
  streams_deactivated: number;
  alerts_created: number;
}

export interface Alert {
  id: string;
  user_id: string;
  recurring_stream_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data: Record<string, string | number | null> | null;
  status: AlertStatus;
  user_action: UserActionType | null;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  actioned_at: string | null;
}

export interface AlertWithStream extends Alert {
  stream: RecurringStream | null;
}

export interface AlertListResponse {
  alerts: AlertWithStream[];
  total: number;
  unread_count: number;
}

export interface AlertAcknowledgeRequest {
  user_action?: UserActionType;
}

export interface StreamTransaction {
  id: string;
  account_id: string;
  transaction_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  name: string;
  merchant_name: string | null;
  pending: boolean;
  payment_channel: string | null;
  category: string[] | null;
  personal_finance_category_primary: string | null;
  personal_finance_category_detailed: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringStreamDetailResponse {
  stream: RecurringStream;
  transactions: StreamTransaction[];
  total_spent: number;
  occurrence_count: number;
}

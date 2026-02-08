export interface Account {
  id: string;
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string;
}

export interface PlaidItemWithAccounts {
  id: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  status: string;
  error_code: string | null;
  error_message: string | null;
  last_successful_sync: string | null;
  accounts: Account[];
}

export interface AccountsListResponse {
  plaid_items: PlaidItemWithAccounts[];
  total_balance: number;
  account_count: number;
}

export interface SyncResponse {
  success: boolean;
  transactions_added: number;
  transactions_modified: number;
  transactions_removed: number;
  message: string;
}

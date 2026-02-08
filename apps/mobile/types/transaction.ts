export interface Transaction {
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

export interface TransactionDetail extends Transaction {
  authorized_date: string | null;
  location_address: string | null;
  location_city: string | null;
  location_region: string | null;
  location_postal_code: string | null;
  location_country: string | null;
  website: string | null;
}

export interface TransactionsListResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface TransactionFilters {
  account_id?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  search?: string;
  pending?: boolean;
}

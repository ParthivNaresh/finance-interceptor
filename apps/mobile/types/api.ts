export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface AccountResponse {
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

export interface PlaidItemResponse {
  id: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  status: string;
  accounts: AccountResponse[];
}

export interface ExchangeTokenResponse {
  item_id: string;
  plaid_item: PlaidItemResponse;
  status: 'success' | 'error';
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

import type { ExchangeTokenResponse, LinkTokenResponse } from '@/types/api';

import { apiClient } from './client';

export const plaidApi = {
  createLinkToken: (): Promise<LinkTokenResponse> => {
    return apiClient.post<LinkTokenResponse>('/api/plaid/link-token');
  },

  exchangePublicToken: (publicToken: string): Promise<ExchangeTokenResponse> => {
    return apiClient.post<ExchangeTokenResponse>('/api/plaid/exchange-token', {
      public_token: publicToken,
    });
  },
};

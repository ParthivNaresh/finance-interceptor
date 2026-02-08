import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  create,
  destroy,
  LinkExit,
  LinkIOSPresentationStyle,
  LinkSuccess,
  LinkTokenConfiguration,
  open,
} from 'react-native-plaid-link-sdk';

import { plaidApi } from '@/services';
import type { PlaidItemResponse } from '@/types/api';

type PlaidLinkState = 'idle' | 'loading' | 'ready' | 'error';

interface UsePlaidLinkResult {
  state: PlaidLinkState;
  errorMessage: string | null;
  openLink: () => void;
  retry: () => void;
}

interface UsePlaidLinkOptions {
  onSuccess?: (plaidItem: PlaidItemResponse) => void;
  onExit?: () => void;
  onError?: (error: Error) => void;
}

function hasPlaidError(exit: LinkExit): boolean {
  return exit.error !== undefined && exit.error !== null && Boolean(exit.error.errorCode);
}

function formatAccountsMessage(plaidItem: PlaidItemResponse): string {
  const accountCount = plaidItem.accounts.length;
  const accountWord = accountCount === 1 ? 'account' : 'accounts';
  const accountNames = plaidItem.accounts.map((a) => a.name).join(', ');
  return `Connected ${accountCount} ${accountWord}: ${accountNames}`;
}

export function usePlaidLink(options: UsePlaidLinkOptions = {}): UsePlaidLinkResult {
  const [state, setState] = useState<PlaidLinkState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleSuccess = useCallback((success: LinkSuccess) => {
    setState('idle');
    void (async () => {
      try {
        const response = await plaidApi.exchangePublicToken(success.publicToken);
        const message = formatAccountsMessage(response.plaid_item);
        Alert.alert('Success', message);
        optionsRef.current.onSuccess?.(response.plaid_item);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to connect bank');
        Alert.alert('Error', err.message);
        optionsRef.current.onError?.(err);
      }
    })();
  }, []);

  const handleExit = useCallback((exit: LinkExit) => {
    setState('idle');
    if (hasPlaidError(exit)) {
      const errorMsg = exit.error?.errorMessage || exit.error?.displayMessage || 'Unknown error';
      setErrorMessage(errorMsg);
      optionsRef.current.onError?.(new Error(errorMsg));
    } else {
      optionsRef.current.onExit?.();
    }
  }, []);

  const openLink = useCallback(() => {
    if (state === 'loading') {
      return;
    }

    setState('loading');
    setErrorMessage(null);

    void (async () => {
      try {
        await destroy();

        const response = await plaidApi.createLinkToken();

        const tokenConfig: LinkTokenConfiguration = {
          token: response.link_token,
          noLoadingState: false,
        };

        create(tokenConfig);

        open({
          onSuccess: handleSuccess,
          onExit: handleExit,
          iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        });

        setState('idle');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize';
        setErrorMessage(message);
        setState('error');
        optionsRef.current.onError?.(new Error(message));
      }
    })();
  }, [state, handleSuccess, handleExit]);

  const retry = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
  }, []);

  return {
    state,
    errorMessage,
    openLink,
    retry,
  };
}

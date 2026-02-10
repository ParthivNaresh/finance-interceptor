import { useCallback, useEffect, useRef, useState } from 'react';

import { transactionsApi } from '@/services/api';
import type { Transaction, TransactionFilters, TransactionsListResponse } from '@/types';

interface UseTransactionsState {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseTransactionsResult extends UseTransactionsState {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  filters: TransactionFilters;
}

const PAGE_SIZE = 50;

function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  return transactions.filter((transaction) => {
    if (seen.has(transaction.id)) {
      return false;
    }
    seen.add(transaction.id);
    return true;
  });
}

export function useTransactions(initialFilters: TransactionFilters = {}): UseTransactionsResult {
  const [filters, setFiltersState] = useState<TransactionFilters>(initialFilters);
  const [offset, setOffset] = useState(0);
  const loadingMoreRef = useRef(false);
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    total: 0,
    hasMore: false,
    isLoading: true,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
  });

  const fetchTransactions = useCallback(
    async (currentOffset: number, isRefresh: boolean = false, isLoadMore: boolean = false) => {
      if (isLoadMore && loadingMoreRef.current) {
        return;
      }

      if (isLoadMore) {
        loadingMoreRef.current = true;
      }

      setState((prev) => ({
        ...prev,
        isLoading: !isRefresh && !isLoadMore,
        isRefreshing: isRefresh,
        isLoadingMore: isLoadMore,
        error: null,
      }));

      try {
        const response: TransactionsListResponse = await transactionsApi.list(
          filters,
          PAGE_SIZE,
          currentOffset
        );

        setState((prev) => {
          const newTransactions = isLoadMore
            ? deduplicateTransactions([...prev.transactions, ...response.transactions])
            : response.transactions;

          return {
            transactions: newTransactions,
            total: response.total,
            hasMore: response.has_more,
            isLoading: false,
            isLoadingMore: false,
            isRefreshing: false,
            error: null,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transactions';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          error: message,
        }));
      } finally {
        if (isLoadMore) {
          loadingMoreRef.current = false;
        }
      }
    },
    [filters]
  );

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchTransactions(0, true);
  }, [fetchTransactions]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !state.hasMore) {
      return;
    }
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    await fetchTransactions(newOffset, false, true);
  }, [state.hasMore, offset, fetchTransactions]);

  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setFiltersState(newFilters);
    setOffset(0);
  }, []);

  useEffect(() => {
    setOffset(0);
    void fetchTransactions(0);
  }, [fetchTransactions]);

  return {
    ...state,
    refresh,
    loadMore,
    setFilters,
    filters,
  };
}

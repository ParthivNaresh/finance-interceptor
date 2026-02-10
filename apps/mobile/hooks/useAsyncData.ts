import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface AsyncDataResult<T> extends AsyncDataState<T> {
  refresh: () => Promise<void>;
  mutate: (data: T | null) => void;
}

export interface UseAsyncDataOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

type Fetcher<T> = () => Promise<T>;

export function useAsyncData<T>(
  fetcher: Fetcher<T>,
  deps: readonly unknown[] = [],
  options: UseAsyncDataOptions = {}
): AsyncDataResult<T> {
  const { enabled = true, onError } = options;

  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    isLoading: enabled,
    isRefreshing: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    if (!isMountedRef.current) return;

    setState((prev) => ({
      ...prev,
      isLoading: !isRefresh,
      isRefreshing: isRefresh,
      error: null,
    }));

    try {
      const data = await fetcherRef.current();
      if (!isMountedRef.current) return;

      setState({
        data,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (err) {
      if (!isMountedRef.current) return;

      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: message,
      }));

      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  }, [onError]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const mutate = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      void fetchData(false);
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return {
    ...state,
    refresh,
    mutate,
  };
}

export interface AsyncMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface AsyncMutationResult<T, TArgs extends unknown[]> extends AsyncMutationState<T> {
  mutate: (...args: TArgs) => Promise<T>;
  reset: () => void;
}

type MutationFn<T, TArgs extends unknown[]> = (...args: TArgs) => Promise<T>;

export function useAsyncMutation<T, TArgs extends unknown[] = []>(
  mutationFn: MutationFn<T, TArgs>,
  options: { onError?: (error: Error) => void } = {}
): AsyncMutationResult<T, TArgs> {
  const { onError } = options;

  const [state, setState] = useState<AsyncMutationState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (...args: TArgs): Promise<T> => {
    setState({ data: null, isLoading: true, error: null });

    try {
      const data = await mutationFnRef.current(...args);
      if (isMountedRef.current) {
        setState({ data, isLoading: false, error: null });
      }
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      if (isMountedRef.current) {
        setState({ data: null, isLoading: false, error: message });
      }
      if (onError && err instanceof Error) {
        onError(err);
      }
      throw err;
    }
  }, [onError]);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

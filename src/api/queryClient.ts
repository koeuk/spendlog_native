import { QueryClient } from '@tanstack/react-query';

import { errorStatus } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx will not change on retry; a flaky connection gets one more go.
      retry: (failureCount, error) => {
        const status = errorStatus(error);
        if (status !== null && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});

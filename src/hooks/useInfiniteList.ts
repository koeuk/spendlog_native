import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Paginated } from '@/types/api';

/**
 * A Laravel-paginated list as one growing array: the next page is asked for
 * while `links.next` is set, and every page's rows are flattened for a list.
 */
export function useInfiniteList<T>(queryKey: QueryKey, fetchPage: (page: number) => Promise<Paginated<T>>, enabled = true) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.links.next ? last.meta.current_page + 1 : undefined),
    enabled,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;
  return { ...query, items, total };
}

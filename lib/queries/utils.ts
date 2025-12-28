/**
 * Utility function to batch Supabase queries that use .in() to avoid limits
 * Supabase/PostgREST typically has limits on the number of items in .in() clauses (often 100-1000)
 */
export async function batchQuery<T, R>(
  items: T[],
  batchSize: number,
  queryFn: (batch: T[]) => Promise<{ data: R[] | null; error: any }>
): Promise<{ data: R[]; error: any }> {
  if (items.length === 0) {
    return { data: [], error: null };
  }

  const allResults: R[] = [];
  let lastError: any = null;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const { data, error } = await queryFn(batch);

    if (error) {
      lastError = error;
      break;
    }

    if (data) {
      allResults.push(...data);
    }
  }

  return { data: allResults, error: lastError };
}

export const BATCH_SIZE = 100;


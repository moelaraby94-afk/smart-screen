/**
 * Runs async tasks with a controlled concurrency limit.
 *
 * Processes items in batches of `concurrency` size, waiting for each batch
 * to settle (both fulfilled and rejected) before starting the next batch.
 * A rejection in one task does not stop the remaining tasks.
 *
 * @returns Array of results in the same order as input items. Rejected
 *          tasks produce `undefined` in their corresponding slot.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length).fill(undefined);
  const batch = Math.max(1, Math.floor(concurrency));

  for (let i = 0; i < items.length; i += batch) {
    const slice = items.slice(i, i + batch);
    const settled = await Promise.allSettled(
      slice.map((item, j) => fn(item, i + j)),
    );
    for (let j = 0; j < settled.length; j++) {
      const s = settled[j];
      if (s.status === 'fulfilled') {
        results[i + j] = s.value;
      }
    }
  }

  return results;
}

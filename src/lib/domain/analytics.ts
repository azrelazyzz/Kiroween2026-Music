import type { CollectionCopy } from "@/lib/domain/types";

export type CollectionAnalytics = {
  totalCopies: number;
  uniqueReleases: number;
  favorites: number;
  unidentified: number;
  topGenres: Array<{ label: string; count: number }>;
  decades: Array<{ label: string; count: number }>;
};

function topCounts(
  values: string[],
  limit = 5,
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    )
    .slice(0, limit);
}

export function calculateCollectionAnalytics(
  copies: readonly CollectionCopy[],
): CollectionAnalytics {
  const uniqueReleases = new Set(
    copies.map(
      (copy) =>
        `${copy.release.source.provider}:${copy.release.source.releaseId}`,
    ),
  ).size;
  const genreValues = copies.flatMap((copy) => copy.release.genres);
  const decadeValues = copies.flatMap((copy) => {
    const year = copy.release.year;
    return year ? [`${Math.floor(year / 10) * 10}s`] : [];
  });

  return {
    totalCopies: copies.length,
    uniqueReleases,
    favorites: copies.filter((copy) => copy.favorite).length,
    unidentified: copies.filter(
      (copy) => copy.release.source.provider === "manual",
    ).length,
    topGenres: topCounts(genreValues),
    decades: topCounts(decadeValues),
  };
}

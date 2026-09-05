export interface FetchResult<T> {
    data: T | null;
    error: string | null;
    fullResponse?: unknown;
}

export interface PaginatedResult<T> {
    data: T[];
    pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null;
    error: string | null;
    fullResponse?: unknown;
}

export type FetchOptions = {
    cacheTtl?: number;
    revalidate?: number;
    useMemoryCache?: boolean;
    useVercelCache?: boolean;
};
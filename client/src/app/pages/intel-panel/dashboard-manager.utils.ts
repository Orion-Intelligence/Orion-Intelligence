import { SortType } from '../../shared/constants/shared-enums';
export type SortOrder = 'asc' | 'desc';
interface QueryPageParams {
    q: string;
    page: number | string;
}
interface QueryPageSource {
    [key: string]: unknown;
}
export function applyQueryAndPageFromParams(params: QueryPageSource, target: QueryPageParams): string {
    const query = (params['q'] as string | undefined) ?? '';
    const page = (params['page'] as number | string | undefined) ?? '1';
    target.q = query;
    target.page = page;
    return query;
}
export function updateQuery(target: Pick<QueryPageParams, 'q'>, query: string): void {
    target.q = query;
}
export function setPageAndFetch(target: Pick<QueryPageParams, 'page'>, page: number, fetch: () => void): void {
    target.page = page;
    fetch();
}
export function resetPageAndFetch(target: Pick<QueryPageParams, 'page'>, fetch: () => void): void {
    target.page = 1;
    fetch();
}
export function resolveSortOrder(sort: SortType): SortOrder | null {
    if (sort === SortType.NEWEST_FIRST) {
        return 'desc';
    }
    if (sort === SortType.OLDEST_FIRST) {
        return 'asc';
    }
    return null;
}
export function isRouteChanged(currentUrl: string, previousRoute: string): boolean {
    return currentUrl.split('?')[0] !== previousRoute;
}

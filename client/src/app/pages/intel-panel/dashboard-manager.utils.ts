interface QueryPageParams {
    q: string;
    page: number | string;
}
type QueryPageSource = Record<string, unknown>;
export function applyQueryAndPageFromParams(params: QueryPageSource, target: QueryPageParams): string {
  const query = (params['q'] as string | undefined) ?? '';
  const page = (params['page'] as number | string | undefined) ?? '1';
  target.q = query;
  target.page = page;
  return query;
}
export function isRouteChanged(currentUrl: string, previousRoute: string): boolean {
  return currentUrl.split('?')[0] !== previousRoute;
}

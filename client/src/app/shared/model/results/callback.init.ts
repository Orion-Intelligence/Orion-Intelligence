export function initCallbackModel<TRaw, TResult>( target: { Result: TResult[]; Page_Count: number; }, init: any, makeResultItem: (r: Partial<TRaw>) => TResult ) {
  if (!init) {
    return;
  }
  target.Result = init.Result?.map((r: Partial<TRaw>) => makeResultItem(r)) ?? [];
  target.Page_Count = init.Page_Count ?? 0;
}

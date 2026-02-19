import { Suggestion } from './shared/common-result';
export function initCallbackModel<TRaw, TResult>(target: {
    Result: TResult[];
    Suggestions: Suggestion[];
    Page_Count: number;
}, init: any | undefined, makeResultItem: (r: Partial<TRaw>) => TResult) {
    if (!init) {
        return;
    }
    target.Result = init.Result?.map((r: Partial<TRaw>) => makeResultItem(r)) ?? [];
    target.Suggestions = init.Suggestions?.map((s: any) => new Suggestion(s)) ?? [];
    target.Page_Count = init.Page_Count ?? 0;
}

import { EMPTY, Observable, timer } from 'rxjs';
import { expand, switchMap, takeWhile } from 'rxjs/operators';

export function pollWhilePending<T>(call: () => Observable<T>, isPending: (value: T) => boolean, delayMs: number): Observable<T> {
  return call().pipe(expand((value: T) => {
    if (isPending(value)) {
      return timer(delayMs).pipe(switchMap(() => call()));
    }
    return EMPTY;
  }),
  takeWhile((value: T) => isPending(value), true),);
}

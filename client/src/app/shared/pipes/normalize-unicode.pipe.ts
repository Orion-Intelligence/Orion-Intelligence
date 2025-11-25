import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'normalizeUnicode'
})
export class NormalizeUnicodePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

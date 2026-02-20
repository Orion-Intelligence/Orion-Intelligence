import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'sortGroupedResults',
  standalone: true
})
export class SortGroupedResultsPipe implements PipeTransform {
  private readonly modelOrder = [ 'defacement_model', 'leak_model', 'chat_model', 'exploit_model', 'generic_model', ];

  transform( value: { [key: string]: any[]; } ): {
        key: string;
        value: any[];
    }[] {
    return Object.entries(value)
      .map(([key, val]) => ({ key, value: val }))
      .sort((a, b) => this.modelOrder.indexOf(a.key) - this.modelOrder.indexOf(b.key));
  }
}

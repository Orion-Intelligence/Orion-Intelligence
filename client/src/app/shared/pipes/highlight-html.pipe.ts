import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'highlightHtml', pure: true })
export class HighlightHtmlPipe implements PipeTransform {
    transform(value: string): string {
        return value;
    }
}

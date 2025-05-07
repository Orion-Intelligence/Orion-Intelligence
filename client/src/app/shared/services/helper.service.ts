import {Injectable} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor(private sanitizer: DomSanitizer, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  downloadAsCSV(data: any) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'search_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: any): string {
    const keys = Object.keys(data);
    const values = keys.map(key => `"${data[key]}"`).join(',');
    return `${keys.join(',')}\n${values}`;
  }

  printPage() {
    window.print();
  }

  shareResult(url: string) {
    if (navigator.share) {
      navigator.share({
        title: 'Orion Intelligence', text: 'Sharing a relevant CTI resource for review.', url: url
      }).catch(error => console.error('Error sharing:', error));
    } else {
      alert('Sharing is not supported on this browser.');
    }
  }

  reset_query_param(): void {
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true
    }).then();
  }

  highlightWords(text: string): SafeHtml {
    if (!text) return '';

    let highlighted: string;

    if (text.includes('<em>') && text.includes('</em>')) {
      const regex = /<em>(.*?)<\/em>/g;
      const matches = [...text.matchAll(regex)];

      let result = '';
      let lastIndex = 0;
      let i = 0;

      while (i < matches.length) {
        let merged = matches[i][1];
        let start = matches[i].index!;
        let end = start + matches[i][0].length;
        let j = i + 1;

        while (j < matches.length) {
          const prevEnd = end;
          const nextStart = matches[j].index!;
          const betweenText = text.slice(prevEnd, nextStart);

          const wordGap = betweenText
            .replace(/<[^>]+>/g, '') // remove tags
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

          if (wordGap <= 2) {
            const cleanBetween = betweenText.replace(/<[^>]+>/g, '').trim();
            merged += ` ${cleanBetween} ${matches[j][1]}`;
            end = matches[j].index! + matches[j][0].length;
            j++;
          } else {
            break;
          }
        }

        result += text.slice(lastIndex, start);
        result += `<em>${merged}</em>`;
        lastIndex = end;
        i = j;
      }

      result += text.slice(lastIndex);

      highlighted = result
        .replace(/<em>/g, '<span class="dashboard__search-highlight">')
        .replace(/<\/em>/g, '</span>');
    } else {
      highlighted = text.length > 500 ? text.substring(0, 500) : text;
    }

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }


  private escapeHtml(text: string): string {
    let tempDiv = document.createElement("div");
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
  }
}

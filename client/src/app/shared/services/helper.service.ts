import {Injectable} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {franc} from 'franc-min';
import {LANGUAGE_MAP} from '../constants/enums';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor(private sanitizer: DomSanitizer) {
  }

  detectLanguageName(text: string): string {
    const iso639_3 = franc(text);

    if (iso639_3 === 'und') {
      return "en";
    }

    const match = LANGUAGE_MAP[iso639_3];
    return match ? match.iso1 : "en";
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

  highlightWords(text: string): SafeHtml {
    if (!text) return '';

    const escapeHtml = (unsafe: string) => {
      return unsafe.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    let highlighted: string;

    if (text.includes('<em>') && text.includes('</em>')) {
      const regex = /<em>(.*?)<\/em>/g;
      const matches = [...text.matchAll(regex)];
      let result = '';
      let lastIndex = 0;
      let i = 0;

      while (i < matches.length) {
        let merged = escapeHtml(matches[i][1]);
        const start = matches[i].index!;
        let end = start + matches[i][0].length;
        let j = i + 1;

        while (j < matches.length) {
          const prevEnd = end;
          const nextStart = matches[j].index!;
          const betweenText = escapeHtml(text.slice(prevEnd, nextStart));

          const tempDiv = document.createElement('div');
          tempDiv.textContent = betweenText;
          const plainBetween = (tempDiv.textContent || '').trim();

          const wordGap = plainBetween.split(/\s+/).filter(Boolean).length;

          if (wordGap <= 2) {
            merged += ` ${plainBetween} ${escapeHtml(matches[j][1])}`;
            end = matches[j].index! + matches[j][0].length;
            j++;
          } else {
            break;
          }
        }

        result += escapeHtml(text.slice(lastIndex, start));
        result += `<span class="dashboard__search-highlight">${merged}</span>`;
        lastIndex = end;
        i = j;
      }

      result += escapeHtml(text.slice(lastIndex));
      highlighted = result;
    } else {
      highlighted = escapeHtml(text.length > 500 ? text.substring(0, 500) : text);
    }

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private convertToCSV(data: any): string {
    const keys = Object.keys(data);
    const values = keys.map(key => `"${data[key]}"`).join(',');
    return `${keys.join(',')}\n${values}`;
  }

}

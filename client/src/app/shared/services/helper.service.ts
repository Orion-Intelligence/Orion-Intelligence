import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResultHelperService {

  constructor() {}

  downloadAsCSV(data: any) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        title: 'Orion Intelligence',
        text: 'Sharing a relevant CTI resource for review.',
        url: url
      }).catch(error => console.error('Error sharing:', error));
    } else {
      alert('Sharing is not supported on this browser.');
    }
  }
}

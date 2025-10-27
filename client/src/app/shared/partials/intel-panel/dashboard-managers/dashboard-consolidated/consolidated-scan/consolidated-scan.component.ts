import { Component, Input } from '@angular/core';
import { NgIf, NgFor, NgClass, AsyncPipe, CommonModule } from '@angular/common';
import { ConsolidatedApiService } from '../../../../../services/consolidated.api.service';
import { ConsolidatedScanResults } from '../../../../../model/results/consolidated/consolidated.callback.model';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { TooltipDirective } from '../../../../../directive/tooltip-directive.directive';
import { fadeInDashboardItem } from '../../../../../animations/dashboard.item.animation';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-consolidated-scan',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, AsyncPipe, TooltipDirective, RouterLink],
  templateUrl: './consolidated-scan.component.html',
  animations: [fadeInDashboardItem]
})
export class ConsolidatedScanComponent {
  query: string = '';
  scanResult$: Observable<ConsolidatedScanResults[] | null> = of(null);
  isProcessing: boolean = false;
  isExpanded: boolean = false;
  showComponent: boolean = false;
  @Input() isLoading!: boolean;

  constructor(private liveApiService: ConsolidatedApiService) { }

  private getQueryType(q: string): 'repo' | 'domain' | 'invalid' {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return 'invalid';
    if (trimmed.includes('github.com/') && trimmed.includes('/', trimmed.indexOf('github.com/') + 12)) {
      return 'repo';
    }
    if (this.validateAndExtractDomain(q)) {
      return 'domain';
    }

    return 'invalid';
  }
  private extractRepoPath(q: string): string {
    const trimmed = q.trim();
    if (trimmed.includes('github.com/')) {
      const parts = trimmed.split('github.com/')[1]?.split('/');
      if (parts && parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0]}/${parts[1]}`;
      }
    }
    return '';
  }
  public runScan(newQuery: string): void {
    this.query = newQuery;
    let queryType = this.getQueryType(newQuery);

    let target: string | null = null;
    if (queryType === 'repo') {
      target = newQuery.trim();
      if (!this.extractRepoPath(target)) {
        queryType = 'invalid';
      }

    } else if (queryType === 'domain') {
      target = this.validateAndExtractDomain(newQuery);
    }

    if (queryType === 'invalid' || !target) {
      this.showComponent = false;
      this.isExpanded = false;
      this.isProcessing = false;
      this.scanResult$ = of(null);
      return;
    }

    this.isExpanded = false;
    this.showComponent = true;
    this.initAndScan(target, queryType);
  }

  private validateAndExtractDomain(q: string): string {
    let trimmed = q.trim().toLowerCase();
    if (!trimmed || /\s/.test(trimmed) || trimmed.includes('/')) return '';
    const atIdx = trimmed.lastIndexOf('@');
    if (atIdx !== -1) trimmed = trimmed.slice(atIdx + 1);
    if (!trimmed.includes('.')) return '';
    const blockedDomains = new Set([
      'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com', 'yandex.ru', 'ask.com',
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com',
      'snapchat.com', 'pinterest.com', 'threads.net', 'wechat.com', 'weibo.com', 'discord.com', 'twitch.tv',
      'gmail.com', 'hotmail.com', 'outlook.com', 'protonmail.com', 'icloud.com', 'aol.com', 'zoho.com',
      'apple.com', 'microsoft.com', 'amazon.com', 'netflix.com', 'youtube.com', 'spotify.com', 'adobe.com',
      'openai.com', 'github.com', 'gitlab.com', 'bitbucket.org', 'notion.so', 'slack.com', 'dropbox.com',
      'salesforce.com', 'zoom.us', 'skype.com', 'trello.com', 'asana.com', 'airtable.com', 'figma.com',
      'ebay.com', 'etsy.com', 'shopify.com', 'alibaba.com', 'aliexpress.com', 'shein.com', 'temu.com',
      'walmart.com', 'target.com', 'bestbuy.com', 'costco.com', 'nike.com', 'adidas.com', 'h&m.com', 'zara.com',
      'cnn.com', 'nytimes.com', 'washingtonpost.com', 'forbes.com', 'bloomberg.com', 'reuters.com',
      'foxnews.com', 'nbcnews.com', 'cnbc.com', 'abcnews.com', 'theguardian.com', 'usatoday.com',
      'disney.com', 'hulu.com', 'hbomax.com', 'max.com', 'paramountplus.com', 'peacocktv.com', 'crunchyroll.com',
      'imdb.com', 'rottentomatoes.com', 'metacritic.com',
      'paypal.com', 'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com', 'americanexpress.com',
      'discover.com', 'revolut.com', 'wise.com', 'venmo.com', 'robinhood.com', 'coinbase.com', 'binance.com',
      'aws.amazon.com', 'azure.com', 'googlecloud.com', 'digitalocean.com', 'vercel.com', 'cloudflare.com',
      'firebase.google.com', 'supabase.com', 'heroku.com', 'render.com', 'netlify.com',
      'booking.com', 'expedia.com', 'airbnb.com', 'tripadvisor.com', 'uber.com', 'lyft.com',
      'maps.google.com', 'waze.com',
      'wordpress.com', 'medium.com', 'substack.com', 'quora.com', 'stackoverflow.com', 'stackoverflow.co',
      'wikipedia.org', 'wikimedia.org', 'tumblr.com', 'fandom.com', 'soundcloud.com', 'bandcamp.com',
      'deviantart.com', 'behance.net', 'dribbble.com'
    ]);
    const labels = trimmed.split('.').filter(Boolean);
    if (labels.length < 2) return '';
    const rootDomain = labels.slice(-2).join('.');
    if (blockedDomains.has(rootDomain)) return '';
    return trimmed;
  }

  public initAndScan(target: string, type: 'repo' | 'domain'): void {
    this.scanResult$ = of(null);
    this.isProcessing = true;

    let scanObservables: Observable<ConsolidatedScanResults>[];

    if (type === 'repo') {
      scanObservables = [this.liveApiService.scanForRepo(target, 'repo')];
    } else {
      scanObservables = [
        this.liveApiService.scanDomain(target, 'basic'),
        this.liveApiService.scanDomain(target, 'seo'),
      ];
    }

    forkJoin(scanObservables)
      .pipe(finalize(() => { this.isProcessing = false; }))
      .subscribe({
        next: (results) => {
          this.scanResult$ = of(results);
          this.isExpanded = true;
        },
        error: (err) => {
          console.error('Scan failed:', err);
          this.isProcessing = false;
          this.scanResult$ = of(null);
        }
      });
  }

  extractHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  getGradeClass(grade: string): string {
    if (['D', 'F'].includes(grade)) return 'scan_report-section-danger';
    if (grade === 'C') return 'scan_report-section-warning';
    return '';
  }

  toggleCollapse(): void {
    if (!this.isProcessing) {
      this.isExpanded = !this.isExpanded;
    }
  }
}

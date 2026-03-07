import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { ConsolidatedLiveApiResults, ConsolidatedLiveApis } from '../../../../shared/model/results/consolidated/consolidated.callback.model';
import { ConsolidatedApiService } from '../../../../shared/services/consolidated.api.service';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-consolidated-apis',
  imports: [NgClass],
  templateUrl: './consolidated-apis.component.html'
})
export class ConsolidatedApisComponent {
  query: string = '';
  searchResults: ConsolidatedLiveApiResults[] = [];
  liveApiEntities: ConsolidatedLiveApis[] = [];
  isProcessing: boolean = false;
  showComponent: boolean = false;
  isExpanded: boolean = true;

  @Input() isLoading!: boolean;

  constructor(private liveApiService: ConsolidatedApiService) { }

  ngOnInit(): void {
  }

  public toggleCollapse(): void {
    if (!this.isProcessing) {
      this.isExpanded = !this.isExpanded;
    }
  }

  public runSearch(newQuery: string): void {
    const validQuery = this.validateQuery(newQuery);
    if (!validQuery) {
      this.showComponent = false;
      this.isProcessing = false;
      this.searchResults = [];
      return;
    }
    this.isExpanded = false;
    this.query = validQuery;
    this.initAndSearch();
  }

  private validateQuery(q: string): string | null {
    if (!q) {
      return null;
    }
    const trimmed = q.trim();
    if (trimmed && !/\s/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  private extractEntities(validQuery: string): ConsolidatedLiveApis[] {
    const entities: ConsolidatedLiveApis[] = [];
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validQuery);
    if (isEmail) {
      const username = validQuery.split('@')[0];
      const email = validQuery;
      entities.push({ type: 'user', q1: username, q2: email } as ConsolidatedLiveApis);
      entities.push({ type: 'social', q1: username } as ConsolidatedLiveApis);
    }
    else {
      const isPlaystore = validQuery.includes('play.google.com/store/apps');
      if (isPlaystore) {
        entities.push({ type: 'cracked', q1: validQuery } as ConsolidatedLiveApis);
      }
      try {
        const url = new URL(validQuery);
        const hostname = url.hostname.replace('www.', '');
        const domainName = hostname.split('.')[0];
        if (domainName.length >= 1) {
          entities.push({ type: 'social', q1: domainName } as ConsolidatedLiveApis);
        }
      }
      catch {
        if (validQuery.length >= 1) {
          if (validQuery.includes('.')) {
            validQuery = validQuery.split('.')[0];
          }
          if (validQuery) {
            entities.push({ type: 'social', q1: validQuery } as ConsolidatedLiveApis);
          }
        }
      }
    }
    if (entities.length > 0) {
      this.showComponent = true;
    }
    return entities;
  }

  initAndSearch(): void {
    this.searchResults = [];
    const validQuery = this.validateQuery(this.query);
    if (!validQuery) {
      this.isProcessing = false;
      return;
    }
    this.liveApiEntities = this.extractEntities(validQuery);
    if (this.liveApiEntities.length === 0) {
      this.isProcessing = false;
      return;
    }
    this.isProcessing = true;
    this.isExpanded = false;
    this.liveApiService.runLiveApiSearch(this.liveApiEntities)
      .pipe(finalize(() => {
        this.isProcessing = false;
      }))
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isExpanded = true;
        },
        error: (_) => {
          this.isProcessing = false;
        }
      });
  }
}

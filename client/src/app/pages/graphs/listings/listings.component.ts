import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Edge } from 'vis-network/standalone';
import { FormsModule } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-listings',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './listings.component.html',
})
export class ListingsComponent {
  @Input() nodeSet!: any;
  @Input() rawEdges: Edge[] = [];
  @Input() result: any[] = []

  collapseToggle = false;
  searchText: string = '';
  filteredResult: any[] = [];
  copied = false;
  copiedX = 0;
  copiedY = 0;
  selectedDocId: any;
  showResults: boolean = false;

  constructor(private clipboard: Clipboard) {
  }
  ngOnInit(): void {
    setTimeout(() => {
      const list = this.onSearchClick();
      if (list.length > 0)
        this.showResults = true;
    }, 2000);

  }
  toggleCollapse() {
    this.rawEdges.forEach(edge => {
      console.log(`From: ${edge.from}, To: ${edge.to}`);
    });
    this.collapseToggle = !this.collapseToggle;
  }
  openMenu(id: any, button: HTMLElement) {
    this.selectedDocId = id;
    const graphMenu = document.getElementById('customContextMenu');
    if (graphMenu) graphMenu.style.display = 'none';
    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    const rect = button.getBoundingClientRect();
    const scrollContainer = this.findScrollParent(button);

    const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
    menu.style.display = 'block';
    menu.style.top = `${rect.bottom + scrollTop - 75}px`;
    this.copiedY = rect.bottom + scrollTop - 75;
  }
  hideMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu)
      menu.style.display = 'none';
  }
  onSearchClick(): any {
    const query = this.searchText.toLowerCase();

    if (!query) {
      this.filteredResult = this.result.filter(doc =>
        this.checkDocument(doc.edge._id) && this.extractproperty(doc.edge._id)
      );
      this.filteredResult = this.filteredResult.slice(0, 50);
      return this.filteredResult;
    }

    this.filteredResult = this.result.filter(doc => {
      const id = (this.extractId(doc.edge._id)).toLowerCase();
      const shorterId = this.shortenId(id, 21).toLowerCase();
      const prop = this.extractproperty(doc.edge._id)?.toLowerCase() || '';
      const cluster = this.checkCluster(doc.edge._id)?.toLowerCase() || '';
      console.log(query + " " + id + " " + shorterId + " " + prop + " " + cluster)
      return id.includes(query) || shorterId.includes(query) || prop.includes(query) || cluster.includes(query);
    });
    return this.filteredResult.slice(0, 50);
  }
  checkDocument(id: string): boolean {
    let category = this.checkCluster(id);
    if (category === '')
      return false;
    else
      return true;
  }
  checkCluster(id: string): string {
    let category = '';

    if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/general') ||
      (edge.from === 'cti_vertices/general')
    )) {
      category = 'general';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/leak') ||
      (edge.from === 'cti_vertices/leak')
    )) {
      category = 'leak';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/defacement') ||
      (edge.from === 'cti_vertices/defacement')
    )) {
      category = 'defacement';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/chat') ||
      (edge.from === 'cti_vertices/chat')
    )) {
      category = 'chat';
    }
    return category
  }
  extractId(path: string): string {
    const match = path.match(/[a-f0-9]{64}/);
    return match ? match[0] : '';
  }
  extractproperty(id: string): string {
    let id_temp = this.extractId(id)
    let location_point = id.indexOf(id_temp) + id_temp.length + 1
    let item = id.substring(location_point)
    item = item.replace(/^m/, '');
    item = item.replaceAll("_", " ")
    return item
  }
  shortenId(id: string, char: number): string {
    return id.length > 20 ? id.slice(0, char) + '...' : id;
  }
  formatProperty(input: string): string {
    const words = input.trim().split(/\s+/);
    if (words.length === 0) return '';

    const first = words[0];
    const second = words[1] || '';
    const rest = words.slice(2).join(' ');

    const isShort = first.length >= 2 && first.length <= 3;
    const isDateTime = first.toLowerCase() === 'date' && second.toLowerCase() === 'time';

    const formatWord = (word: string) =>
      word.length >= 2 && word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    if (isDateTime) {
      return `${formatWord(first)} ${formatWord(second)}: ${rest}`;
    }

    if (words.length >= 2) {
      return `${formatWord(first)}: ${words.slice(1).join(' ')}`;
    }
    return formatWord(first);
  }


  openCTI() {
    const id = this.extractId(this.selectedDocId)
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;

    const singleInput = id;

    const params = new URLSearchParams({
      selectedType: 'document', singleInput: singleInput
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
    this.hideMenu();
  }

  copyNodeLabel(event: MouseEvent) {
    const _label = this.extractproperty(this.selectedDocId)
    if (_label) {
      this.clipboard.copy(_label);
      this.showCopiedMessage(event);
      this.hideMenu()
    }
  }

  viewReport() {
    this.hideMenu();

    const id = this.extractId(this.selectedDocId)
    const singleInput = id;

    let category = '';

    if (this.rawEdges.some(edge =>
      (edge.to === 'cti_vertices/general') ||
      (edge.from === 'cti_vertices/general')
    )) {
      category = 'general';
    } else if (this.rawEdges.some(edge =>
      (edge.to === 'cti_vertices/leak') ||
      (edge.from === 'cti_vertices/leak')
    )) {
      category = 'leak';
    } else if (this.rawEdges.some(edge =>
      (edge.to === 'cti_vertices/defacement') ||
      (edge.from === 'cti_vertices/defacement')
    )) {
      category = 'defacement';
    } else if (this.rawEdges.some(edge =>
      (edge.to === 'cti_vertices/chat') ||
      (edge.from === 'cti_vertices/chat')
    )) {
      category = 'chat';
    }

    if (category === 'leak') {
      const baseUrl = `${window.location.origin}/dashboard/breach/all/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'defacement') {
      const baseUrl = `${window.location.origin}/dashboard/defacement/archive/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'general') {
      const baseUrl = `${window.location.origin}/dashboard/strategic/all/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    } else if (category === 'chat') {
      const baseUrl = `${window.location.origin}/dashboard/social/telegram/${singleInput}`;
      const fullUrl = `${baseUrl}`;
      window.open(fullUrl, '_blank');
    }

    this.hideMenu();
  }

  showCopiedMessage(event: MouseEvent) {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();

    this.copiedX = 10;

    this.copied = true;

    setTimeout(() => {
      this.copied = false;
    }, 1500);
  }
  findScrollParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }
}

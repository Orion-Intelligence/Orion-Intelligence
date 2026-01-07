import { Component, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { PaginationComponent } from '../../shared/partials/pagination/pagination.component';
import { FiltersComponent } from '../../shared/partials/filters/filters.component';
import { DumpService } from '../../services/dump/dump.service';
import { dump_filters } from '../../shared/constants/filters';
import { DumpListComponent } from './dump-list/dump-list.component';
import { DumpCallbackModel } from '../../shared/model/dump/dump.mode';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseListingComponent } from '../../shared/directive/base.listing.directive';

@Component({
  selector: 'app-dump',
  standalone: true,
  templateUrl: './dump.component.html',
  imports: [
    NgOptimizedImage,
    PaginationComponent,
    AsyncPipe,
    FiltersComponent,
    DumpListComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  styleUrls: ['../../../assets/styles/shared/listing/directory.component.css']
})
export class DumpComponent extends BaseListingComponent<DumpCallbackModel> {
  filterModel = dump_filters;
  private dumpService = inject(DumpService);

  protected data$ = this.dumpService.dumpData$;
  protected service = this.dumpService;
  isFilterOpen$ = this.dumpService.isFilterOpen$;
  openSidebar() { this.dumpService.toggleFilter(true); }
  closeSidebar() { this.dumpService.toggleFilter(false); }
}
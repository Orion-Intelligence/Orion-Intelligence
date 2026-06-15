import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThreatLensCategoryModelKey, ThreatLensLegendItem } from '../../../models/geo-fencing.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

interface ThreatLensArcRangeOption {
  index: number;
  label: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-threat-lens-category-layers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './threat-lens-category-layers.component.html',
})
export class ThreatLensCategoryLayersComponent {
  @Input() categoryLegend: ThreatLensLegendItem[] = [];
  @Input() selectedArcCategoryKey: ThreatLensCategoryModelKey = 'news_model';
  @Input() arcBatchSize = 10;
  @Input() arcBatchSizeOptions: number[] = [];
  @Input() selectedArcRangeIndex = 0;
  @Input() arcRangeOptions: ThreatLensArcRangeOption[] = [];

  @Output() arcBatchSizeChange = new EventEmitter<number>();
  @Output() arcRangeChange = new EventEmitter<number>();
  @Output() arcCategorySelect = new EventEmitter<ThreatLensCategoryModelKey>();
}

import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {
  }

  transform(key: string | null | undefined): string {
    this.translationService.version();
    return this.translationService.translate(key);
  }
}

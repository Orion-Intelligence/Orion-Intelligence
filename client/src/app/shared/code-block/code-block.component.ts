import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-code-block',
  imports: [],
  templateUrl: './code-block.component.html'
})
export class CodeBlockComponent {
  @Input() code:string|undefined = '';
}

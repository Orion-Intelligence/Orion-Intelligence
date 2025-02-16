import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-error-handler',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './error-handler.component.html',
  styleUrl: './error-handler.component.css'
})
export class ErrorHandlerComponent {
  constructor() {}

}

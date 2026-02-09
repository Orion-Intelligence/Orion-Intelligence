import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-social-mapper',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-mapper.component.html',
  animations: [fadeInDashboardItem]
})
export class SocialMapperComponent  {

}

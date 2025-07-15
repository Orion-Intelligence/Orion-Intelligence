import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeBarChartComponent } from './customize-bar-chart.component';

describe('CustomizeBarChartComponent', () => {
  let component: CustomizeBarChartComponent;
  let fixture: ComponentFixture<CustomizeBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizeBarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizeBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

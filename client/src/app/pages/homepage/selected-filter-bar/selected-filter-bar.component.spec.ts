import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedFilterBarComponent } from './selected-filter-bar.component';

describe('SelectedFilterBarComponent', () => {
  let component: SelectedFilterBarComponent;
  let fixture: ComponentFixture<SelectedFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectedFilterBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectedFilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

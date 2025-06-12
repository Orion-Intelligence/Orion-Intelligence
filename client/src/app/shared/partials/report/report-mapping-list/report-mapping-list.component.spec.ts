import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMappingListComponent } from './report-mapping-list.component';

describe('ReportMappingListComponent', () => {
  let component: ReportMappingListComponent;
  let fixture: ComponentFixture<ReportMappingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportMappingListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportMappingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

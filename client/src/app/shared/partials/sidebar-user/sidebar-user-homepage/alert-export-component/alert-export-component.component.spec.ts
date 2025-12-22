import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertExportComponentComponent } from './alert-export-component.component';

describe('AlertExportComponentComponent', () => {
  let component: AlertExportComponentComponent;
  let fixture: ComponentFixture<AlertExportComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertExportComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertExportComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

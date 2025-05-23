import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonViewerComponent } from './json-viewer.component';

describe('JsonViewerComponent', () => {
  let component: JsonViewerComponent;
  let fixture: ComponentFixture<JsonViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JsonViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

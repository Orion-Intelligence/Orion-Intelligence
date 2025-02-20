import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryPaginationComponent } from './directory-pagination.component';

describe('DirectoryPaginationComponent', () => {
  let component: DirectoryPaginationComponent;
  let fixture: ComponentFixture<DirectoryPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectoryPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodLogDialogComponent } from './pod-log-dialog.component';

describe('PodLogDialogComponent', () => {
  let component: PodLogDialogComponent;
  let fixture: ComponentFixture<PodLogDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodLogDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

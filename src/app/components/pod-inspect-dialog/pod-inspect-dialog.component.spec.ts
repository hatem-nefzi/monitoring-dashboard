import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodInspectDialogComponent } from './pod-inspect-dialog.component';

describe('PodInspectDialogComponent', () => {
  let component: PodInspectDialogComponent;
  let fixture: ComponentFixture<PodInspectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodInspectDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodInspectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

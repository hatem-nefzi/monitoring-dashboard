import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PodInspectDialogComponent } from './pod-inspect-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PodInspectDialogComponent', () => {
  let component: PodInspectDialogComponent;
  let fixture: ComponentFixture<PodInspectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PodInspectDialogComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore les erreurs de template (optionnel si tu veux alléger)
    }).compileComponents();

    fixture = TestBed.createComponent(PodInspectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

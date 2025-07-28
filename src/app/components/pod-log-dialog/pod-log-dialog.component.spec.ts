import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PodLogDialogComponent } from './pod-log-dialog.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KubernetesService } from '../../services/kubernetes.service';

describe('PodLogDialogComponent', () => {
  let component: PodLogDialogComponent;
  let fixture: ComponentFixture<PodLogDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PodLogDialogComponent,
        HttpClientTestingModule
      ],
      providers: [
        KubernetesService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PodLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

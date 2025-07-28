import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceDashboardComponent } from './resource-dashboard.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { KubernetesService } from '../../services/kubernetes.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ResourceDashboardComponent', () => {
  let component: ResourceDashboardComponent;
  let fixture: ComponentFixture<ResourceDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResourceDashboardComponent,
        HttpClientTestingModule
      ],
      providers: [KubernetesService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

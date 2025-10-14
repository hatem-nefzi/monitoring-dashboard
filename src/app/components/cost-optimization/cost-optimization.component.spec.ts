import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostOptimizationComponent } from './cost-optimization.component';

describe('CostOptimizationComponent', () => {
  let component: CostOptimizationComponent;
  let fixture: ComponentFixture<CostOptimizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostOptimizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostOptimizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

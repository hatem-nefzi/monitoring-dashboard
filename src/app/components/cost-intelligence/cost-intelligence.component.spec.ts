import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostIntelligenceComponent } from './cost-intelligence.component';

describe('CostIntelligenceComponent', () => {
  let component: CostIntelligenceComponent;
  let fixture: ComponentFixture<CostIntelligenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostIntelligenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostIntelligenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

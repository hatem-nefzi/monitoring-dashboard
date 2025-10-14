import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemediationComponent } from './remediation.component';

describe('RemediationComponent', () => {
  let component: RemediationComponent;
  let fixture: ComponentFixture<RemediationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemediationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemediationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

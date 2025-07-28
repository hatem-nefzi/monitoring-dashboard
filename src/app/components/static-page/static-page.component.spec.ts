import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaticPageComponent } from './static-page.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('StaticPageComponent', () => {
  let component: StaticPageComponent;
  let fixture: ComponentFixture<StaticPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StaticPageComponent, // ✅ comme il est standalone, il va ici
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StaticPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

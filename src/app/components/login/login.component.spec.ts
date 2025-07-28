import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideAuth } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authState$ = new BehaviorSubject(null);

  const mockAuth: Partial<Auth> = {
    onAuthStateChanged: (callback: any) => {
      const unsubscribe = authState$.subscribe(callback);
      return unsubscribe.unsubscribe;
    }
  };

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {
        returnUrl: '/'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Monitoring Dashboard Login</h2>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-control"
              [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
          </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          </div>
          
          <button type="submit" [disabled]="loginForm.invalid || loading" class="btn btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        
        <div *ngIf="error" class="error-message">
          {{ error }}
        </div>
        
        <p class="signup-link">
          Don't have an account? <a (click)="goToSignup()">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-control {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .btn {
      width: 100%;
      padding: 0.75rem;
      margin: 0.5rem 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .error-message {
      color: red;
      margin-top: 1rem;
      text-align: center;
    }

    .signup-link {
      text-align: center;
      margin-top: 1rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute  // 👈 Needed for returnUrl
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.signIn(email, password);

        // Get returnUrl from query params or fallback to /test-pods
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/test-pods';
        this.router.navigate([returnUrl]);

      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}

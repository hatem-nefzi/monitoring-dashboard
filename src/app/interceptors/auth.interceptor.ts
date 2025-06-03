// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip interceptor for non-API requests
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Get the auth token from Firebase
  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      let authReq = req;
      
      // Add the token to the request header if available
      if (token) {
        authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      return next(authReq);
    })
  );
};
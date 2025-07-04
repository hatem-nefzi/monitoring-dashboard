// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { TestRouteComponent } from './components/test-route/test-route.component';
import { ResourceDashboardComponent } from './components/resource-dashboard/resource-dashboard.component';
import { StaticPageComponent } from './components/static-page/static-page.component';
export const routes: Routes = [
  {
    path: 'test-pods',
    component: TestRouteComponent,
    canActivate: [authGuard]
  },
  {
    path: 'static',
    component:StaticPageComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/test-pods', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'resources',
    component: ResourceDashboardComponent,
    canActivate: [authGuard]
  }
  ,
  { path: '**', redirectTo: '/test-pods' }
];
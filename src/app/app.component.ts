// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // Critical - must include RouterOutlet
  template: `
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'MonitoringDashboard';
}
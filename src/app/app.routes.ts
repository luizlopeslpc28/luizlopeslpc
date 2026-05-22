import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portfolio').then(m => m.PortfolioComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin').then(m => m.AdminComponent),
    canActivate: [authGuard]
  }
];



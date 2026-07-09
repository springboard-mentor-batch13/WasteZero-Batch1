import { Routes } from '@angular/router';
import { Profile } from './features/profile/profile';
import { AuthComponent } from './features/auth/auth';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'profile', component: Profile },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth' }
];
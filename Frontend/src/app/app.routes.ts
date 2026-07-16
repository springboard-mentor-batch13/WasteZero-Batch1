import { Routes } from '@angular/router';

import { AuthComponent } from './features/auth/auth';
import { Profile } from './features/profile/profile';
import { CreateOpportunityComponent } from './features/opportunities/create-opportunity/create-opportunity';

import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [

  {
    path: 'auth',
    component: AuthComponent
  },

  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard]
  },

  {
    path: 'opportunities/create',
    component: CreateOpportunityComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['admin', 'ngo']
    }
  },

  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: '/auth'
  }

];
import { Routes } from '@angular/router';
import { Profile } from './features/profile/profile';
import { AuthComponent } from './features/auth/auth';
import { OpportunitiesList } from './features/opportunities/opportunities-list/opportunities-list';
import { OpportunityForm } from './features/opportunities/opportunity-form/opportunity-form';
import { OpportunityDetail } from './features/opportunities/opportunity-detail/opportunity-detail';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'profile', component: Profile },
  { path: 'opportunities', component: OpportunitiesList },
  { path: 'opportunities/new', component: OpportunityForm },
  { path: 'opportunities/:id/edit', component: OpportunityForm },
  { path: 'opportunities/:id', component: OpportunityDetail },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth' }
];

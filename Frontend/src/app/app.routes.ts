import { Routes } from '@angular/router';
import { Profile } from './features/profile/profile';
import { AuthComponent } from './features/auth/auth';
import { OpportunitiesList } from './features/opportunities/opportunities-list/opportunities-list';
import { OpportunityForm } from './features/opportunities/opportunity-form/opportunity-form';
import { OpportunityDetail } from './features/opportunities/opportunity-detail/opportunity-detail';
import { Messages } from './features/messages/messages/messages';
import { SchedulePickup } from './features/pickups/schedule-pickup/schedule-pickup';
import { ManagePickups } from './features/pickups/manage-pickups/manage-pickups';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'profile', component: Profile },
  { path: 'opportunities', component: OpportunitiesList },
  { path: 'opportunities/new', component: OpportunityForm },
  { path: 'opportunities/:id/edit', component: OpportunityForm },
  { path: 'opportunities/:id', component: OpportunityDetail },
  { path: 'messages', component: Messages },
  { path: 'schedule', component: SchedulePickup },
  { path: 'pickups', component: ManagePickups },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth' }
];

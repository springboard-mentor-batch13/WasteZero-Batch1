import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../features/auth/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  if (!user) {
    router.navigate(['/auth']);
    return false;
  }

  const allowedRoles = route.data['roles'] as string[];

  if (allowedRoles.includes(user.role.toLowerCase())) {
    return true;
  }

  alert('Access Denied');

  router.navigate(['/profile']);

  return false;
};
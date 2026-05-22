import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformServer } from '@angular/common';

export const authGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (isPlatformServer(platformId)) {
    return router.parseUrl('/login');
  }

  const http = inject(HttpClient);
  try {
    await firstValueFrom(http.get('/api/auth/status', { withCredentials: true }));
    return true;
  } catch {
    return router.parseUrl('/login');
  }
};

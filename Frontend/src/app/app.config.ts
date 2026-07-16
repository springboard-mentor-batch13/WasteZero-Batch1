import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; 
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor'; // Import the interceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes),
    // Register the interceptor here
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])) 
  ],
};
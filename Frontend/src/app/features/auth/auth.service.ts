import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  verifyEmail(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { email, otp });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // --- Token Management ---
  setToken(token: string): void {
    localStorage.setItem('wastezero_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('wastezero_token');
  }

  // --- User Data Management ---
  setUser(user: any): void {
    localStorage.setItem('wastezero_user', JSON.stringify(user));
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('wastezero_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data from local storage', e);
      return null;
    }
  }
}
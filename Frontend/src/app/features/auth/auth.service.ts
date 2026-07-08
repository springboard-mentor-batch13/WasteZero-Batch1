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

  // Utility to store token
  setToken(token: string): void {
    localStorage.setItem('wastezero_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('wastezero_token');
  }
}
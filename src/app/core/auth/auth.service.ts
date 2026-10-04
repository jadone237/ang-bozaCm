import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  role: 'ADMIN' | 'CLIENT' | 'AGENCE';
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<LoginResponse | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  registerClient(data: any) {
    return this.http.post(`${environment.apiUrl}/auth/register/client`, data, { responseType: 'text' as 'json' });
  }

  registerAgence(data: any) {
    return this.http.post(`${environment.apiUrl}/auth/register/agence`, data, { responseType: 'text' as 'json' });
  }

  saveSession(response: LoginResponse) {
    localStorage.setItem('token', response.token);
    this.currentUser.set(response);
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // currentUser vit en mémoire et se perd au rafraîchissement : on retombe sur le "sub" du JWT (= email).
  currentEmail(): string | null {
    const fromSession = this.currentUser()?.email;
    if (fromSession) return fromSession;

    const token = typeof window !== 'undefined' ? this.getToken() : null;
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
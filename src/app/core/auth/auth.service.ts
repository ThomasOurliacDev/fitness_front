import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { ENVIRONMENT } from '../config/environment.token';
import { firstValueFrom } from 'rxjs';
import { ApiEnvelope } from '../api/api-envelope';


export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

const USER_STORAGE_KEY = 'app.auth.user';
const TOKEN_STORAGE_KEY = 'app.auth.token';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT);

  private readonly _user = signal<AuthUser | null>(this.readStoredUser());
  private readonly _token = signal<string | null>(this.readStoredToken());

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  readonly displayName = computed(() => {
    const user = this._user();
    if (!user) return null;
    return `${user.firstName} ${user.lastName}`;
  });

  /**
   * @param rememberMe true → la session survit à la fermeture du navigateur (localStorage),
   *                   false → elle disparaît avec l'onglet (sessionStorage).
   */
  async login(email: string, password: string, rememberMe = false) {
    const res = await firstValueFrom(this.http.post<ApiEnvelope<AuthResponse>>(`${this.env.apiUrl}/auth/login`, { email, password }));

    this.setSession(res.data.user, res.data.accessToken, rememberMe);
  }

  async register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<ApiEnvelope<AuthResponse>>(`${this.env.apiUrl}/auth/register`, { email, password, firstName, lastName }));
    this.setSession(res.data.user, res.data.accessToken, false);
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    try {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch { /* ignore */ }
  }

  private readStoredUser(): AuthUser | null {
    try {
      // localStorage (remember me) prioritaire, sinon la session de l'onglet
      const raw = localStorage.getItem(USER_STORAGE_KEY) ?? sessionStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch { return null; }
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch { return null; }
  }

  private setSession(user: AuthUser, token: string, rememberMe: boolean): void {
    this._user.set(user);
    this._token.set(token);
    try {
      const target = rememberMe ? localStorage : sessionStorage;
      const other = rememberMe ? sessionStorage : localStorage;
      target.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      target.setItem(TOKEN_STORAGE_KEY, token);
      // On nettoie l'autre storage pour ne jamais avoir deux sessions en parallèle
      other.removeItem(USER_STORAGE_KEY);
      other.removeItem(TOKEN_STORAGE_KEY);
    } catch { /* ignore */ }
  }
}

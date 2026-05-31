import { Injectable, signal, computed } from '@angular/core';

export interface AuthUser {
  email: string;
  name: string;
}

const STORAGE_KEY = 'app.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.readStored());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /** Fake login (à brancher sur ton backend). */
  async login(email: string, _password: string): Promise<void> {

    const user: AuthUser = { email, name: email };
    this._user.set(user);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const user: AuthUser = { email, name: name || email };
    this._user.set(user);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
  }

  logout(): void {
    this._user.set(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  private readStored(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as AuthUser : null;
    } catch { return null; }
  }
}

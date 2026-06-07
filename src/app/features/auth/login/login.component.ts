import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, required, email, minLength } from '@angular/forms/signals';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToasterService } from '../../../core/notifications/toaster.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputTextModule, PasswordModule, ButtonModule, TabsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toaster = inject(ToasterService);

  readonly loading = signal(false);

  // --- Login form ---
  readonly loginModel = signal({ email: '', password: '' });
  readonly loginForm = form(this.loginModel, (f) => {
    required(f.email);
    email(f.email);
    required(f.password);
  });

  // --- Register form ---
  readonly registerModel = signal({ firstName: '', lastName: '', email: '', password: '' });
  readonly registerForm = form(this.registerModel, (f) => {
    required(f.firstName);
    required(f.lastName);
    required(f.email);
    email(f.email);
    required(f.password);
    minLength(f.password, 8);
  });

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid()) return;
    this.loading.set(true);
    try {
      const { email, password } = this.loginModel();
      await this.auth.login(email, password);
      this.toaster.success('Connecté', `Bienvenue ${email}`);
      this.router.navigate(['/entrainement']);
    } catch (err) {
      const message = this.extractError(err, 'Échec de la connexion. Vérifiez vos identifiants.');
      this.toaster.error('Connexion impossible', message);
    } finally {
      this.loading.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid()) return;
    this.loading.set(true);
    try {
      const { email, password, firstName, lastName } = this.registerModel();
      await this.auth.register(email, password, firstName, lastName);
      this.toaster.success('Compte créé', 'Votre espace est prêt.');
      this.router.navigate(['/entrainement']);
    } catch (err) {
      const message = this.extractError(err, 'Échec de la création du compte.');
      this.toaster.error('Création impossible', message);
    } finally {
      this.loading.set(false);
    }
  }

  private extractError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | string | null;
      if (typeof body === 'string' && body) return body;
      if (body && typeof body === 'object' && body.message) {
        return Array.isArray(body.message) ? body.message.join(' ') : body.message;
      }
      if (err.status === 0) return 'Impossible de contacter le serveur.';
    }
    return fallback;
  }
}
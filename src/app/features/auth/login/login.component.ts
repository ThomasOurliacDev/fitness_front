import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';
import { ToasterService } from '../../../core/notifications/toaster.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, PasswordModule, ButtonModule, TabsModule, MessageModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toaster = inject(ToasterService);

  // login
  email = '';
  password = '';
  // register
  rFirstName = '';
  rLastName = '';
  rEmail = '';
  rPassword = '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async submitLogin(): Promise<void> {
    this.error.set(null);
    if (!this.email || !this.password) {
      this.error.set('Email et mot de passe requis.');
      this.toaster.warn('Champs manquants', 'Renseignez votre email et votre mot de passe.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.toaster.success('Connecté', `Bienvenue ${this.email}`);
      this.router.navigate(['/program']);
    } catch (err) {
      const message = this.extractError(err, 'Échec de la connexion. Vérifiez vos identifiants et réessayez.');
      this.error.set(message);
      this.toaster.error('Connexion impossible', message);
    } finally {
      this.loading.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    this.error.set(null);
    if (!this.rEmail || !this.rPassword || !this.rFirstName || !this.rLastName) {
      this.error.set('Tous les champs sont requis.');
      this.toaster.warn('Champs manquants', 'Veuillez remplir tous les champs.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.register(this.rEmail, this.rPassword, this.rFirstName, this.rLastName);
      this.toaster.success('Compte créé', 'Votre espace est prêt.');
      this.router.navigate(['/program']);
    } catch (err) {
      const message = this.extractError(err, 'Échec de la création du compte.');
      this.error.set(message);
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
      if (err.status === 0) return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    }
    return fallback;
  }
}

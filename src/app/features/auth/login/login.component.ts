import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, FormRoot, required, email, minLength } from '@angular/forms/signals';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ToasterService } from '../../../core/notifications/toaster.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LoginModel    { email: string; password: string; }
interface RegisterModel { firstName: string; lastName: string; email: string; password: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputTextModule, ButtonModule, CheckboxModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

email = '';
  password = '';
  rememberMe = false;
  loading = false;


  onSubmit(): void {
    if (!this.email || !this.password) {
      this.toaster.warn('Champs requis', 'Veuillez renseigner votre e-mail et mot de passe.');
      return;
    }

    this.loading = true;

    // TODO: remplacer par votre appel AuthService
    setTimeout(() => {
      this.loading = false;
      // this.messageService.add({
      //   severity: 'success',
      //   summary: 'Connexion réussie',
      //   detail: `Bienvenue, ${this.email} !`,
      // });
    }, 1200);
  }
  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly toaster = inject(ToasterService);

  readonly activeTab = signal<'login' | 'register'>('login');

  // --- Login ---
  readonly loginModel = signal<LoginModel>({ email: '', password: '' });
  readonly loginForm  = form(
    this.loginModel,
    (f) => {
      required(f.email,    { message: 'Email requis' });
      email(f.email,       { message: 'Email invalide' });
      required(f.password, { message: 'Mot de passe requis' });
    },
    {
      submission: {
        action: async (field) => {
          const { email, password } = field().value();
          try {
            await this.auth.login(email, password);
            this.toaster.success('Connecté', `Bienvenue ${email}`);
            this.router.navigate(['/entrainement']);
          } catch (err) {
            this.toaster.error('Connexion impossible', this.extractError(err, 'Vérifiez vos identifiants.'));
          }
        }
      }
    }
  );

  // --- Register ---
  readonly registerModel = signal<RegisterModel>({ firstName: '', lastName: '', email: '', password: '' });
  readonly registerForm  = form(
    this.registerModel,
    (f) => {
      required(f.firstName, { message: 'Prénom requis' });
      required(f.lastName,  { message: 'Nom requis' });
      required(f.email,     { message: 'Email requis' });
      email(f.email,        { message: 'Email invalide' });
      required(f.password,  { message: 'Mot de passe requis' });
      minLength(f.password, 8, { message: '8 caractères minimum' });
    },
    {
      submission: {
        action: async (field) => {
          const { email, password, firstName, lastName } = field().value();
          try {
            await this.auth.register(email, password, firstName, lastName);
            this.toaster.success('Compte créé', 'Votre espace est prêt.');
            this.router.navigate(['/entrainement']);
          } catch (err) {
            this.toaster.error('Création impossible', this.extractError(err, 'Échec de la création.'));
          }
        }
      }
    }
  );

  private extractError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string | string[] } | string | null;
      if (typeof body === 'string' && body) return body;
      if (body && typeof body === 'object' && body.message)
        return Array.isArray(body.message) ? body.message.join(' ') : body.message;
      if (err.status === 0) return 'Impossible de contacter le serveur.';
    }
    return fallback;
  }
}
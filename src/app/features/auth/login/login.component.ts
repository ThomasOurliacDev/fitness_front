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
  rName = '';
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
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Échec de la connexion.');
      this.toaster.error('Connexion impossible', 'Vérifiez vos identifiants et réessayez.');
    } finally {
      this.loading.set(false);
    }
  }

  async submitRegister(): Promise<void> {
    this.error.set(null);
    if (!this.rEmail || !this.rPassword) {
      this.error.set('Email et mot de passe requis.');
      this.toaster.warn('Champs manquants', 'Email et mot de passe sont obligatoires.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.register(this.rEmail, this.rPassword, this.rName);
      this.toaster.success('Compte créé', 'Votre espace est prêt.');
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('Échec de la création du compte.');
      this.toaster.error('Création impossible', 'Une erreur est survenue. Réessayez plus tard.');
    } finally {
      this.loading.set(false);
    }
  }
}

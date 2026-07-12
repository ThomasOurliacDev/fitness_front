import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiEnvelope } from '../../../core/api/api-envelope';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ToasterService } from '../../../core/notifications/toaster.service';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';

type AuthView = 'login' | 'register';

interface LoginModel    { email: string; password: string; }
interface RegisterModel { firstName: string; lastName: string; email: string; password: string; }

/**
 * Validateur de groupe : vérifie que password et confirmPassword sont identiques.
 * L'erreur est posée directement sur le contrôle confirmPassword pour que
 * getFieldError() puisse l'afficher sous le bon champ.
 */
const passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password');
  const confirm = group.get('confirmPassword');

  if (!password || !confirm) return null;

  if (confirm.value && password.value !== confirm.value) {
    confirm.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
  } else if (confirm.errors) {
    const { passwordMismatch, ...rest } = confirm.errors;
    confirm.setErrors(Object.keys(rest).length ? rest : null);
  }

  return null;
};

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputTextModule, ButtonModule, CheckboxModule, FormsModule, CommonModule, FloatLabelModule, PasswordModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {




  private readonly fb = inject(FormBuilder);
  private readonly auth    = inject(AuthService);
  private readonly toaster = inject(ToasterService);
  private readonly router  = inject(Router);


readonly loginForm: FormGroup = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
  rememberMe: [false]
});

readonly registerForm: FormGroup = this.fb.group({
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]],
  confirmPassword: ['', Validators.required]
}, { validators: passwordsMatchValidator });


  readonly view = signal<AuthView>('login');
  readonly isLoading = signal(false);
 
  readonly isLogin = computed(() => this.view() === 'login');
  readonly isRegister = computed(() => this.view() === 'register');

  async onLogin(): Promise<void> {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const { email, password, rememberMe } = this.loginForm.value;

  this.isLoading.set(true);

  try {
    await this.auth.login(email, password, rememberMe);

    this.toaster.success(
      'Connexion réussie',
      'Bienvenue sur FitTrack !'
    );

    await this.router.navigate(['/entrainement']);
  } catch (err) {
    this.toaster.error(
      'Erreur de connexion',
      this.extractApiError(err) ?? 'Identifiants incorrects.'
    );
  } finally {
    this.isLoading.set(false);
  }
}

async onRegister(): Promise<void> {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  const { firstName, lastName, email, password } = this.registerForm.value;

  this.isLoading.set(true);

  try {
    await this.auth.register(email, password, firstName, lastName);

    this.toaster.success(
      'Compte créé',
      'Bienvenue sur FitTrack !'
    );

    await this.router.navigate(['/entrainement']);
  } catch (err) {
    this.toaster.error(
      "Erreur d'inscription",
      this.extractApiError(err) ?? "Impossible de créer le compte."
    );
  } finally {
    this.isLoading.set(false);
  }
}

/** Extrait le message d'erreur de l'enveloppe { success, data, error } renvoyée par le back. */
private extractApiError(err: unknown): string | null {
  if (err instanceof HttpErrorResponse) {
    const message = (err.error as ApiEnvelope<null> | null)?.error?.message;
    if (Array.isArray(message)) return message.join(' — ');
    if (typeof message === 'string') return message;
  }
  return null;
}

getFieldError(form: FormGroup, fieldName: string): string | null {
  const field = form.get(fieldName);

  if (!field || !field.touched || !field.errors) {
    return null;
  }

  if (field.errors['required']) {
    return 'Ce champ est obligatoire';
  }

  if (field.errors['email']) {
    return 'Adresse email invalide';
  }

  if (field.errors['minlength']) {
    return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
  }

  if (field.errors['maxlength']) {
    return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
  }

  if (field.errors['passwordMismatch']) {
    return 'Les mots de passe ne correspondent pas';
  }

  return 'Champ invalide';
}

 
  readonly features = [
    {
      icon: 'pi pi-calendar',
      title: 'Programmes Personnalisés',
      description: 'Créez et suivez des programmes d\'entraînement adaptés à vos objectifs',
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Suivi des Exercices',
      description: 'Enregistrez vos séries, répétitions et poids pour chaque exercice',
    },
    {
      icon: 'pi pi-chart-bar',
      title: 'Statistiques Détaillées',
      description: 'Analysez vos performances et suivez votre progression au fil du temps',
    },
    {
      icon: 'pi pi-star',
      title: 'Objectifs & Achievements',
      description: 'Définissez vos objectifs et débloquez des récompenses',
    },
  ];
 
  switchView(view: AuthView): void {
    this.view.set(view);
  }
 
}

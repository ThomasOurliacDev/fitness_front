import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ToasterService } from '../../../core/notifications/toaster.service';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';

type AuthView = 'login' | 'register';

interface LoginModel    { email: string; password: string; }
interface RegisterModel { firstName: string; lastName: string; email: string; password: string; }

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
  password: ['', Validators.required]
});

readonly registerForm: FormGroup = this.fb.group({
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]]
});


  readonly activeTab = signal<'login' | 'register'>('login');
  readonly view = signal<AuthView>('login');
  readonly isLoading = signal(false);
 
  readonly isLogin = computed(() => this.view() === 'login');
  readonly isRegister = computed(() => this.view() === 'register');

  async onLogin(): Promise<void> {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  const credentials = this.loginForm.value;

  this.isLoading.set(true);

  try {
    console.log(credentials);

    // await this.simulateRequest();

    this.toaster.success(
      'Connexion réussie',
      'Bienvenue sur FitTrack !'
    );

    await this.router.navigate(['/entrainement']);
  } catch {
    this.toaster.error(
      'Erreur de connexion',
      'Identifiants incorrects.'
    );
  } finally {
    this.isLoading.set(false);
  }
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

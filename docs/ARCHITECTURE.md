# Architecture

## Vue d'ensemble du système

Ce dépôt est le **front** d'une application de suivi de musculation en deux dépôts séparés :

| Dépôt | Rôle | Techno | Hébergement |
|---|---|---|---|
| `fitness_front` (celui-ci) | Application web | Angular 22 (standalone + signals) | Vercel |
| `fitness_back` | API REST | NestJS 11 + Prisma 7 | Render |

```
Navigateur
   │
   ▼
Angular (Vercel) ──HTTPS + JWT Bearer──▶ API NestJS (Render) ──▶ PostgreSQL (Neon)
```

Voir le repo `fitness_back` pour le modèle de données et la logique métier côté serveur
(programme → séance → exercice, surcharge progressive...).

---

## Stack et conventions

- **Angular 22**, exclusivement des **composants standalone** (pas de NgModules), pas de
  `provideZoneChangeDetection` — tout est en signals.
- **État** : signals (`signal`, `computed`) partout, jamais de `BehaviorSubject` pour du state de
  composant. Les appels HTTP restent en `Observable` (RxJS) — c'est le point de jonction naturel
  entre les deux mondes : un `.subscribe()` met à jour un signal.
- **`ChangeDetectionStrategy.Eager`** — variante utilisée dans ce projet plutôt que `OnPush`
  classique (disponible depuis Angular 22 aux côtés des signals).
- **UI** : PrimeNG 21 (preset Aura personnalisé, `_primeng-overrides.scss`) + Angular CDK (drag &
  drop) + Material Symbols pour les icônes.
- **Style** : SCSS avec design tokens en custom properties CSS (`--app-color-*`,
  `--airbus-blue-*`) — jamais de couleur en dur dans un composant.

---

## Organisation du code (`src/app/`)

```
src/app/
├── core/
│   ├── api/                   # ApiEnvelope<T> — le contrat de réponse du back
│   ├── auth/                    # AuthService, guards, interceptor JWT
│   ├── config/                    # Token d'injection ENVIRONMENT
│   ├── navigation/
│   ├── notifications/               # ToasterService
│   ├── responsive/
│   └── theme/
├── layouts/
│   ├── auth-layout/             # Layout des pages publiques (login/register)
│   └── main-layout/                # Layout privé (sidebar + topbar fixes)
├── features/
│   ├── auth/login/                  # Formulaires login/register (toggle, pas 2 routes)
│   ├── entrainement/
│   │   ├── entrainement.model.ts      # Toutes les interfaces alignées sur le schéma Prisma
│   │   ├── entrainement.service.ts      # Tous les appels HTTP, unwrap de l'enveloppe
│   │   ├── program/                       # Liste des programmes
│   │   ├── program-detail/                  # Détail : séances, exercices, drag & drop, édition
│   │   ├── workout/
│   │   └── session/                           # Player de séance en cours (voir plus bas)
│   ├── activity/
│   ├── history/
│   └── settings/
└── shared/ui/
```

---

## Mécanismes transverses

### 1. L'enveloppe API

Le back renvoie systématiquement `{ success, data, error }`. **Aucun composant ne manipule cette
enveloppe directement** — chaque méthode de `entrainement.service.ts` (et `auth.service.ts`) la
déballe immédiatement :

```ts
getProgram(id: string) {
  return this.httpClient
    .get<ApiEnvelope<Program>>(`${this.apiUrl}/program/${id}`)
    .pipe(map(res => res.data));
}
```

Les erreurs se lisent via `err.error?.error?.message` (un `HttpErrorResponse` dont le `.error` est
l'enveloppe complète) — voir `extractApiError()` dans `login.component.ts` pour le pattern de
référence, réutilisé partout ailleurs.

### 2. Authentification

- `AuthService` (`core/auth/auth.service.ts`) détient `user`/`token` en signals, calcule
  `isAuthenticated` en `computed`.
- **Remember me** : `login(email, password, rememberMe)` écrit dans `localStorage` (persiste après
  fermeture du navigateur) ou `sessionStorage` (effacé à la fermeture de l'onglet) selon le choix ;
  l'autre storage est systématiquement nettoyé pour ne jamais avoir deux sessions en parallèle.
  `register` est toujours en session d'onglet (pas de case à cocher sur ce formulaire).
- `auth.interceptor.ts` attache le Bearer **uniquement** aux requêtes vers `env.apiUrl` (jamais
  vers un tiers), et déconnecte automatiquement sur un `401` — sauf sur les routes `/auth/*`
  elles-mêmes (un 401 au login = mauvais mot de passe, pas une session expirée).
- `auth.guard.ts` : `authGuard` (routes privées) et `guestGuard` (login, si déjà connecté). Les
  deux sont des `CanMatchFn` — **`guestGuard` doit renvoyer `false` et non un `UrlTree`** quand
  l'utilisateur est connecté, car la route qu'il garde matche en préfixe toutes les URLs ; y
  renvoyer une redirection provoquerait une boucle infinie avec le layout privé qui suit. C'est un
  bug réel qui s'est produit à la réactivation des guards — garder ce commentaire en tête avant d'y
  retoucher.

### 3. Le player de séance (`features/entrainement/session/`)

Le composant le plus dense du repo. Reçoit du back un template de séance **déjà enrichi** d'une
suggestion de progression par série (`suggestedReps`, `suggestedWeight`, `progression`) — il ne
recalcule rien, il **affiche** :
- une série à la fois (« Série 2/4 »), objectif pré-rempli avec la suggestion ;
- deux actions : Réussi / Raté (`success: boolean` envoyé au back) ;
- un compte à rebours de repos avec barre de progression, +30s, bip + vibration à zéro ;
- un déroulé complet en dessous, cliquable pour sauter à une série non faite (permet de rattraper
  une série sautée sans perdre sa place).

### 4. Drag & drop des exercices (`program-detail/`)

Angular CDK, **imbriqué à deux niveaux** : les groupes musculaires sont eux-mêmes draggables
(`cdkDropList` externe) et chaque groupe contient une liste d'exercices draggable
(`cdkDropList` interne par groupe). Le réordonnancement est optimiste côté UI puis confirmé par un
`PATCH /workout-exercises/reorder` qui valide server-side une **permutation exacte** des exercices
de la séance (rejette toute liste incomplète ou avec doublons).

---

## Variables d'environnement (`src/environments/`)

Un fichier par cible de build, sélectionné via `fileReplacements` dans `angular.json` :

| Fichier | Configuration Angular | Contenu |
|---|---|---|
| `environment.ts` | (défaut, dev local `ng serve`) | `apiUrl: http://localhost:3000/v1` |
| `environment.dev.ts` | `--configuration dev` | URL de l'API Render dev |
| `environment.int.ts` | `--configuration int` | URL de l'API Render int |
| `environment.prod.ts` | `--configuration production` | URL de l'API Render prod |

**Ne jamais coder une URL d'API en dur dans un composant ou un service** — toujours passer par le
token d'injection `ENVIRONMENT` (`core/config/`). Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le
lien entre ces fichiers et la configuration des projets Vercel.

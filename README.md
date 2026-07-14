# Fitness App — Frontend

Application Angular de suivi de musculation (programmes, séances, exécution avec surcharge
progressive). Consomme l'API du repo `fitness_back`.

## 📚 Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — organisation du code, auth (remember me), player de séance, drag & drop
- [docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md) — démarrer en local, configurations de build
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — les 3 environnements Vercel, le pipeline CI/CD, déployer en INT/PROD
- [docs/HOTFIX.md](./docs/HOTFIX.md) — corriger un bug critique en production

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

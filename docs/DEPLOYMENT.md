# Déploiement

## Les 3 environnements

| Environnement | Déclencheur | Projet Vercel | Build Command |
|---|---|---|---|
| **DEV** | push sur `develop` (auto) | `fitness-front-dev` (nom réel à vérifier dans Vercel) | `npm run build -- --configuration dev` |
| **INT** | tag `int-*` (ex. `int-2026.07.12`) | `fitness-front-int` | `npm run build -- --configuration int` |
| **PROD** | tag `prod-*` (ex. `prod-v1.0.0`) | `fitness-front-prod` | `npm run build -- --configuration production` |

Un lancement manuel est possible depuis **Actions → Deploy Frontend → Run workflow**, avec choix
de la cible.

> ⚠️ **Chaque projet Vercel doit avoir son Build Command explicitement réglé** (Settings → Build &
> Development Settings). Sans ça, Vercel lance `npm run build` tout court, qui prend la
> configuration Angular **`production`** par défaut — le déploiement dev appellerait alors les
> URLs de prod. Deux autres incidents déjà rencontrés sur ce projet, avec leur diagnostic complet,
> sont documentés dans le repo `fitness_back` sous `docs/TROUBLESHOOTING.md` (« Build Vercel qui
> échoue : `Could not resolve "@angular/cdk/..."` » et « Build Vercel qui prend la mauvaise
> configuration ») — ce fichier centralise les incidents de déploiement des deux dépôts, front
> compris, faute d'un troisième repo commun où le mettre.
>
> ⚠️ **Désactive l'intégration Git native de Vercel** sur ces projets (Settings → Git → Disconnect,
> ou ne jamais la connecter à la création) : sinon chaque push déclenche **à la fois** un
> déploiement Vercel natif (avec la mauvaise configuration, voir ci-dessus) et celui de la GitHub
> Action — double déploiement, et c'est souvent le mauvais qui "gagne" en dernier.

---

## Le pipeline ([.github/workflows/deploy-frontend.yml](../.github/workflows/deploy-frontend.yml))

```
push develop ──┐
tag int-*   ────┼──▶ target (dev/int/prod) ──▶ verify (build de contrôle) ──▶ deploy
tag prod-*  ────┘                                                                │
workflow_dispatch ──┘                                            ┌───────────────┴───────────────┐
                                                                   │ 1. sélectionne le projet Vercel  │
                                                                   │    de la cible + vérifie secrets   │
                                                                   │ 2. vercel pull                       │
                                                                   │ 3. vercel build --prod                │
                                                                   │ 4. vercel deploy --prebuilt --prod       │
                                                                   └────────────────────────────────────────┘
```

`verify` rebuild le commit avec la configuration Angular par défaut, uniquement pour attraper les
erreurs TypeScript/template avant d'aller plus loin — ce n'est pas ce build-là qui est déployé
(`deploy` refait un build complet avec la bonne configuration via la CLI Vercel).

---

## Secrets requis

Chemin : repo `fitness_front` → **Settings → Secrets and variables → Actions**.

Contrairement au repo back, ces secrets sont des **secrets de repo** (pas par environnement) car
leurs noms sont déjà distincts par cible :

| Secret | Valeur | Où la trouver |
|---|---|---|
| `VERCEL_TOKEN` | token d'API personnel | Vercel → avatar → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | id du compte/team | `.vercel/project.json` après un `vercel link` local, champ `orgId` |
| `VERCEL_PROJECT_ID_DEV` | id du projet Vercel dev | Vercel → le projet → Settings → General → Project ID |
| `VERCEL_PROJECT_ID_INT` | id du projet Vercel int | idem |
| `VERCEL_PROJECT_ID_PROD` | id du projet Vercel prod | idem |

Les environnements GitHub `DEV`/`INT`/`PROD` existent pour tracer les déploiements dans l'onglet
**Environments** du repo et porter la protection de la prod (voir plus bas) — ils n'ont pas besoin
de secrets dupliqués dedans tant que ceux-ci restent des secrets de repo.

---

## Faire un déploiement en INT ou PROD

```bash
git checkout develop
git pull

# INT
git tag int-2026.07.12
git push origin int-2026.07.12

# PROD (après validation en INT)
git tag prod-v1.2.0
git push origin prod-v1.2.0
```

Suis l'exécution dans l'onglet **Actions**. Si la protection **Required reviewers** est activée
sur l'environnement `PROD`, le job `deploy` attend une approbation manuelle.

**Avant le tout premier déploiement d'un environnement**, vérifie que le fichier
`src/environments/environment.<int|prod>.ts` pointe vers la **vraie** URL du service Render
correspondant (pas le placeholder `https://api-int.example.com/v1` livré par défaut) — sans quoi
le front build correctement mais parle dans le vide.

---

## Protéger la prod

Repo → **Settings → Environments → PROD** → **Required reviewers** → ajoute-toi. Un tag `prod-*`
mettra le job `deploy` en pause jusqu'à approbation.

## Rollback

Chaque déploiement Vercel reste accessible individuellement (dashboard du projet → onglet
**Deployments**) — un clic sur *Promote to Production* sur un déploiement antérieur restaure
l'état précédent immédiatement, sans avoir besoin de retagger/repousser quoi que ce soit côté
GitHub. Contrairement au back, il n'y a pas de considération de migration à gérer côté front pour
un rollback (le front n'a pas d'état persistant propre).

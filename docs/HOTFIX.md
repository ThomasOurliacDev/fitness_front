# Gérer un hotfix en production

Même logique que côté back (voir `fitness_back/docs/HOTFIX.md` si tu veux comparer) : on part du
code **réellement en prod**, pas de `develop`, pour ne pas embarquer de features non validées.

## Procédure

### 1. Identifier le tag actuellement en prod

```bash
git fetch --tags
git tag --sort=-creatordate | grep '^prod-' | head -1   # ex: prod-v1.2.0
```

### 2. Créer la branche de hotfix depuis ce tag

```bash
git checkout -b hotfix/nom-du-bug prod-v1.2.0
```

### 3. Corriger, tester localement

```bash
npm run start:dev     # sert avec la configuration `dev` (URL de l'API dev)
```
Reproduis le bug avant de corriger. Si le fix touche un composant partagé (ex : `entrainement.service.ts`,
un guard), vérifie qu'il n'a pas d'effet de bord sur d'autres écrans — le repo n'a pas de suite de
tests e2e à ce jour, la vérification manuelle du parcours concerné est indispensable.

```bash
npm run build          # build de contrôle avec la configuration par défaut
```

### 4. Ouvrir une PR vers `master`

```bash
git push -u origin hotfix/nom-du-bug
```
PR `hotfix/nom-du-bug → master`. La CI (`ci.yml`) rebuild le commit.

### 5. Merger, tagger, déployer

```bash
git checkout master
git pull
git tag prod-v1.2.1
git push origin prod-v1.2.1
```
Si l'environnement `PROD` a la protection **Required reviewers**, approuve le déploiement dans
l'onglet Actions. Vérifie ensuite dans le navigateur (sur le domaine stable du projet Vercel prod,
pas une URL de déploiement ponctuel) que le fix est bien visible.

### 6. Rapporter le fix sur `develop`

```bash
git checkout develop
git pull
git merge hotfix/nom-du-bug
git push
```
Redéclenche un déploiement DEV automatique — normal.

### 7. Nettoyage

```bash
git branch -d hotfix/nom-du-bug
git push origin --delete hotfix/nom-du-bug
```

---

## Checklist express

- [ ] Branche créée depuis le **tag prod actuel**
- [ ] Bug reproduit et corrigé en local (`npm run start:dev`)
- [ ] PR revue, CI verte
- [ ] Mergé sur `master`, nouveau tag `prod-x.y.z+1`
- [ ] Déploiement vérifié dans le navigateur (domaine stable, pas une URL de preview)
- [ ] Fix rapporté sur `develop`
- [ ] Branche hotfix supprimée

## Piège spécifique au front : vérifier sur le bon domaine

Après un déploiement, Vercel génère une URL unique par déploiement
(`https://mon-front-a1b2c3d4-monteam.vercel.app`) **et** met à jour le domaine stable du projet
(`https://mon-front.vercel.app`). Vérifie toujours le fix sur le **domaine stable** — c'est celui
que les vrais utilisateurs (et `FRONTEND_URL` côté API, pour le CORS) utilisent.

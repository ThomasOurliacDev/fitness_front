# Développement local

## Prérequis

- Node.js 22

## Démarrage

```bash
npm install --legacy-peer-deps   # le CI utilise ce flag aussi, garde-le en local pour cohérence
npm run start:dev                 # sert sur http://localhost:4200 avec la configuration `dev`
```

`start:dev` utilise `environment.dev.ts` → pointe vers l'API **Render dev déployée**, pas une API
locale. Pour travailler contre une API tournant sur ta machine :

```bash
npm start          # ou `ng serve` — utilise environment.ts (défaut), apiUrl = http://localhost:3000/v1
```
Assure-toi alors que le repo `fitness_back` tourne en local (`npm run start:dev` là-bas, voir son
`docs/LOCAL_DEV.md`) sur le port 3000.

## Configurations de build disponibles

| Commande | Configuration | Utilise |
|---|---|---|
| `npm start` / `ng serve` | (défaut) | `environment.ts` — API locale |
| `npm run start:dev` | `dev` | `environment.dev.ts` — API Render dev |
| `npm run start:int` | `int` | `environment.int.ts` — API Render int |
| `npm run start:prod` | `production` | `environment.prod.ts` — API Render prod (⚠️ lance un serveur de dev Angular pointant vers la vraie prod — à utiliser avec prudence, uniquement pour du débogage ponctuel, jamais pour développer) |
| `npm run build:dev` / `:int` / `:prod` | idem, en build statique | `dist/poc/` |

## Comptes de test

Si l'API locale utilise la même base que le repo back en local (voir son `docs/LOCAL_DEV.md`),
les comptes seedés/créés là-bas fonctionnent directement ici — pas de setup supplémentaire côté
front.

## Erreurs fréquentes en local

- **CORS en local** : si tu sers le front sur un port différent de `4200` (ou si tu changes
  `PORT` côté back), pense à mettre à jour `FRONTEND_URL` dans le `.env` du back — sinon les
  appels échouent en CORS même en local, exactement comme en déploiement.
- **Dépendance "fantôme"** : si tu installes un paquet avec `npm install` sans qu'il apparaisse
  dans `package.json` (ça arrive en testant vite une lib), la CI/Vercel le retirera au prochain
  `npm ci`/`npm install` propre. Vérifie toujours `npm ls <paquet>` après une install manuelle —
  s'il est marqué `extraneous`, il n'est pas déclaré et disparaîtra au prochain déploiement.

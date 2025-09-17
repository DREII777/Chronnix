# Chronnix — refonte modulaire

Chronnix est une feuille de temps connectée à Supabase permettant de gérer les chantiers, les ouvriers et les exports comptables. Cette refonte transforme l'ancienne page HTML monolithique en une application React + TypeScript modulaire, prête pour un bundler moderne (Vite).

## Architecture cible

```
.
├── index.html              # Point d'entrée Vite, charge Tailwind CDN + config Supabase
├── src/
│   ├── App.tsx             # Composition racine, choix Auth/Dashboard
│   ├── components/
│   │   ├── auth/           # Authentification (SignIn)
│   │   ├── common/         # UI génériques (Modal)
│   │   └── dashboard/      # UI métier (header, toolbar, stats, panels…)
│   ├── hooks/              # Hooks maison (useAuth, useDashboardData)
│   ├── services/           # Accès Supabase + exports XLSX
│   ├── types/              # Modèles partagés et extensions globales
│   └── utils/              # Fonctions de formatage et de calcul (date/heure…)
├── tsconfig*.json          # Configuration TypeScript
├── vite.config.ts          # Configuration Vite + plugin React
├── config.js               # Fallback Supabase (injecte window.SB)
├── .env.example            # Variables d'environnement Vite pour Supabase
└── README.md
```

Chaque dossier expose un `index.ts` pour des imports propres. Les utilitaires communs (dates, heures, conversions) sont factorisés et réutilisés par les composants et hooks. Les exports XLSX sont centralisés dans `services/xlsxService.ts`, avec chargement dynamique de `xlsx`.

## Découpage fonctionnel

| Module | Rôle principal |
| --- | --- |
| `hooks/useAuth` | Gestion de la session Supabase et écoute des changements d'état. |
| `hooks/useDashboardData` | Source de vérité du tableau de bord (projets, ouvriers, affectations, exports, formulaires). |
| `components/auth/SignIn` | UI de connexion (OTP, whitelist). |
| `components/dashboard/*` | Composants UI spécialisés (WorkersPanel, TimesheetSection, Toolbar, Stats, Modals). |
| `services/supabaseClient` | Initialisation du client Supabase. |
| `services/xlsxService` | Génération des fichiers XLSX (paie et détail). |
| `utils/*` | Helpers de dates, heures et conversions numériques. |

## Installation & scripts

1. **Dépendances**
   ```bash
   npm install
   ```
   > _Note : l'installation nécessite un accès npm. En environnement restreint, copiez un `package-lock.json` généré ailleurs ou utilisez un registre interne._

2. **Configuration Supabase**
   - Option 1 : créer un fichier `.env` en s'inspirant de `.env.example` :
     ```env
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```
   - Option 2 : conserver `config.js` (script inclus dans `index.html`) qui définit `window.SB`.

3. **Développement**
   ```bash
   npm run dev
   ```

4. **Build de production**
   ```bash
   npm run build
   ```

5. **Prévisualisation**
   ```bash
   npm run preview
   ```

## Plan de refactorisation

1. **Initialisation Vite + TypeScript** : configuration des scripts npm, Vite, tsconfig, styles globaux et point d'entrée React.
2. **Factorisation des utilitaires et services** : création des helpers de date/heure, client Supabase typé, services d'export XLSX.
3. **Découpage UI / Hooks** : extraction des composants (auth, dashboard, modals, panels), création du hook `useDashboardData` pour encapsuler la logique métier.
4. **Documentation & DX** : ajout d'un README détaillé, d'un `.env.example` et des exports d'index pour une navigation claire du code.

## Tests

Les tests automatisés ne sont pas fournis. Le build TypeScript (`npm run build`) assure la validation statique. Pensez à exécuter les commandes ci-dessus après configuration des dépendances.

## Licence

Projet interne TMF Compta — usage restreint.

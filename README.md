# Chronnix — feuille de temps connectée à Supabase

Chronnix est une application React + TypeScript permettant aux équipes TMF Compta de gérer les chantiers, les ouvriers et les heures travaillées. Cette version modulaire remplace l'ancienne page HTML en centralisant l'authentification OTP, la planification mensuelle, le suivi des taux horaires et les exports comptables (paie & détaillé) dans une interface unifiée.

## Fonctionnalités principales

- **Authentification sécurisée** : connexion par OTP via Supabase, contrôle de la whitelist (`allowed_users`) et gestion d'états de chargement/erreur accessibles.
- **Tableau de bord par chantier** : sélection d'un projet, navigation mensuelle, affichage des totaux (heures, facturation, paie) et bandeau de notifications éphémères.
- **Gestion des équipes** : panneau latéral pour créer/supprimer des ouvriers, ajuster le taux horaire, contrôler les assignations (`project_workers`).
- **Feuille de temps interactive** : saisie rapide des heures, alternance statut travaillé/absent, validations `HH:MM` ↔ décimal, calcul des totaux par ouvrier et persistance locale du contexte (chantier + mois).
- **Exports comptables** : génération à la volée de deux fichiers XLSX (paie & détail) via `xlsx`, pré-chargement automatique du module et téléchargement formaté.
- **Expérience prête pour la production** : manifest PWA, service worker minimal, boutons accessibles, raccourcis clavier pour naviguer dans les champs OTP et fermeture automatique des messages de feedback.

## Stack technique

- [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) pour le bundling et le serveur de dev
- [Supabase JS 2](https://supabase.com/docs/reference/javascript/introduction) pour l'authentification et le CRUD
- [xlsx](https://github.com/SheetJS/sheetjs) pour les exports Excel
- CSS utilitaire maison (`src/styles.css`) + classes utilitaires Tailwind chargées en CDN dans `index.html`
- Service worker (`sw.js`) et manifest (`manifest.json`) pour l'installation en web app

## Structure du projet

```
.
├── index.html                # Entrée Vite + chargement Tailwind CDN + config Supabase globale
├── config.js                 # Fallback de configuration (définit window.SB)
├── manifest.json / sw.js     # PWA minimale
├── src/
│   ├── main.tsx              # Montage React + import du style global
│   ├── App.tsx               # Choix SignIn/Dashboard selon l'état d'authentification
│   ├── config.ts             # Lecture de la config Supabase (.env ou window.SB)
│   ├── styles.css            # Style de base (OTP, boutons, tableaux…)
│   ├── hooks/
│   │   ├── useAuth.ts        # Gestion de session Supabase et rafraîchissement automatique
│   │   └── useDashboardData.ts# Source de vérité du tableau de bord (Supabase, localStorage…)
│   ├── components/
│   │   ├── auth/SignIn.tsx   # Connexion OTP + whitelist
│   │   ├── common/Modal.tsx  # Infrastructure modales réutilisable
│   │   └── dashboard/        # Header, Toolbar, WorkersPanel, Timesheet, Stats, Modals…
│   ├── services/
│   │   ├── supabaseClient.ts # Initialisation du client (config.ts)
│   │   └── xlsxService.ts    # Générateurs XLSX + préchargement
│   ├── utils/                # Helpers de dates, nombres, conversions HH:MM, groupements
│   └── types/                # Modèles partagés (Project, Worker, TimeEntry…)
└── package.json              # Scripts npm et dépendances
```

## Flux de données & Supabase

- **Tables attendues** :
  - `allowed_users(email, active)` pour la whitelist OTP.
  - `projects` (nom, client, taux facturable, heures par défaut, propriétaire).
  - `workers` (nom, email, taux paie, propriétaire).
  - `project_workers` (relations n↔n entre projets et ouvriers).
  - `time_entries` (heures/jour, statut, notes éventuelles).
- **Hooks clés** : `useAuth` orchestre la session Supabase (écoute des changements, erreurs). `useDashboardData` centralise les appels CRUD, la gestion des modales, l'état d'édition, les exports et la synchronisation locale (localStorage + préchargement `xlsx`).
- **Services** : `supabaseClient.ts` applique la configuration validée par `src/config.ts`. `xlsxService.ts` produit les feuilles "Paie" et "Détail" avec totaux, en s'appuyant sur les helpers date/heure.

## Configuration Supabase

1. **Variables d'environnement (recommandé)** : créer un `.env` (ou `.env.local`) à partir de `.env.example` et renseigner :
   ```env
   VITE_SUPABASE_URL=https://...supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
2. **Fallback `config.js`** : si vous ne pouvez pas utiliser d'env Vite, renseignez `config.js` (chargé dans `index.html`) pour définir `window.SB = { url, anon }`.
3. `src/config.ts` lira ces valeurs au démarrage et lèvera une erreur claire si la configuration est absente.

## Installation & scripts

```bash
npm install      # installe les dépendances
npm run dev      # lance Vite en mode développement
npm run build    # vérifie les types (tsc) puis construit le bundle
npm run preview  # sert le build pour validation finale
```

Les dépendances Playwright sont présentes mais aucun scénario de test n'est fourni. `npm run build` constitue donc la validation minimale avant déploiement.

## Notes de développement

- Les états clés (chantier sélectionné, mois affiché) sont conservés dans `localStorage` pour fluidifier la reprise de session.
- Les exports XLSX sont générés côté client ; assurez-vous d'activer les accès Supabase en lecture sur les tables concernées.
- L'interface est conçue pour fonctionner hors Tailwind compilé : les classes utilitaires critiques sont définies dans `styles.css` afin de rester autonome.
- Pour déployer en PWA, publiez `manifest.json` et `sw.js` tels quels ; le service worker actuel se contente de prendre le contrôle immédiatement (pas de cache offline).

## Licence

Projet interne TMF Compta — usage restreint.

# Plan de Développement CRM B2Dev

## Phase 1 : Setup Initial 🚧
- [ ] Installation Next.js + TypeScript + Tailwind
- [ ] Création CLAUDE.md (mise à jour avec specs complètes)
- [ ] Création plan.md
- [ ] Installation Prisma + Supabase
- [ ] Création schéma BDD (table leads)
- [ ] Installation Playwright + xlsx

## Phase 2 : Validation de Sites Web
- [ ] Fonction de détection type de site (annuaire, réseaux sociaux, plateforme)
- [ ] Fonction de vérification responsive (mobile-friendly)
- [ ] Fonction de détection date site (avant/après 2018)
- [ ] Tests unitaires de validation

## Phase 3 : Scraping Google Maps
- [ ] Setup Playwright
- [ ] Fonction de connexion à Google Maps
- [ ] Extraction des données de base (nom, tel, adresse, ville)
- [ ] Extraction note Google + nombre d'avis
- [ ] Intégration validation site web
- [ ] Limite 100 prospects/ville
- [ ] Vérification doublons en temps réel
- [ ] Gestion des erreurs et timeout

## Phase 4 : API Routes
- [ ] POST /api/scrape (lancer le scraping avec validation)
- [ ] GET /api/leads (liste + filtres ville/statut/motif)
- [ ] POST /api/leads (créer lead manuel)
- [ ] GET /api/leads/[id] (détail lead)
- [ ] PUT /api/leads/[id] (modifier lead, notamment statut)
- [ ] DELETE /api/leads/[id] (supprimer lead)
- [ ] POST /api/leads/import (import Excel avec détection doublons)
- [ ] GET /api/export (export Excel)

## Phase 5 : Authentification Next-Auth 🔐
- [ ] Installation Next-Auth
- [ ] Configuration Google OAuth Provider
- [ ] Création fichier `lib/auth-config.ts` avec AUTHORIZED_EMAILS
- [ ] Page `/login` avec bouton "Se connecter avec Google"
- [ ] Middleware pour protéger toutes les routes sauf `/login` et `/api/auth`
- [ ] Gestion des accès refusés (email non autorisé)
- [ ] Tests avec email autorisé vs non autorisé
- [ ] Layout avec bouton "Se déconnecter"

## Phase 6 : Page Scraping
- [ ] Layout avec navigation (Scraping / Leads)
- [ ] Formulaire : type d'entreprise + villes
- [ ] Bouton "Lancer le scraping"
- [ ] Affichage temps réel des résultats
- [ ] afficher une barre de chargement
- [ ] Compteur par ville
- [ ] Gestion des erreurs utilisateur

## Phase 7 : Page Leads
- [ ] Tableau avec colonnes : Nom, Tel, Site, Adresse, Ville, Motif, Statut, Note
- [ ] Select inline pour statut (9 options avec emojis)
- [ ] Filtres : ville, statut, motif
- [ ] Tri par colonne
- [ ] Clic sur ligne → détail lead
- [ ] Bouton "Importer Excel" avec upload
- [ ] Bouton "Exporter Excel"
- [ ] Affichage des doublons lors de l'import
- [ ] Design responsive et professionnel

## Phase 8 : Import/Export Excel
- [ ] Parser fichier Excel uploadé
- [ ] Mapper colonnes vers schéma BDD
- [ ] Détection et gestion des doublons
- [ ] Rapport d'import (X importés, Y doublons)
- [ ] Export vers Excel avec toutes les colonnes
- [ ] Format réutilisable (import/export compatible)

## Phase 9 : Tests & Optimisations
- [ ] Tests du scraping sur différentes villes
- [ ] Tests import Excel avec doublons
- [ ] Optimisation performances (pagination?)
- [ ] Tests de validation de sites
- [ ] Gestion des cas limites

## Phase 10 : Polish & Déploiement
- [ ] Design final Tailwind
- [ ] Messages de succès/erreur clairs
- [ ] Loading states
- [ ] Documentation utilisateur
- [ ] Déploiement Vercel + Supabase

---

## Décisions Techniques

### 2024-12-13 : Specs Complètes du Projet
- **2 pages principales** : Scraping + Leads
- **Scraping intelligent** : ne garde que sites obsolètes/inexistants
- **Gestion doublons** : pendant scraping ET import Excel
- **9 statuts de lead** : du contact initial au projet fini
- **Import/Export Excel** : pour migrer données existantes

### 2024-12-13 : Choix du Stack
- **Next.js 14** : Framework full-stack (frontend + API)
- **PostgreSQL** : Contraintes UNIQUE pour éviter doublons
- **Prisma** : ORM moderne avec migrations auto
- **Playwright** : Scraping robuste avec vrai navigateur
- **Supabase** : Hosting PostgreSQL gratuit + interface admin
- **xlsx** : Bibliothèque pour parsing Excel
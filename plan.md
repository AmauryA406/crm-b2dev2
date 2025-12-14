# Plan de Développement CRM B2Dev

## Phase 1 : Setup Initial 🚧
- [x] Installation Next.js + TypeScript + Tailwind
- [x] Création CLAUDE.md (mise à jour avec specs complètes)
- [x] Création plan.md
- [x] Installation Prisma + Supabase
- [x] Création schéma BDD (table leads)
- [x] Installation Playwright + xlsx

## Phase 2 : Authentification Next-Auth 🔐
- [x] Installation Next-Auth
- [x] Configuration Google OAuth Provider
- [x] Création fichier `lib/auth-config.ts` avec AUTHORIZED_EMAILS
- [x] Page `/login` avec bouton "Se connecter avec Google"
- [x] Middleware pour protéger toutes les routes sauf `/login` et `/api/auth`
- [x] Gestion des accès refusés (email non autorisé)
- [x] Tests avec email autorisé vs non autorisé
- [x] Layout avec bouton "Se déconnecter"

## Phase 3 : Validation de Sites Web
- [x] Fonction de détection type de site (annuaire, réseaux sociaux, plateforme)
- [x] Fonction de vérification responsive (mobile-friendly)
- [x] Fonction de détection date site (avant/après 2018)
- [x] Tests unitaires de validation

## Phase 4 : Scraping Google Maps
- [x] Setup Playwright
- [x] Fonction de connexion à Google Maps
- [x] Extraction des données de base (nom, tel, adresse, ville)
- [x] Extraction note Google + nombre d'avis
- [x] Intégration validation site web
- [x] Limite 100 prospects/ville
- [x] Vérification doublons en temps réel
- [x] Gestion des erreurs et timeout

## Phase 5 : API Routes
- [x] POST /api/scrape (lancer le scraping avec validation)
- [x] GET /api/leads (liste + filtres ville/statut/motif)
- [x] POST /api/leads (créer lead manuel)
- [x] GET /api/leads/[id] (détail lead)
- [x] PUT /api/leads/[id] (modifier lead, notamment statut)
- [x] DELETE /api/leads/[id] (supprimer lead)
- [x] POST /api/leads/import (import Excel avec détection doublons)
- [x] GET /api/export (export Excel)

## Phase 6 : Page Scraping
- [x] Layout avec navigation (Scraping / Leads)
- [x] Formulaire : type d'entreprise + villes
- [x] Bouton "Lancer le scraping"
- [x] Affichage temps réel des résultats
- [x] afficher une barre de chargement
- [x] Compteur par ville
- [x] Gestion des erreurs utilisateur

## Phase 7 : Page Leads
- [x] Tableau avec colonnes : Nom, Tel, Site, Adresse, Ville, Motif, Statut, Note
- [x] Select inline pour statut (9 options avec emojis)
- [x] Filtres : ville, statut, motif
- [x] Tri par colonne
- [x] Clic sur ligne → détail lead
- [x] Bouton "Importer Excel" avec upload
- [x] Bouton "Exporter Excel"
- [x] Affichage des doublons lors de l'import
- [x] Design responsive et professionnel

## Phase 8 : Import/Export Excel
- [x] Parser fichier Excel uploadé
- [x] Mapper colonnes vers schéma BDD
- [x] Détection et gestion des doublons
- [x] Rapport d'import (X importés, Y doublons)
- [x] Export vers Excel avec toutes les colonnes
- [x] Format réutilisable (import/export compatible)

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
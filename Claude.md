# CRM B2Dev - Scraping Google Maps

## 🚨 RÈGLES CRITIQUES
- TOUJOURS vérifier les doublons avant insertion en BDD (téléphone, email, siteWeb)
- Gérer les doublons **pendant le scraping** ET **pendant l'import Excel**
- JAMAIS scraper plus de 100 prospects par ville
- Ne scraper QUE les entreprises sans site valide ou avec site obsolète
- Les téléphones doivent être formatés sans espaces : "0612345678"
- Tous les commentaires et messages en FRANÇAIS

## 📋 À PROPOS DU PROJET
CRM pour identifier et contacter des artisans/PME avec des sites web obsolètes ou inexistants.
L'objectif est de leur proposer les services de création de sites web de B2Dev.

Oui exactement ! Je vais t'aider à les mettre à jour.
📝 Mise à jour du CLAUDE.md
Ajoute cette section juste après "À PROPOS DU PROJET" :
markdown## 🔐 AUTHENTIFICATION

**Système : Next-Auth avec emails autorisés**

**Fonctionnement :**
- Liste d'emails autorisés dans le code (AUTHORIZED_EMAILS)
- Connexion via Google OAuth uniquement
- Si email pas dans la liste → Accès refusé
- Si email autorisé → Accès complet au CRM

**Emails autorisés actuels :**
- amaury.allemand@example.com (Amaury - Commercial)
- partenaire.technique@example.com (Partenaire - Dev)
- (à compléter avec vrais emails)

**Pages publiques :**
- `/login` : Page de connexion Google
- `/api/auth/*` : Routes Next-Auth

**Pages protégées (toutes les autres) :**
- `/scraping` : Scraping Google Maps
- `/leads` : Gestion des leads
- `/api/*` : Toutes les API routes

**Configuration :**
- Provider : Google OAuth
- Variables d'env nécessaires :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

**Ajout/Retrait de membres :**
- Modifier le tableau `AUTHORIZED_EMAILS` dans `lib/auth-config.ts`
- Redéployer l'application

**Utilisateurs :**
- Amaury : gestion commerciale et relation client
- Partenaire technique : développement des sites

**Stack technique :**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- PostgreSQL via Supabase
- Prisma ORM
- Playwright pour scraping Google Maps
- Tailwind CSS
- xlsx pour import/export Excel

## 🏗️ STRUCTURE DU PROJETapp/
├── page.tsx                    # Redirection vers /scraping
├── scraping/
│   └── page.tsx                # PAGE SCRAPING avec formulaire
├── leads/
│   ├── page.tsx                # PAGE LEADS avec tableau + import Excel
│   └── [id]/page.tsx           # Détail d'un lead
└── api/
├── scrape/route.ts         # POST: Lancer le scraping
├── leads/
│   ├── route.ts            # GET: liste leads, POST: créer lead
│   ├── [id]/route.ts       # GET/PUT/DELETE: lead individuel
│   └── import/route.ts     # POST: Import fichier Excel
└── export/route.ts         # GET: Export Excellib/
├── scraper.ts                  # Logique Playwright pour Google Maps
├── site-validator.ts           # Validation qualité site web
├── database.ts                 # Fonctions Prisma réutilisables
├── excel-parser.ts             # Parse fichiers Excel uploadés
├── validators.ts               # Validation et nettoyage des données
└── types.ts                    # Types TypeScript partagésprisma/
├── schema.prisma               # Schéma de la base de données
└── migrations/                 # Historique des migrationscomponents/
├── ScrapingForm.tsx            # Formulaire scraping (métier + villes)
├── LeadsTable.tsx              # Tableau des leads avec filtres
├── LeadRow.tsx                 # Ligne de tableau lead
├── ImportExcel.tsx             # Upload + import Excel
└── StatusSelect.tsx            # Select pour statut lead

## 🎯 PAGE SCRAPING

### Configuration Anti-Ban Optimale

**Délais (millisecondes) :**
- `PAGE_LOAD`: 3000ms - Après chargement Google Maps
- `AFTER_SEARCH`: 3000ms - Après lancement recherche
- `BETWEEN_SCROLLS`: 2000ms - Entre chaque scroll
- `BETWEEN_CITIES`: 2500ms - Entre chaque ville (randomisé 2000-3000ms)
- `TIMEOUT`: 30000ms - Timeout max par page

**Rate Limiting :**
- 2-3 secondes entre chaque ville (RANDOMISÉ pour éviter pattern bot)
- 2 secondes entre chaque scroll
- Randomisation : +/- 500ms sur tous les délais

**Techniques Anti-Détection :**
- ✅ Playwright Stealth mode activé (masque les signaux bot)
- ✅ User-Agent réaliste : Chrome/Mac OS X
- ✅ Mode headless (plus rapide, moins détectable)
- ✅ Délais randomisés (éviter patterns fixes)
- ✅ Pas de connexion compte Google
- ✅ Viewport réaliste : 1920x1080

**Limites Quotidiennes Recommandées :**
- Maximum 20-30 villes par jour (safe)
- Maximum 100 prospects par ville
- Éviter de scraper la même ville plusieurs fois par jour

### Logique du Scraping

**Fonctionnalités :**
- Zone de texte : "Type d'entreprise" (ex: "plombier", "électricien")
- Zone de texte : "Villes" (ex: "Paris, Lyon, Marseille")
- Bouton "Lancer le scraping"
- Affichage temps réel des prospects trouvés
- Afficher une barre de chargement
- Compteur par ville (max 100)

**Critères de sélection (Motif Sélection) :**
1. ❌ **Pas de site web** → "Pas de site"
2. ❌ **Site sur annuaire** (PagesJaunes, Yelp, etc.) → "Site annuaire"
3. ❌ **Site réseaux sociaux uniquement** (Facebook, Instagram) → "Réseaux sociaux uniquement"
4. ❌ **Site plateforme** (Travaux.com, HomeAdvisor, etc.) → "Site plateforme"
5. ❌ **Site non mobile-friendly** → "Non responsive"
6. ❌ **Site obsolète** (avant 2018) → "Site obsolète"

**Sites à rejeter (ne PAS scraper) :**
- Sites normaux et récents (après 2018)
- Sites responsive et bien conçus
- Sites e-commerce professionnels

## 🎯 PAGE LEADS

**Colonnes du tableau :**
| Colonne | Type | Description |
|---------|------|-------------|
| Nom | Texte | Nom de l'entreprise |
| Téléphone | Texte | Format: 0612345678 |
| Site Web | Texte | URL complète ou "Aucun" |
| Adresse | Texte | Adresse complète |
| Ville | Texte | Ville (utilisée pour filtre) |
| Motif Sélection | Texte | Pourquoi on l'a sélectionné |
| Statut | Select | État du lead (voir ci-dessous) |
| Note | Texte long | Notes libres |

**Statuts possibles (dans cet ordre) :**
1. 🔍 A contacter
2. 📅 RDV maquette
3. 📄 Envoie Devis
4. ⏳ Attente d'acompte
5. 💰 Acompte payé
6. 🎨 RDV de mis projet
7. 🎓 RDV de fin de projet + Formation
8. ✅ Finis
9. 🛑 Perdu

**Fonctionnalités :**
- Tableau avec tri et filtres (par ville, statut, motif)
- Bouton "Importer Excel" → Upload fichier .xlsx
- Bouton "Exporter Excel" → Télécharge tous les leads
- Clic sur ligne → Ouvre détail du lead
- Modification inline du statut
- Détection automatique des doublons lors de l'import

## 🗃️ BASE DE DONNÉES

**Table : leads**
```prismamodel Lead {
id              String   @id @default(uuid())
nom             String
telephone       String?  @unique
email           String?  @unique
siteWeb         String?  @unique
adresse         String?
ville           String
codePostal      String?
metier          String   // Ex: "plombier"
motifSelection  String   // Ex: "Pas de site", "Site obsolète"
statut          String   @default("A contacter")
note            String?  @db.Text
noteGoogle      Float?   // Note Google (1-5)
nombreAvis      Int?     // Nombre d'avis Google
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt@@index([ville])
@@index([statut])
@@index([metier])
}

## 🔍 LOGIQUE DE SCRAPING

**Étapes du scraping :**
1. Parse les villes (split par virgule)
2. Pour chaque ville :
   - Recherche Google Maps : "{métier} {ville}"
   - Scroll pour charger résultats
   - **Limite : 100 prospects max par ville**
   - Extraire : nom, téléphone, site, adresse, note, avis
3. **Validation du site web :**
   - Si pas de site → ✅ Ajouter (motif: "Pas de site")
   - Si site annuaire (pagesjaunes.fr, yelp.fr) → ✅ Ajouter (motif: "Site annuaire")
   - Si réseaux sociaux uniquement (facebook.com, instagram.com) → ✅ Ajouter (motif: "Réseaux sociaux uniquement")
   - Si site plateforme (travaux.com, homeadvisor.fr) → ✅ Ajouter (motif: "Site plateforme")
   - Si site existe et valide → Vérifier responsive + date
     - Non responsive → ✅ Ajouter (motif: "Non responsive")
     - Date < 2018 → ✅ Ajouter (motif: "Site obsolète")
     - Sinon → ❌ Rejeter (bon site)
4. **Vérification doublons en temps réel** (avant ajout en BDD)
   - Check téléphone, email, siteWeb dans la BDD
   - Si existe déjà → Skip
5. Insertion en BDD

**Playwright config :**
- Mode headless par défaut
- Timeout : 30 secondes/page
- Rate limiting : 2 secondes entre requêtes
- User-agent : navigateur classique

## 📥 IMPORT EXCEL

**Format attendu (fichier comme prospects_plombier_*.xlsx) :**
| Nom | Téléphone | Site Web | Adresse | Ville | Motif Sélection | Statut | Note |
|-----|-----------|----------|---------|-------|-----------------|--------|------|
| ... | ... | ... | ... | ... | ... | ... | ... |

**Logique d'import :**
1. Upload fichier .xlsx
2. Parse avec bibliothèque `xlsx`
3. Pour chaque ligne :
   - Nettoyer les données (téléphone sans espaces, etc.)
   - **Vérifier doublons** (téléphone, email, siteWeb)
   - Si doublon → Skip avec log
   - Si nouveau → Insérer en BDD
4. Retourner résumé : "X leads importés, Y doublons ignorés"

## 📤 EXPORT EXCEL

**Fonctionnalité :**
- Bouton "Exporter vers Excel"
- Génère fichier : `leads_export_{date}.xlsx`
- Contient toutes les colonnes du tableau
- Format identique aux imports (réutilisable)

## 🎯 CONVENTIONS DE CODE
- TypeScript strict mode activé
- Async/await pour toutes les opérations asynchrones
- Nommage : 
  - camelCase pour variables et fonctions
  - PascalCase pour composants React et types
  - kebab-case pour fichiers
- Toujours utiliser try/catch pour les opérations Playwright et Prisma
- Gestion d'erreur : retourner des objets `{ success: boolean, data?: T, error?: string }`
- Commentaires en français dans le code

## ⚡ COMMANDES IMPORTANTES
```bashnpm run dev              # Serveur dev (http://localhost:3000)
npm run build            # Build production
npx prisma migrate dev   # Créer une migration
npx prisma studio        # Interface visuelle BDD
npx prisma generate      # Régénérer le client Prisma

## ✅ WORKFLOW DE DÉVELOPPEMENT
1. Claude propose un plan d'action détaillé
2. Amaury valide ou demande des ajustements
3. Claude implémente étape par étape avec explications
4. Tests manuels par Amaury
5. Commit avec message descriptif en français

## 📊 QUALITÉ DU CODE
- Toujours vérifier les types TypeScript (pas de `any`)
- Tester les edge cases (pas de téléphone, pas de site, erreurs réseau)
- Gérer les erreurs proprement avec messages clairs en français
- Logs détaillés pour debugging
- Interface utilisateur intuitive et responsive

## 🚀 DÉPLOIEMENT (plus tard)
- Vercel pour le frontend + API Routes
- Supabase pour PostgreSQL (free tier : 500MB)
- Variables d'environnement via `.env.local` (JAMAIS commit le .env)

## 💡 NOTES IMPORTANTES
- Le projet remplace un workflow Excel manuel
- Objectif : centraliser prospects + éviter doublons
- Amaury gère le commercial, partenaire gère le technique
- Privilégier la simplicité et la clarté du code
- Interface doit être rapide et intuitive pour usage quotidien
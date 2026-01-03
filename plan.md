# Plan de Développement CRM B2Dev - Version Suckless

## Philosophie : Une Brique = Une Fonction Testable

Chaque étape doit être :
- ✅ **Testable indépendamment** (via script Node ou interface test)
- ✅ **Documentée** avec input/output attendus
- ✅ **Validée** avant de passer à la suivante

---

## ✅ PHASE 1-2 : TERMINÉES (15 Décembre 2024)

### Brique 1.1 : Setup projet ✅
- Next.js + TypeScript + Tailwind installés
- Structure de base créée

### Brique 1.2 : Base de données ✅
- Prisma + Supabase configurés
- Schéma `Lead` créé avec contraintes UNIQUE
- Migration appliquée

### Brique 2.1 : Validation annuaires ✅
**Fonction** : `isDirectoryOrSocialMedia(url: string): boolean`
**Test** : URLs Pages Jaunes, Facebook → true | Sites perso → false

### Brique 2.2 : Validation responsive ✅
**Fonction** : `isMobileFriendly(page: Page): boolean`
**Test** : Site moderne → true | Site ancien → false

### Brique 2.3 : Validation date site ✅
**Fonction** : `isSiteTooOld(page: Page): boolean`
**Test** : Site 2015 → true | Site 2020 → false

---

## 🎯 PHASE 3 : SCRAPING GOOGLE MAPS (Actuelle)

### Brique 3.1 : Lancer Playwright avec navigateur visible ✅
**Objectif** : Ouvrir Chrome avec Playwright en mode "headed"
**Fichier** : `lib/scraper/browser.ts`
**Fonction** : `launchBrowser(): Promise<Browser>`
**Test manuel** :
```bash
npx tsx test-browser.js
# → Chrome s'ouvre et reste ouvert 5 secondes
```
**Critère de succès** : Fenêtre Chrome visible qui se ferme proprement ✅

---

### Brique 3.2 : Navigation Google Maps basique ✅
**Objectif** : Ouvrir Google Maps et afficher la page
**Fichier** : `lib/scraper/navigation.ts`
**Fonction** : `openGoogleMaps(page: Page): Promise<void>`
**Test manuel** :
```bash
npx tsx test-navigation.js
# → Google Maps s'affiche dans le navigateur
```
**Critère de succès** : URL = google.com/maps + page chargée ✅

---

### Brique 3.3 : Connexion Google manuelle ✅
**Objectif** : Pause pour connexion manuelle + sauvegarde cookies
**Fichier** : `lib/scraper/auth.ts`
**Fonction** : `loginToGoogle(page: Page): Promise<void>`
**Comportement** :
1. Si `cookies.json` existe → charger cookies
2. Sinon → pause 60s pour connexion manuelle → sauvegarder cookies
**Test manuel** :
```bash
npx tsx test-auth-simple.js
# → Attend connexion manuelle, sauvegarde cookies, se reconnecte avec cookies
```
**Critère de succès** : Cookies sauvegardés + reconnexion auto fonctionne ✅

---

### Brique 3.4 : Recherche dans Google Maps ✅
**Objectif** : Effectuer recherche "métier ville" (ex: "plombier Paris")
**Fichier** : `lib/scraper/search.ts`
**Fonction** : `searchGoogleMaps(page: Page, metier: string, ville: string): Promise<void>`
**Test manuel** :
```bash
npx tsx test-search.js
# Input: metier="plombier", ville="Paris"
# → Liste de résultats s'affiche dans Google Maps
```
**Critère de succès** : Panneau latéral avec résultats visible ✅

---

### Brique 3.5 : Extraire 1 résultat basique ✅
**Objectif** : Extraire nom + téléphone d'UN seul résultat
**Fichier** : `lib/scraper/extract.ts`
**Fonction** : `extractSingleResult(page: Page, index: number): Promise<BasicInfo>`
**Output** :
```typescript
{
  nom: string | null,
  telephone: string | null
}
```
**Test manuel** :
```bash
npx tsx test-extract-one.js
# → Affiche { nom: "Plomberie Durand", telephone: "01 23 45 67 89" }
```
**Critère de succès** : Extraction réussie du 1er résultat ✅

---

### Brique 3.6 : Extraire adresse + ville ✅
**Objectif** : Ajouter extraction adresse complète + ville
**Fonction** : `extractAddress(page: Page): Promise<AddressInfo>`
**Output** :
```typescript
{
  adresse: string | null,
  ville: string | null,
  codePostal: string | null
}
```
**Test manuel** :
```bash
npx tsx test-extract-address.js
# → { adresse: "12 rue de la Paix", ville: "Paris", codePostal: "75002" }
```
**Critère de succès** : Parsing correct de l'adresse Google Maps ✅

---

### Brique 3.7 : Extraire site web ✅
**Objectif** : Cliquer et extraire URL du site web
**Fonction** : `extractWebsite(page: Page): Promise<string | null>`
**Test manuel** :
```bash
npx tsx test-extract-website.js
# → "https://plomberie-durand.fr" ou null
```
**Critère de succès** : URL valide ou null si pas de site ✅

---

### Brique 3.8 : Extraire note + avis ✅
**Objectif** : Récupérer note Google (4.5) + nombre d'avis (127)
**Fonction** : `extractRating(page: Page): Promise<RatingInfo>`
**Output** :
```typescript
{
  note: number | null,
  nombreAvis: number | null
}
```
**Test manuel** :
```bash
npx tsx test-extract-rating.js
# → { note: 4.5, nombreAvis: 127 }
```
**Critère de succès** : Parsing correct de la notation ✅

---

### Brique 3.9 : Fonction extraction complète 1 résultat ✅
**Objectif** : Combiner toutes les extractions en 1 fonction
**Fonction** : `extractFullResult(page: Page, index: number): Promise<LeadData>`
**Output** :
```typescript
{
  nom: string,
  telephone: string | null,
  siteWeb: string | null,
  adresse: string | null,
  ville: string,
  codePostal: string | null,
  note: number | null,
  nombreAvis: number | null
}
```
**Test manuel** :
```bash
npx tsx test-extract-full.js
# → Objet complet avec toutes les données
```
**Critère de succès** : 1 objet Lead complet extrait ✅

---

### Brique 3.10 : Boucle sur 100 résultats ✅
**Objectif** : Extraire données brutes de 100 résultats
**Fonction** : `scrapeAllResults(page: Page, limit: number): Promise<LeadData[]>`
**Test manuel** :
```bash
npx tsx test-scrape-100.js
# → Tableau de 100 objets LeadData
# → Logs progression : "1/100... 2/100... 3/100..."
```
**Critère de succès** : 100 résultats extraits ✅

---

### Brique 3.11 : Vérification doublon BDD ✅
**Objectif** : Vérifier si lead existe déjà en BDD (par téléphone)
**Fichier** : `lib/database/check-duplicate.ts`
**Fonction** : `isDuplicate(telephone: string): Promise<boolean>`
**Test manuel** :
```bash
npx tsx test-duplicate.js
# Input: "0123456789"
# → true (si existe) ou false
```
**Critère de succès** : Requête Prisma fonctionne ✅

---

### Brique 3.12 : Intégration validation site ✅
**Objectif** : Utiliser fonctions Phase 2 pour valider sites
**Fonction** : `validateWebsite(url: string): Promise<ValidationResult>`
**Output** :
```typescript
{
  isValid: boolean, // false = à garder (site obsolète/inexistant)
  motif: string | null // "pas de site" | "annuaire" | "site obsolète" | "non responsive"
}
```
**Test manuel** :
```bash
npx tsx test-validate.js
# Input: "https://plomberie-ancien.fr"
# → { isValid: false, motif: "site obsolète" }
```
**Critère de succès** : Validation retourne bon motif ✅

---

### Brique 3.13 : Scraping avec filtrage temps réel ✅
**Objectif** : Ne garder QUE les leads avec sites invalides
**Fonction** : `scrapeWithValidation(metier: string, ville: string): Promise<ValidLead[]>`
**Comportement** :
1. Boucle sur 100 résultats
2. Pour chaque résultat :
   - Vérifier doublon → skip si existe
   - Valider site → skip si site OK
   - Garder si site invalide
3. Retourner seulement leads valides

**Test manuel** :
```bash
npx tsx test-scrape-filtered.js
# Input: metier="plombier", ville="Paris"
# → [15 leads avec sites invalides sur 100 scannés]
```
**Critère de succès** : Seuls leads avec sites invalides retournés ✅

---

### Brique 3.14 : Sauvegarde en BDD ✅
**Objectif** : Insérer leads validés dans Supabase
**Fichier** : `lib/database/save-leads.ts`
**Fonction** : `saveLeads(leads: ValidLead[]): Promise<SaveResult>`
**Output** :
```typescript
{
  saved: number,
  errors: number
}
```
**Test manuel** :
```bash
npx tsx test-save-leads.js
# → { saved: 15, errors: 0 }
```
**Critère de succès** : Leads visibles dans Supabase ✅

---

### Brique 3.15 : Gestion erreurs + timeout ✅
**Objectif** : Wrapper avec try/catch + timeout 60s par résultat
**Fonction** : `scrapeWithErrorHandling(metier: string, ville: string): Promise<ScrapingReport>`
**Output** :
```typescript
{
  success: boolean,
  scanned: number,
  validated: number,
  saved: number,
  errors: string[]
}
```
**Test manuel** :
```bash
npx tsx test-complete-scraping.js
# → Scraping complet de A à Z avec gestion d'erreurs
```
**Critère de succès** : Erreurs catchées, scraping continue ✅

---

## 🚀 PHASE 4 : API ROUTES (À venir)

### Brique 4.1 : POST /api/scrape
**Objectif** : Endpoint pour lancer scraping via API
**Input** : `{ metier: string, ville: string }`
**Output** : `{ success: boolean, report: ScrapingReport }`
**Test** : Postman/Insomnia

### Brique 4.2 : GET /api/leads
**Objectif** : Liste paginée avec filtres
**Query params** : `?ville=Paris&statut=À_CONTACTER&page=1`
**Test** : cURL + vérif JSON retourné

### Brique 4.3 : PUT /api/leads/[id]
**Objectif** : Modifier statut d'un lead
**Test** : Modifier statut → vérif BDD

### Brique 4.4 : DELETE /api/leads/[id]
**Objectif** : Supprimer lead
**Test** : Suppression → vérif BDD

### Brique 4.5 : POST /api/leads/import
**Objectif** : Import Excel avec détection doublons
**Test** : Upload fichier test.xlsx → rapport import

### Brique 4.6 : GET /api/export
**Objectif** : Export Excel complet
**Test** : Télécharger fichier → ouvrir dans Excel

---

## 🔐 PHASE 5 : AUTHENTIFICATION ✅

### Brique 5.1 : Installation Next-Auth ✅
**Test** : `npm run dev` sans erreurs

### Brique 5.2 : Page /login basique ✅
**Test** : Afficher bouton "Se connecter avec Google"

### Brique 5.3 : OAuth Google fonctionnel ✅
**Test** : Connexion réussie → redirection dashboard

### Brique 5.4 : Whitelist emails ✅
**Test** : Email autorisé → OK | Email non autorisé → refusé

### Brique 5.5 : Middleware protection routes ✅
**Test** : Accès /leads sans login → redirect /login

---

## 🎨 PHASE 6-7 : INTERFACE (À venir)

### Brique 6.1 : Layout navigation
**Test** : Afficher nav Scraping/Leads

### Brique 6.2 : Page scraping formulaire
**Test** : Inputs métier + ville + bouton

### Brique 6.3 : Affichage temps réel
**Test** : Logs apparaissent pendant scraping

### Brique 7.1 : Tableau leads basique
**Test** : Afficher 10 premiers leads

### Brique 7.2 : Filtres fonctionnels
**Test** : Filtre "Paris" → seulement leads Paris

### Brique 7.3 : Modification statut inline
**Test** : Changer statut → sauvegarde API

---

## 📊 PHASE 8 : EXCEL (À venir)

### Brique 8.1 : Parser Excel uploadé
**Test** : Upload test.xlsx → parse OK

### Brique 8.2 : Détection doublons import
**Test** : Import avec doublons → rapport correct

### Brique 8.3 : Export Excel
**Test** : Télécharger → ouvrir dans Excel

---

## ✅ Décisions Techniques

### 2024-12-17 : Approche Suckless
- **Micro-étapes** : 1 fonction = 1 test
- **Tests manuels** : Scripts Node pour chaque brique
- **Validation** : Ne pas passer à l'étape suivante sans validation
- **Documentation** : Input/Output attendus pour chaque fonction

### 2024-12-13 : Stack Initial
- Next.js 14 + TypeScript + Tailwind
- Prisma + Supabase (PostgreSQL)
- Playwright (scraping)
- xlsx (Excel)

---

## 📝 Template Test Manuel

Pour chaque brique, créer un fichier `test-xxx.js` :

```javascript
// test-extract-one.js
import { launchBrowser } from './lib/scraper/browser.js';
import { openGoogleMaps } from './lib/scraper/navigation.js';
import { searchGoogleMaps } from './lib/scraper/search.js';
import { extractSingleResult } from './lib/scraper/extract.js';

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await openGoogleMaps(page);
  await searchGoogleMaps(page, 'plombier', 'Paris');
  
  const result = await extractSingleResult(page, 0);
  console.log('✅ Résultat extrait :', result);
  
  await browser.close();
})();
```

---

## 🎯 PROCHAINE ÉTAPE : Brique 3.1

**Objectif** : Lancer Playwright avec navigateur visible
**Commande** : On code `lib/scraper/browser.ts` ensemble ?
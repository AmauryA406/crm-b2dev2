import { chromium, type Browser, type Page } from 'playwright';
import { performFullSiteValidation } from './site-validator';
import { PrismaClient } from '@prisma/client';

// Délais anti-détection selon CLAUDE.md
const DELAYS = {
  PAGE_LOAD: 3000,      // Après chargement Google Maps
  AFTER_SEARCH: 3000,   // Après lancement recherche
  BETWEEN_SCROLLS: 2000, // Entre chaque scroll
  BETWEEN_CITIES: 2500,  // Entre chaque ville (randomisé 2000-3000ms)
  TIMEOUT: 30000        // Timeout max par page
};

export interface ProspectData {
  nom: string;
  telephone?: string;
  siteWeb?: string;
  adresse?: string;
  ville: string;
  metier: string;
  motifSelection: string;
  noteGoogle?: number;
  nombreAvis?: number;
}

export interface ScrapingResult {
  success: boolean;
  data: ProspectData[];
  error?: string;
  totalFound: number;
  totalValid: number;
}

export class GoogleMapsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Délai randomisé pour éviter la détection de bot
  private randomDelay(baseDelay: number, variation: number = 500): number {
    return baseDelay + Math.random() * variation - variation / 2;
  }

  private async waitWithRandomDelay(baseDelay: number, variation: number = 500) {
    const delay = this.randomDelay(baseDelay, variation);
    await this.page?.waitForTimeout(delay);
  }

  // Vérification doublons en temps réel
  private async checkDuplicate(prospect: ProspectData): Promise<boolean> {
    try {
      const existing = await this.prisma.lead.findFirst({
        where: {
          OR: [
            { telephone: prospect.telephone && prospect.telephone !== '' ? prospect.telephone : undefined },
            { email: prospect.siteWeb && prospect.siteWeb.includes('@') ? prospect.siteWeb : undefined },
            { siteWeb: prospect.siteWeb && !prospect.siteWeb.includes('@') ? prospect.siteWeb : undefined }
          ]
        }
      });

      return existing !== null;
    } catch (error) {
      console.error('Erreur vérification doublon:', error);
      return false; // En cas d'erreur, on ne bloque pas l'ajout
    }
  }

  async init() {
    try {
      // Configuration Playwright avec mode Stealth
      this.browser = await chromium.launch({
        headless: true, // Mode headless (plus rapide, moins détectable)
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920,1080' // Viewport réaliste
        ]
      });

      this.page = await this.browser.newPage();

      // Configuration anti-détection
      await this.page.setViewportSize({ width: 1920, height: 1080 });

      // User-Agent réaliste Chrome/Mac OS X
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Masquer les signaux de Playwright
      await this.page.addInitScript(() => {
        // @ts-ignore
        delete window.webdriver;
        // @ts-ignore
        delete window.chrome?.runtime?.onConnect;
        // @ts-ignore
        Object.defineProperty(navigator, 'webdriver', { value: false });
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erreur d'initialisation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async close() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Erreur lors de la fermeture:', error);
    }
  }

  async scrapeGoogleMaps(
    metier: string,
    villes: string[],
    maxPerVille: number = 100
  ): Promise<ScrapingResult> {
    if (!this.page) {
      return {
        success: false,
        error: 'Scraper non initialisé',
        data: [],
        totalFound: 0,
        totalValid: 0
      };
    }

    const allProspects: ProspectData[] = [];
    let totalFound = 0;

    try {
      for (let i = 0; i < villes.length; i++) {
        const ville = villes[i];
        console.log(`Scraping ${metier} à ${ville} (${i + 1}/${villes.length})...`);

        try {
          const villeProspects = await this.scrapeVille(metier, ville.trim(), maxPerVille);
          allProspects.push(...villeProspects);
          totalFound += villeProspects.length;
          console.log(`✅ ${ville}: ${villeProspects.length} prospects trouvés`);
        } catch (error) {
          console.error(`❌ Erreur scraping ville ${ville}:`, error);
          // On continue avec la ville suivante
          continue;
        }

        // Rate limiting randomisé entre villes (2000-3000ms) sauf pour la dernière ville
        if (i < villes.length - 1) {
          await this.waitWithRandomDelay(DELAYS.BETWEEN_CITIES, 500);
        }
      }

      return {
        success: true,
        data: allProspects,
        totalFound,
        totalValid: allProspects.length
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de scraping: ${error instanceof Error ? error.message : String(error)}`,
        data: allProspects,
        totalFound,
        totalValid: allProspects.length
      };
    }
  }

  private async scrapeVille(metier: string, ville: string, maxResults: number): Promise<ProspectData[]> {
    if (!this.page) return [];

    const prospects: ProspectData[] = [];

    try {
      // Recherche sur Google Maps
      const searchQuery = `${metier} ${ville}`;
      await this.page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, {
        waitUntil: 'domcontentloaded',
        timeout: DELAYS.TIMEOUT
      });

      // Délai après chargement de la page
      await this.waitWithRandomDelay(DELAYS.PAGE_LOAD);

      // Attendre que les résultats se chargent
      await this.page.waitForSelector('[role="main"]', { timeout: 10000 });

      // Délai après lancement de la recherche
      await this.waitWithRandomDelay(DELAYS.AFTER_SEARCH);

      // Scroll pour charger plus de résultats
      await this.scrollToLoadResults(maxResults);

      // Extraire les données des établissements
      const etablissements = await this.page.$$('[role="article"]');

      for (let i = 0; i < Math.min(etablissements.length, maxResults); i++) {
        try {
          const etablissement = etablissements[i];
          const prospectData = await this.extractProspectData(etablissement, metier, ville);

          if (prospectData) {
            // Vérifier les doublons en temps réel
            const isDuplicate = await this.checkDuplicate(prospectData);
            if (!isDuplicate) {
              prospects.push(prospectData);
              console.log(`✅ Prospect ajouté: ${prospectData.nom} - ${prospectData.motifSelection}`);
            } else {
              console.log(`⚠️ Doublon ignoré: ${prospectData.nom}`);
            }
          }

          // Rate limiting entre extractions
          await this.waitWithRandomDelay(500, 200);
        } catch (error) {
          console.error(`Erreur extraction établissement ${i}:`, error);
          continue;
        }
      }

    } catch (error) {
      console.error(`Erreur scraping ville ${ville}:`, error);
    }

    return prospects;
  }

  private async scrollToLoadResults(maxResults: number) {
    if (!this.page) return;

    try {
      const scrollContainer = await this.page.$('[role="main"]');
      if (!scrollContainer) return;

      for (let i = 0; i < 5; i++) {
        await scrollContainer.evaluate(el => {
          el.scrollTop = el.scrollHeight;
        });

        // Délai randomisé entre scrolls
        await this.waitWithRandomDelay(DELAYS.BETWEEN_SCROLLS);

        // Vérifier si on a assez de résultats
        const resultCount = await this.page.$$eval('[role="article"]', els => els.length);
        if (resultCount >= maxResults) break;
      }
    } catch (error) {
      console.error('Erreur lors du scroll:', error);
    }
  }

  private async extractProspectData(
    etablissement: any,
    metier: string,
    ville: string
  ): Promise<ProspectData | null> {
    try {
      // Extraire le nom
      const nomElement = await etablissement.$('[role="img"]');
      const nom = nomElement ? await nomElement.getAttribute('aria-label') : null;

      if (!nom) return null;

      // Cliquer pour ouvrir le panneau de détails avec gestion d'erreur
      try {
        await etablissement.click();
        await this.page?.waitForTimeout(2000);
      } catch (error) {
        console.error(`Erreur clic établissement ${nom}:`, error);
        return null;
      }

      // Extraire les informations détaillées
      const telephone = await this.extractTelephone();
      const siteWeb = await this.extractSiteWeb();
      const adresse = await this.extractAdresse();
      const { noteGoogle, nombreAvis } = await this.extractNotesAvis();

      // Validation complète du site web avec notre système de validation
      let motifSelection: string;

      if (!this.page) {
        motifSelection = "Pas de site";
      } else {
        try {
          const validation = await performFullSiteValidation(this.page, siteWeb || null);

          // Si le site est valide (moderne et responsive), on ne l'ajoute pas
          if (validation.isValid) {
            console.log(`❌ Site valide ignoré: ${nom} - ${siteWeb}`);
            return null;
          }

          motifSelection = validation.motif;
        } catch (error) {
          console.error(`Erreur validation site ${siteWeb}:`, error);
          // En cas d'erreur de validation, on utilise une validation basique
          if (!siteWeb) {
            motifSelection = "Pas de site";
          } else {
            motifSelection = "Erreur validation - À vérifier manuellement";
          }
        }
      }

      return {
        nom: nom.trim(),
        telephone: telephone ? this.formatTelephone(telephone) : undefined,
        siteWeb: siteWeb || undefined,
        adresse: adresse || undefined,
        ville: ville,
        metier: metier,
        motifSelection,
        noteGoogle,
        nombreAvis
      };
    } catch (error) {
      console.error('Erreur extraction données:', error);
      return null;
    }
  }

  private async extractTelephone(): Promise<string | null> {
    if (!this.page) return null;

    try {
      // Chercher le bouton téléphone ou le texte contenant un numéro
      const phoneSelectors = [
        'button[data-item-id="phone:tel:"]',
        '[data-item-id*="phone"]',
        'a[href^="tel:"]'
      ];

      for (const selector of phoneSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && this.isValidPhoneNumber(text)) {
            return text.trim();
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async extractSiteWeb(): Promise<string | null> {
    if (!this.page) return null;

    try {
      // Chercher le lien du site web
      const websiteSelectors = [
        'a[data-item-id="authority"]',
        'a[href*="http"]:not([href*="google"])',
        'button[data-item-id="authority"]'
      ];

      for (const selector of websiteSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const href = await element.getAttribute('href');
          if (href && href.startsWith('http')) {
            return href;
          }

          const text = await element.textContent();
          if (text && text.includes('www.')) {
            return text.trim();
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async extractAdresse(): Promise<string | null> {
    if (!this.page) return null;

    try {
      const addressSelectors = [
        'button[data-item-id="address"]',
        '[data-item-id*="address"]'
      ];

      for (const selector of addressSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async extractNotesAvis(): Promise<{ noteGoogle?: number; nombreAvis?: number }> {
    if (!this.page) return {};

    try {
      // Chercher les étoiles et avis
      const ratingElement = await this.page.$('[role="img"][aria-label*="étoiles"]');
      if (ratingElement) {
        const ariaLabel = await ratingElement.getAttribute('aria-label');
        if (ariaLabel) {
          const ratingMatch = ariaLabel.match(/(\d,?\d?)\s*étoiles/);
          const reviewMatch = ariaLabel.match(/(\d+)\s*avis/);

          return {
            noteGoogle: ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : undefined,
            nombreAvis: reviewMatch ? parseInt(reviewMatch[1]) : undefined
          };
        }
      }

      return {};
    } catch (error) {
      return {};
    }
  }


  private isValidPhoneNumber(text: string): boolean {
    // Regex simple pour détecter un numéro français
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    const cleanNumber = text.replace(/[\s\-\.]/g, '');
    return phoneRegex.test(cleanNumber);
  }

  private formatTelephone(phone: string): string {
    // Format: 0612345678 (sans espaces)
    return phone.replace(/[\s\-\.]/g, '');
  }
}

// Fonction utilitaire pour créer et utiliser le scraper
export async function scrapeProspects(
  metier: string,
  villes: string[],
  maxPerVille: number = 100
): Promise<ScrapingResult> {
  const scraper = new GoogleMapsScraper();

  try {
    const initResult = await scraper.init();
    if (!initResult.success) {
      return {
        success: false,
        error: initResult.error,
        data: [],
        totalFound: 0,
        totalValid: 0
      };
    }

    const result = await scraper.scrapeGoogleMaps(metier, villes, maxPerVille);
    return result;
  } finally {
    await scraper.close();
  }
}
import { Page } from 'playwright';

export type SiteType =
  | 'no-site'
  | 'directory'
  | 'social-only'
  | 'platform'
  | 'non-responsive'
  | 'outdated'
  | 'valid';

export interface SiteValidationResult {
  type: SiteType;
  motif: string;
  isValid: boolean;
  details?: {
    responsive?: boolean;
    lastModified?: string;
    detectedPlatforms?: string[];
  };
}

export const DIRECTORY_DOMAINS = [
  'pagesjaunes.fr',
  'yelp.fr',
  'yelp.com',
  'google.com',
  'maps.google.com',
  'foursquare.com',
  'tripadvisor.fr',
  'tripadvisor.com',
  '118712.fr',
  '118000.fr',
  'justacoté.com',
  'justacote.com'
];

export const SOCIAL_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com'
];

export const PLATFORM_DOMAINS = [
  'travaux.com',
  'homeadvisor.fr',
  'homeadvisor.com',
  'helpy.fr',
  'starofservice.com',
  'quotatis.fr',
  'mondevis.com',
  'devis.fr',
  'prendsmaplace.fr'
];

export async function validateSiteUrl(url: string | null): Promise<SiteValidationResult> {
  if (!url || url.trim() === '' || url.toLowerCase().trim() === 'aucun') {
    return {
      type: 'no-site',
      motif: 'Pas de site',
      isValid: false
    };
  }

  try {
    const cleanUrl = url.trim();
    const urlToCheck = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const urlObject = new URL(urlToCheck);
    const domain = urlObject.hostname.toLowerCase().replace('www.', '');

    // Vérifier les domaines de manière plus précise (correspondance exacte ou comme sous-domaine)
    const checkDomain = (domainList: string[]) => {
      return domainList.some(d => domain === d || domain.endsWith(`.${d}`));
    };

    if (checkDomain(DIRECTORY_DOMAINS)) {
      return {
        type: 'directory',
        motif: 'Site annuaire',
        isValid: false,
        details: { detectedPlatforms: [domain] }
      };
    }

    if (checkDomain(PLATFORM_DOMAINS)) {
      return {
        type: 'platform',
        motif: 'Site plateforme',
        isValid: false,
        details: { detectedPlatforms: [domain] }
      };
    }

    if (checkDomain(SOCIAL_DOMAINS)) {
      return {
        type: 'social-only',
        motif: 'Réseaux sociaux uniquement',
        isValid: false,
        details: { detectedPlatforms: [domain] }
      };
    }

    // Vérifier que c'est un domaine valide (avec au moins un point)
    if (!domain.includes('.')) {
      return {
        type: 'no-site',
        motif: 'URL invalide',
        isValid: false
      };
    }

    return {
      type: 'valid',
      motif: 'Site valide - nécessite validation approfondie',
      isValid: true
    };

  } catch (error) {
    return {
      type: 'no-site',
      motif: 'URL invalide',
      isValid: false
    };
  }
}

export async function checkSiteResponsiveness(page: Page, url: string): Promise<boolean> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const viewportMeta = await page.$('meta[name="viewport"]');
    if (!viewportMeta) {
      return false;
    }

    const viewportContent = await viewportMeta.getAttribute('content');
    if (!viewportContent || !viewportContent.includes('width=device-width')) {
      return false;
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const hasResponsiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let responsiveCount = 0;

      for (let i = 0; i < Math.min(50, elements.length); i++) {
        const styles = window.getComputedStyle(elements[i]);
        if (styles.display === 'flex' ||
            styles.display === 'grid' ||
            styles.maxWidth === '100%' ||
            styles.width?.includes('%')) {
          responsiveCount++;
        }
      }

      return responsiveCount > 5;
    });

    return !hasHorizontalScroll && hasResponsiveElements;

  } catch (error) {
    console.error('Erreur lors de la vérification responsive:', error);
    return false;
  }
}

export async function detectSiteAge(page: Page, url: string): Promise<{ isOutdated: boolean; lastModified?: string }> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const lastModified = await page.evaluate(() => {
      const metaDate = document.querySelector('meta[name="last-modified"], meta[property="article:modified_time"]');
      if (metaDate) {
        return metaDate.getAttribute('content');
      }

      const dateElements = document.querySelectorAll('[datetime], .date, .last-updated, .modified');
      for (const el of dateElements) {
        const dateText = el.textContent || el.getAttribute('datetime') || el.getAttribute('content');
        if (dateText && /20\d{2}/.test(dateText)) {
          return dateText;
        }
      }

      const copyright = document.querySelector('*[text*="©"], *[text*="copyright"]');
      if (copyright) {
        const text = copyright.textContent || '';
        const yearMatch = text.match(/20\d{2}/);
        if (yearMatch) {
          return yearMatch[0];
        }
      }

      return null;
    });

    const designIndicators = await page.evaluate(() => {
      const indicators = {
        hasFlash: document.querySelector('embed[type*="flash"], object[type*="flash"]') !== null,
        hasOldFonts: false,
        hasOldLayout: false,
        hasModernFrameworks: false
      };

      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const href = sheet.href;
          if (href && (href.includes('bootstrap') || href.includes('tailwind') || href.includes('material'))) {
            indicators.hasModernFrameworks = true;
            break;
          }
        } catch (e) {}
      }

      const bodyStyle = window.getComputedStyle(document.body);
      const fontFamily = bodyStyle.fontFamily.toLowerCase();
      if (fontFamily.includes('comic sans') || fontFamily.includes('papyrus')) {
        indicators.hasOldFonts = true;
      }

      const tables = document.querySelectorAll('table[width], table[cellpadding]');
      if (tables.length > 2) {
        indicators.hasOldLayout = true;
      }

      return indicators;
    });

    let isOutdated = false;

    if (lastModified) {
      const dateMatch = lastModified.match(/20(\d{2})/);
      if (dateMatch) {
        const year = parseInt(`20${dateMatch[1]}`);
        if (year < 2018) {
          isOutdated = true;
        }
      }
    }

    if (designIndicators.hasFlash ||
        designIndicators.hasOldFonts ||
        (designIndicators.hasOldLayout && !designIndicators.hasModernFrameworks)) {
      isOutdated = true;
    }

    return {
      isOutdated,
      lastModified: lastModified || undefined
    };

  } catch (error) {
    console.error('Erreur lors de la détection de l\'âge du site:', error);
    return { isOutdated: false };
  }
}

export async function performFullSiteValidation(
  page: Page,
  url: string | null
): Promise<SiteValidationResult> {
  const urlValidation = await validateSiteUrl(url);

  if (!urlValidation.isValid || !url) {
    return urlValidation;
  }

  try {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

    const [responsive, ageInfo] = await Promise.all([
      checkSiteResponsiveness(page, cleanUrl),
      detectSiteAge(page, cleanUrl)
    ]);

    if (!responsive) {
      return {
        type: 'non-responsive',
        motif: 'Non responsive',
        isValid: false,
        details: {
          responsive: false,
          lastModified: ageInfo.lastModified
        }
      };
    }

    if (ageInfo.isOutdated) {
      return {
        type: 'outdated',
        motif: 'Site obsolète',
        isValid: false,
        details: {
          responsive: true,
          lastModified: ageInfo.lastModified
        }
      };
    }

    return {
      type: 'valid',
      motif: 'Site valide et moderne',
      isValid: true,
      details: {
        responsive: true,
        lastModified: ageInfo.lastModified
      }
    };

  } catch (error) {
    console.error('Erreur lors de la validation complète du site:', error);
    return {
      type: 'no-site',
      motif: 'Erreur de validation',
      isValid: false
    };
  }
}
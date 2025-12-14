import {
  validateSiteUrl,
  DIRECTORY_DOMAINS,
  SOCIAL_DOMAINS,
  PLATFORM_DOMAINS,
  SiteValidationResult,
} from '../lib/site-validator';

describe('site-validator', () => {
  describe('validateSiteUrl', () => {
    test('devrait retourner "no-site" pour URL null ou vide', async () => {
      const result1 = await validateSiteUrl(null);
      expect(result1.type).toBe('no-site');
      expect(result1.motif).toBe('Pas de site');
      expect(result1.isValid).toBe(false);

      const result2 = await validateSiteUrl('');
      expect(result2.type).toBe('no-site');
      expect(result2.motif).toBe('Pas de site');
      expect(result2.isValid).toBe(false);

      const result3 = await validateSiteUrl('aucun');
      expect(result3.type).toBe('no-site');
      expect(result3.motif).toBe('Pas de site');
      expect(result3.isValid).toBe(false);
    });

    test('devrait détecter les sites annuaires', async () => {
      const testUrls = [
        'https://www.pagesjaunes.fr/pros/entreprise',
        'yelp.fr/biz/mon-entreprise',
        'maps.google.com/place/entreprise',
        'www.118712.fr/professionnel'
      ];

      for (const url of testUrls) {
        const result = await validateSiteUrl(url);
        expect(result.type).toBe('directory');
        expect(result.motif).toBe('Site annuaire');
        expect(result.isValid).toBe(false);
        expect(result.details?.detectedPlatforms).toBeDefined();
      }
    });

    test('devrait détecter les réseaux sociaux', async () => {
      const testUrls = [
        'https://facebook.com/mon-entreprise',
        'instagram.com/mon_entreprise',
        'www.linkedin.com/company/entreprise',
        'twitter.com/entreprise',
        'x.com/entreprise'
      ];

      for (const url of testUrls) {
        const result = await validateSiteUrl(url);
        expect(result.type).toBe('social-only');
        expect(result.motif).toBe('Réseaux sociaux uniquement');
        expect(result.isValid).toBe(false);
        expect(result.details?.detectedPlatforms).toBeDefined();
      }
    });

    test('devrait détecter les plateformes de services', async () => {
      const testUrls = [
        'https://travaux.com/professionnel/entreprise',
        'www.homeadvisor.fr/pro/entreprise',
        'starofservice.com/prestataire/entreprise',
        'quotatis.fr/professionnel'
      ];

      for (const url of testUrls) {
        const result = await validateSiteUrl(url);
        expect(result.type).toBe('platform');
        expect(result.motif).toBe('Site plateforme');
        expect(result.isValid).toBe(false);
        expect(result.details?.detectedPlatforms).toBeDefined();
      }
    });

    test('devrait retourner "valid" pour sites normaux', async () => {
      const testUrls = [
        'https://mon-entreprise.fr',
        'www.plomberie-martin.com',
        'electricien-paris.net',
        'menuiserie-dupont.fr'
      ];

      for (const url of testUrls) {
        const result = await validateSiteUrl(url);
        expect(result.type).toBe('valid');
        expect(result.motif).toBe('Site valide - nécessite validation approfondie');
        expect(result.isValid).toBe(true);
      }
    });

    test('devrait gérer les URLs sans protocole', async () => {
      const result = await validateSiteUrl('mon-entreprise.fr');
      expect(result.type).toBe('valid');
      expect(result.isValid).toBe(true);
    });

    test('devrait retourner "no-site" pour URL invalide', async () => {
      const result = await validateSiteUrl('not-a-valid-url');
      expect(result.type).toBe('no-site');
      expect(result.motif).toBe('URL invalide');
      expect(result.isValid).toBe(false);
    });

    test('devrait ignorer www. dans la détection de domaine', async () => {
      const result1 = await validateSiteUrl('www.pagesjaunes.fr/entreprise');
      const result2 = await validateSiteUrl('pagesjaunes.fr/entreprise');

      expect(result1.type).toBe('directory');
      expect(result2.type).toBe('directory');
    });

    test('devrait être insensible à la casse', async () => {
      const result = await validateSiteUrl('FACEBOOK.COM/entreprise');
      expect(result.type).toBe('social-only');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Constantes de domaines', () => {
    test('DIRECTORY_DOMAINS devrait contenir les principaux annuaires', () => {
      expect(DIRECTORY_DOMAINS).toContain('pagesjaunes.fr');
      expect(DIRECTORY_DOMAINS).toContain('yelp.fr');
      expect(DIRECTORY_DOMAINS).toContain('google.com');
      expect(DIRECTORY_DOMAINS).toContain('tripadvisor.fr');
    });

    test('SOCIAL_DOMAINS devrait contenir les principaux réseaux sociaux', () => {
      expect(SOCIAL_DOMAINS).toContain('facebook.com');
      expect(SOCIAL_DOMAINS).toContain('instagram.com');
      expect(SOCIAL_DOMAINS).toContain('linkedin.com');
      expect(SOCIAL_DOMAINS).toContain('twitter.com');
      expect(SOCIAL_DOMAINS).toContain('x.com');
    });

    test('PLATFORM_DOMAINS devrait contenir les plateformes de services', () => {
      expect(PLATFORM_DOMAINS).toContain('travaux.com');
      expect(PLATFORM_DOMAINS).toContain('homeadvisor.fr');
      expect(PLATFORM_DOMAINS).toContain('starofservice.com');
      expect(PLATFORM_DOMAINS).toContain('quotatis.fr');
    });
  });

  describe('Types et interfaces', () => {
    test('SiteValidationResult devrait avoir la structure correcte', async () => {
      const result = await validateSiteUrl('https://example.com');

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('motif');
      expect(result).toHaveProperty('isValid');
      expect(typeof result.type).toBe('string');
      expect(typeof result.motif).toBe('string');
      expect(typeof result.isValid).toBe('boolean');
    });

    test('Les détails devraient être présents pour certains types', async () => {
      const result = await validateSiteUrl('facebook.com/test');

      expect(result.details).toBeDefined();
      expect(result.details?.detectedPlatforms).toBeDefined();
      expect(Array.isArray(result.details?.detectedPlatforms)).toBe(true);
    });
  });

  describe('Cas limites', () => {
    test('devrait gérer les sous-domaines', async () => {
      const result = await validateSiteUrl('pro.pagesjaunes.fr/entreprise');
      expect(result.type).toBe('directory');
    });

    test('devrait gérer les chemins complexes', async () => {
      const result = await validateSiteUrl('facebook.com/pages/entreprise/123456789');
      expect(result.type).toBe('social-only');
    });

    test('devrait gérer les paramètres URL', async () => {
      const result = await validateSiteUrl('travaux.com/pro?id=123&category=plomberie');
      expect(result.type).toBe('platform');
    });

    test('devrait gérer les espaces', async () => {
      const result = await validateSiteUrl('  facebook.com/test  ');
      expect(result.type).toBe('social-only');
    });
  });
});
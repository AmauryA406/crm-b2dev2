import { NextRequest, NextResponse } from 'next/server';
import { scrapeProspects } from '../../../lib/scraper';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { prisma } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { metier, villes, maxPerVille = 100 } = body;

    // Validation des paramètres
    if (!metier || !villes || !Array.isArray(villes) || villes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres manquants: métier et villes (array) sont requis'
        },
        { status: 400 }
      );
    }

    // Validation des limites selon CLAUDE.md
    if (villes.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 30 villes par session (limite quotidienne recommandée)'
        },
        { status: 400 }
      );
    }

    if (maxPerVille > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 100 prospects par ville'
        },
        { status: 400 }
      );
    }

    console.log(`🚀 Début du scraping: ${metier} dans ${villes.length} villes`);
    console.log(`Villes: ${villes.join(', ')}`);

    // Lancer le scraping
    const scrapingResult = await scrapeProspects(metier, villes, maxPerVille);

    if (!scrapingResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: scrapingResult.error || 'Erreur inconnue lors du scraping'
        },
        { status: 500 }
      );
    }

    // Sauvegarder les prospects en base de données
    let savedCount = 0;
    let duplicateCount = 0;

    for (const prospect of scrapingResult.data) {
      try {
        await prisma.lead.create({
          data: {
            nom: prospect.nom,
            telephone: prospect.telephone,
            siteWeb: prospect.siteWeb,
            adresse: prospect.adresse,
            ville: prospect.ville,
            metier: prospect.metier,
            motifSelection: prospect.motifSelection,
            noteGoogle: prospect.noteGoogle,
            nombreAvis: prospect.nombreAvis,
            statut: 'A contacter'
          }
        });
        savedCount++;
      } catch (error: any) {
        // Gestion des doublons (contraintes UNIQUE)
        if (error.code === 'P2002') {
          duplicateCount++;
          console.log(`⚠️ Doublon ignoré: ${prospect.nom}`);
        } else {
          console.error(`Erreur sauvegarde ${prospect.nom}:`, error);
        }
      }
    }

    console.log(`✅ Scraping terminé: ${savedCount} prospects sauvegardés, ${duplicateCount} doublons ignorés`);

    return NextResponse.json({
      success: true,
      data: {
        totalFound: scrapingResult.totalFound,
        totalValid: scrapingResult.totalValid,
        totalSaved: savedCount,
        totalDuplicates: duplicateCount,
        villes: villes,
        metier: metier
      },
      message: `Scraping terminé: ${savedCount} nouveaux prospects ajoutés, ${duplicateCount} doublons ignorés`
    });

  } catch (error) {
    console.error('Erreur API scrape:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Erreur serveur: ${error instanceof Error ? error.message : String(error)}`
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';
import { prisma } from '../../../../lib/db';
import { parseExcelFile, validateExcelColumns } from '../../../../lib/excel-parser';

// POST /api/leads/import - Importer un fichier Excel
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format de fichier non supporté. Utilisez un fichier Excel (.xlsx ou .xls)'
        },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fichier trop volumineux. Taille maximum: 10MB'
        },
        { status: 400 }
      );
    }

    // Convertir en buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validation des colonnes
    const validation = validateExcelColumns(buffer);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Structure du fichier invalide',
          details: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Log des avertissements si présents
    if (validation.warnings.length > 0) {
      console.log('⚠️ Avertissements validation:', validation.warnings);
    }

    // Parser le fichier Excel
    const parseResult = parseExcelFile(buffer);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de l\'analyse du fichier',
          details: parseResult.errors
        },
        { status: 400 }
      );
    }

    console.log(`📊 Import Excel: ${parseResult.data.length} lignes à traiter`);

    // Importer les leads avec gestion des doublons
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const duplicates: string[] = [];
    const importErrors: string[] = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const lead = parseResult.data[i];

      try {
        // Vérifier les doublons avant insertion
        const existingLead = await prisma.lead.findFirst({
          where: {
            OR: [
              { telephone: lead.telephone && lead.telephone !== '' ? lead.telephone : undefined },
              { email: lead.email && lead.email !== '' ? lead.email : undefined },
              { siteWeb: lead.siteWeb && lead.siteWeb !== '' && !lead.siteWeb.includes('@') ? lead.siteWeb : undefined }
            ].filter(Boolean)
          }
        });

        if (existingLead) {
          duplicateCount++;
          duplicates.push(`${lead.nom} (${lead.telephone || lead.email || lead.siteWeb})`);
          console.log(`⚠️ Doublon ignoré: ${lead.nom}`);
          continue;
        }

        // Créer le lead
        await prisma.lead.create({
          data: {
            nom: lead.nom,
            telephone: lead.telephone,
            email: lead.email,
            siteWeb: lead.siteWeb,
            adresse: lead.adresse,
            ville: lead.ville,
            codePostal: lead.codePostal,
            metier: lead.metier,
            motifSelection: lead.motifSelection,
            statut: lead.statut,
            note: lead.note,
            noteGoogle: lead.noteGoogle,
            nombreAvis: lead.nombreAvis
          }
        });

        importedCount++;
        console.log(`✅ Lead importé: ${lead.nom}`);

      } catch (error: any) {
        errorCount++;
        const errorMsg = `${lead.nom}: ${error.message || String(error)}`;
        importErrors.push(errorMsg);
        console.error(`❌ Erreur import ${lead.nom}:`, error);

        // Gestion spécifique des contraintes UNIQUE
        if (error.code === 'P2002') {
          duplicateCount++;
          const field = error.meta?.target?.[0];
          duplicates.push(`${lead.nom} (doublon ${field})`);
        }
      }
    }

    console.log(`📈 Import terminé: ${importedCount} importés, ${duplicateCount} doublons, ${errorCount} erreurs`);

    // Préparer la réponse
    const result = {
      totalRows: parseResult.totalRows,
      imported: importedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      parseErrors: parseResult.errors,
      duplicateDetails: duplicates.slice(0, 10), // Limiter à 10 pour éviter une réponse trop lourde
      importErrors: importErrors.slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: `Import terminé: ${importedCount} leads importés, ${duplicateCount} doublons ignorés${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`
    });

  } catch (error) {
    console.error('Erreur POST /api/leads/import:', error);
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
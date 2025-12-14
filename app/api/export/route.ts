import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { prisma } from '../../../lib/db';
import * as XLSX from 'xlsx';
import { LeadStatus } from '../../../lib/types';

// GET /api/export - Exporter tous les leads vers Excel
export async function GET(request: NextRequest) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage optionnels pour l'export
    const ville = searchParams.get('ville');
    const statut = searchParams.get('statut') as LeadStatus | null;
    const motif = searchParams.get('motif');

    // Construction des filtres Prisma (optionnels)
    const whereConditions: any = {};

    if (ville) {
      whereConditions.ville = { contains: ville, mode: 'insensitive' };
    }

    if (statut) {
      whereConditions.statut = statut;
    }

    if (motif) {
      whereConditions.motifSelection = { contains: motif, mode: 'insensitive' };
    }

    // Récupération de tous les leads (ou filtrés)
    const leads = await prisma.lead.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' }
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun lead à exporter' },
        { status: 404 }
      );
    }

    console.log(`📤 Export Excel: ${leads.length} leads à exporter`);

    // Préparer les données pour Excel - Format compatible pour réimport
    const excelData = leads.map(lead => ({
      'Nom': lead.nom,
      'Téléphone': lead.telephone || '',
      'Email': lead.email || '',
      'Site Web': lead.siteWeb || '',
      'Adresse': lead.adresse || '',
      'Ville': lead.ville,
      'Code Postal': lead.codePostal || '',
      'Métier': lead.metier,
      'Motif Sélection': lead.motifSelection,
      'Statut': lead.statut,
      'Note': lead.note || '',
      'Note Google': lead.noteGoogle ? lead.noteGoogle.toString() : '',
      'Nombre Avis': lead.nombreAvis ? lead.nombreAvis.toString() : '',
      // Colonnes d'info uniquement (non importées)
      'Date Création': lead.createdAt.toLocaleDateString('fr-FR'),
      'Dernière Modification': lead.updatedAt.toLocaleDateString('fr-FR')
    }));

    // Créer le workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Définir la largeur des colonnes pour une meilleure lisibilité
    const columnWidths = [
      { wch: 25 }, // Nom
      { wch: 15 }, // Téléphone
      { wch: 25 }, // Email
      { wch: 30 }, // Site Web
      { wch: 40 }, // Adresse
      { wch: 15 }, // Ville
      { wch: 12 }, // Code Postal
      { wch: 15 }, // Métier
      { wch: 25 }, // Motif Sélection
      { wch: 18 }, // Statut
      { wch: 30 }, // Note
      { wch: 12 }, // Note Google
      { wch: 12 }, // Nombre Avis
      { wch: 15 }, // Date Création
      { wch: 18 }  // Dernière Modification
    ];

    worksheet['!cols'] = columnWidths;

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });

    // Nom du fichier avec timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `leads_export_${timestamp}.xlsx`;

    console.log(`✅ Export Excel terminé: ${fileName} (${leads.length} leads)`);

    // Retourner le fichier Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/export:', error);
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

// POST /api/export - Export avec filtres avancés (body)
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
    const {
      ville,
      statut,
      motif,
      search,
      dateDebut,
      dateFin,
      exportFormat = 'xlsx'
    } = body;

    // Validation du format d'export
    if (exportFormat !== 'xlsx' && exportFormat !== 'csv') {
      return NextResponse.json(
        { success: false, error: 'Format d\'export non supporté. Utilisez "xlsx" ou "csv"' },
        { status: 400 }
      );
    }

    // Construction des filtres avancés
    const whereConditions: any = {};

    if (ville) {
      whereConditions.ville = { contains: ville, mode: 'insensitive' };
    }

    if (statut) {
      whereConditions.statut = statut;
    }

    if (motif) {
      whereConditions.motifSelection = { contains: motif, mode: 'insensitive' };
    }

    if (search) {
      whereConditions.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } },
        { siteWeb: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtres de date
    if (dateDebut || dateFin) {
      whereConditions.createdAt = {};
      if (dateDebut) {
        whereConditions.createdAt.gte = new Date(dateDebut);
      }
      if (dateFin) {
        whereConditions.createdAt.lte = new Date(dateFin);
      }
    }

    // Récupération des leads filtrés
    const leads = await prisma.lead.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' }
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun lead correspondant aux critères' },
        { status: 404 }
      );
    }

    console.log(`📤 Export ${exportFormat.toUpperCase()}: ${leads.length} leads filtrés`);

    // Format d'export optimisé - Compatible pour réimport
    const excelData = leads.map(lead => ({
      'Nom': lead.nom,
      'Téléphone': lead.telephone || '',
      'Email': lead.email || '',
      'Site Web': lead.siteWeb || '',
      'Adresse': lead.adresse || '',
      'Ville': lead.ville,
      'Code Postal': lead.codePostal || '',
      'Métier': lead.metier,
      'Motif Sélection': lead.motifSelection,
      'Statut': lead.statut,
      'Note': lead.note || '',
      'Note Google': lead.noteGoogle ? lead.noteGoogle.toString() : '',
      'Nombre Avis': lead.nombreAvis ? lead.nombreAvis.toString() : '',
      // Colonnes d'info uniquement (non importées)
      'Date Création': lead.createdAt.toLocaleDateString('fr-FR'),
      'Dernière Modification': lead.updatedAt.toLocaleDateString('fr-FR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `leads_export_filtered_${timestamp}.${exportFormat}`;

    const fileBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: exportFormat as any,
      compression: true
    });

    const contentType = exportFormat === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Erreur POST /api/export:', error);
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
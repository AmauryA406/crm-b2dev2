import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-config';
import { LeadStatus } from '../../../lib/types';
import { prisma } from '../../../lib/db';

// GET /api/leads - Liste des leads avec filtres
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

    // Paramètres de filtrage
    const ville = searchParams.get('ville');
    const statut = searchParams.get('statut') as LeadStatus | null;
    const motif = searchParams.get('motif');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construction des filtres Prisma
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

    // Récupération des leads avec pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.lead.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur GET /api/leads:', error);
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

// POST /api/leads - Créer un lead manuellement
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
      nom,
      telephone,
      email,
      siteWeb,
      adresse,
      ville,
      codePostal,
      metier,
      motifSelection,
      statut = 'A contacter',
      note,
      noteGoogle,
      nombreAvis
    } = body;

    // Validation des champs obligatoires
    if (!nom || !ville || !metier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Champs obligatoires manquants: nom, ville, métier'
        },
        { status: 400 }
      );
    }

    // Formatage du téléphone (sans espaces)
    const formattedPhone = telephone ? telephone.replace(/[\s\-\.]/g, '') : null;

    // Création du lead
    const newLead = await prisma.lead.create({
      data: {
        nom: nom.trim(),
        telephone: formattedPhone,
        email: email?.trim() || null,
        siteWeb: siteWeb?.trim() || null,
        adresse: adresse?.trim() || null,
        ville: ville.trim(),
        codePostal: codePostal?.trim() || null,
        metier: metier.trim(),
        motifSelection: motifSelection?.trim() || 'Ajout manuel',
        statut: statut as LeadStatus,
        note: note?.trim() || null,
        noteGoogle: noteGoogle ? parseFloat(noteGoogle) : null,
        nombreAvis: nombreAvis ? parseInt(nombreAvis) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: newLead,
      message: 'Lead créé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur POST /api/leads:', error);

    // Gestion des erreurs de contraintes UNIQUE
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json(
        {
          success: false,
          error: `Doublon détecté sur le champ: ${field}. Ce ${field} existe déjà.`
        },
        { status: 409 }
      );
    }

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
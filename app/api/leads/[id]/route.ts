import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-config';
import { prisma } from '../../../../lib/db';
import { LeadStatus } from '../../../../lib/types';

// GET /api/leads/[id] - Détail d'un lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const leadId = params.id;

    // Récupération du lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Erreur GET /api/leads/[id]:', error);
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

// PUT /api/leads/[id] - Modifier un lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const leadId = params.id;
    const body = await request.json();

    // Vérifier que le lead existe
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: 'Lead non trouvé' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Champs modifiables
    if (body.nom !== undefined) updateData.nom = body.nom.trim();
    if (body.telephone !== undefined) {
      updateData.telephone = body.telephone ? body.telephone.replace(/[\s\-\.]/g, '') : null;
    }
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.siteWeb !== undefined) updateData.siteWeb = body.siteWeb?.trim() || null;
    if (body.adresse !== undefined) updateData.adresse = body.adresse?.trim() || null;
    if (body.ville !== undefined) updateData.ville = body.ville.trim();
    if (body.codePostal !== undefined) updateData.codePostal = body.codePostal?.trim() || null;
    if (body.metier !== undefined) updateData.metier = body.metier.trim();
    if (body.motifSelection !== undefined) updateData.motifSelection = body.motifSelection.trim();
    if (body.statut !== undefined) updateData.statut = body.statut as LeadStatus;
    if (body.note !== undefined) updateData.note = body.note?.trim() || null;
    if (body.noteGoogle !== undefined) updateData.noteGoogle = body.noteGoogle ? parseFloat(body.noteGoogle) : null;
    if (body.nombreAvis !== undefined) updateData.nombreAvis = body.nombreAvis ? parseInt(body.nombreAvis) : null;

    // Mise à jour du lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('Erreur PUT /api/leads/[id]:', error);

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

// DELETE /api/leads/[id] - Supprimer un lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const leadId = params.id;

    // Vérifier que le lead existe
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: 'Lead non trouvé' },
        { status: 404 }
      );
    }

    // Suppression du lead
    await prisma.lead.delete({
      where: { id: leadId }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE /api/leads/[id]:', error);
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
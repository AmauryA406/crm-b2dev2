'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { LEAD_STATUSES, type LeadStatus } from '../../../lib/types';

interface Lead {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  adresse?: string | null;
  ville: string;
  codePostal?: string | null;
  metier: string;
  motifSelection: string;
  statut: LeadStatus;
  note?: string | null;
  noteGoogle?: number | null;
  nombreAvis?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/leads/${leadId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setLead(data.data);
      setEditForm(data.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lead || !editForm) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setLead(data.data);
      setEditForm(data.data);
      setIsEditing(false);

    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le lead "${lead.nom}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      alert('Lead supprimé avec succès');
      router.push('/leads');

    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const handleCancel = () => {
    setEditForm(lead || {});
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusEmoji = (statut: LeadStatus) => {
    return LEAD_STATUSES.find(s => s.value === statut)?.emoji || '';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Chargement du lead...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">❌ {error}</div>
                <button
                  onClick={() => router.push('/leads')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Retour aux leads
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/leads')}
                  className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
                >
                  ← Retour aux leads
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Détail du lead : {lead.nom}
                </h1>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.metier}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getStatusEmoji(lead.statut)} {lead.statut}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      🗑️ Supprimer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Informations de contact */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">📞 Contact</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.nom || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nom: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{lead.nom}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.telephone || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telephone: e.target.value }))}
                        placeholder="0612345678"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1">
                        {lead.telephone ? (
                          <a href={`tel:${lead.telephone}`} className="text-blue-600 hover:text-blue-800">
                            {lead.telephone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Non renseigné</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contact@entreprise.fr"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-gray-400">Non renseigné</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Web</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.siteWeb || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, siteWeb: e.target.value }))}
                        placeholder="https://www.entreprise.fr"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1">
                        {lead.siteWeb ? (
                          <a href={lead.siteWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all">
                            {lead.siteWeb}
                          </a>
                        ) : (
                          <span className="text-gray-400">Aucun site</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations business */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">🏢 Business</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    {isEditing ? (
                      <select
                        value={editForm.statut || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, statut: e.target.value as LeadStatus }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {LEAD_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.emoji} {status.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-1 text-gray-900">
                        {getStatusEmoji(lead.statut)} {lead.statut}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Métier</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.metier || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, metier: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{lead.metier}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ville</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.ville || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, ville: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="mt-1 text-gray-900">{lead.ville}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Motif de sélection</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {lead.motifSelection}
                      </span>
                    </div>
                  </div>

                  {(lead.noteGoogle || lead.nombreAvis) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Note Google</label>
                      <div className="mt-1 text-gray-900">
                        {lead.noteGoogle && (
                          <span className="mr-2">⭐ {lead.noteGoogle}/5</span>
                        )}
                        {lead.nombreAvis && (
                          <span className="text-sm text-gray-500">({lead.nombreAvis} avis)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="border-t border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📍 Adresse</h2>
              {isEditing ? (
                <textarea
                  value={editForm.adresse || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, adresse: e.target.value }))}
                  placeholder="Adresse complète de l'entreprise"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="text-gray-900">
                  {lead.adresse || <span className="text-gray-400">Non renseignée</span>}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📝 Notes</h2>
              {isEditing ? (
                <textarea
                  value={editForm.note || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Ajoutez vos notes sur ce lead..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="text-gray-900 whitespace-pre-wrap">
                  {lead.note || <span className="text-gray-400">Aucune note</span>}
                </div>
              )}
            </div>

            {/* Métadonnées */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Métadonnées</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Créé le :</strong> {formatDate(lead.createdAt)}
                </div>
                <div>
                  <strong>Modifié le :</strong> {formatDate(lead.updatedAt)}
                </div>
                <div>
                  <strong>ID :</strong> <code className="bg-gray-100 px-1 rounded">{lead.id}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
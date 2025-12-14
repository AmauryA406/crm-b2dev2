'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES, type LeadStatus } from '../lib/types';

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

interface LeadsTableProps {
  onRefresh?: () => void;
}

type SortField = 'nom' | 'ville' | 'statut' | 'motifSelection' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function LeadsTable({ onRefresh }: LeadsTableProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [villeFilter, setVilleFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState<LeadStatus | ''>('');
  const [motifFilter, setMotifFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Tri
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Listes des villes et motifs pour les filtres
  const [villes, setVilles] = useState<string[]>([]);
  const [motifs, setMotifs] = useState<string[]>([]);

  useEffect(() => {
    loadLeads();
  }, [page, villeFilter, statutFilter, motifFilter, searchFilter, sortField, sortDirection]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(villeFilter && { ville: villeFilter }),
        ...(statutFilter && { statut: statutFilter }),
        ...(motifFilter && { motif: motifFilter }),
        ...(searchFilter && { search: searchFilter })
      });

      const response = await fetch(`/api/leads?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setLeads(data.data.leads);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);

      // Extraire les villes et motifs uniques pour les filtres
      const uniqueVilles = [...new Set(data.data.leads.map((lead: Lead) => lead.ville))] as string[];
      const uniqueMotifs = [...new Set(data.data.leads.map((lead: Lead) => lead.motifSelection))] as string[];
      setVilles(uniqueVilles);
      setMotifs(uniqueMotifs);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ statut: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour le lead dans la liste locale
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, statut: newStatus } : lead
      ));

      if (onRefresh) onRefresh();

    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const handleRowClick = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const resetFilters = () => {
    setVilleFilter('');
    setStatutFilter('');
    setMotifFilter('');
    setSearchFilter('');
    setPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Chargement des leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Nom, téléphone, adresse..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <select
              value={villeFilter}
              onChange={(e) => setVilleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les villes</option>
              {villes.map(ville => (
                <option key={ville} value={ville}>{ville}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as LeadStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              {LEAD_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.emoji} {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif
            </label>
            <select
              value={motifFilter}
              onChange={(e) => setMotifFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les motifs</option>
              {motifs.map(motif => (
                <option key={motif} value={motif}>{motif}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Effacer les filtres
          </button>
          <div className="text-sm text-gray-600">
            {total} lead{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('nom')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Nom {getSortIcon('nom')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Web
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th
                  onClick={() => handleSort('ville')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Ville {getSortIcon('ville')}
                </th>
                <th
                  onClick={() => handleSort('motifSelection')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Motif Sélection {getSortIcon('motifSelection')}
                </th>
                <th
                  onClick={() => handleSort('statut')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Statut {getSortIcon('statut')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => handleRowClick(lead.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.nom}</div>
                      <div className="text-sm text-gray-500">{lead.metier}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.telephone ? (
                      <a
                        href={`tel:${lead.telephone}`}
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.telephone}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.siteWeb ? (
                      <a
                        href={lead.siteWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate block max-w-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.siteWeb}
                      </a>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {lead.adresse || <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.ville}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {lead.motifSelection}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.statut}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="text-sm border-none bg-transparent focus:ring-blue-500 focus:border-blue-500"
                    >
                      {LEAD_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.emoji} {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {lead.note || <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leads.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Aucun lead trouvé avec ces critères
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-700">
              Affichage {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} résultats
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && leads.length > 0 && (
        <div className="text-center py-4">
          <span className="text-sm text-gray-500">Mise à jour...</span>
        </div>
      )}
    </div>
  );
}
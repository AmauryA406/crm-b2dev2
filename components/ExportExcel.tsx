'use client';

import { useState } from 'react';
import { LEAD_STATUSES, type LeadStatus } from '../lib/types';

interface ExportExcelProps {
  totalLeads?: number;
}

export function ExportExcel({ totalLeads = 0 }: ExportExcelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'simple' | 'filtered'>('simple');
  const [showFilters, setShowFilters] = useState(false);

  // Filtres pour export avancé
  const [filters, setFilters] = useState({
    ville: '',
    statut: '' as LeadStatus | '',
    motif: '',
    search: '',
    dateDebut: '',
    dateFin: '',
    exportFormat: 'xlsx' as 'xlsx' | 'csv'
  });

  const handleSimpleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'export');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      alert(`Erreur d'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilteredExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'export');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `leads_export_filtered_${new Date().toISOString().split('T')[0]}.${filters.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset filters
      setShowFilters(false);

    } catch (error) {
      alert(`Erreur d'export: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      ville: '',
      statut: '',
      motif: '',
      search: '',
      dateDebut: '',
      dateFin: '',
      exportFormat: 'xlsx'
    });
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'export principaux */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSimpleExport}
          disabled={isExporting || totalLeads === 0}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Export en cours...
            </>
          ) : (
            <>
              📤 Exporter tous les leads ({totalLeads})
            </>
          )}
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          🎯 Export avec filtres
          {showFilters ? ' 📐' : ' ⚙️'}
        </button>
      </div>

      {totalLeads === 0 && (
        <div className="text-sm text-gray-500 italic">
          Aucun lead à exporter. Effectuez un scraping ou importez des leads d'abord.
        </div>
      )}

      {/* Filtres pour export avancé */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Export avec filtres avancés</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Nom, téléphone, adresse..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={filters.ville}
                onChange={(e) => setFilters(prev => ({ ...prev, ville: e.target.value }))}
                placeholder="ex: Paris"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value as LeadStatus | '' }))}
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
                Motif de sélection
              </label>
              <input
                type="text"
                value={filters.motif}
                onChange={(e) => setFilters(prev => ({ ...prev, motif: e.target.value }))}
                placeholder="ex: Pas de site"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => setFilters(prev => ({ ...prev, dateDebut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">
                Format d'export :
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="xlsx"
                    checked={filters.exportFormat === 'xlsx'}
                    onChange={(e) => setFilters(prev => ({ ...prev, exportFormat: e.target.value as 'xlsx' }))}
                    className="mr-1"
                  />
                  Excel (.xlsx)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={filters.exportFormat === 'csv'}
                    onChange={(e) => setFilters(prev => ({ ...prev, exportFormat: e.target.value as 'csv' }))}
                    className="mr-1"
                  />
                  CSV (.csv)
                </label>
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Effacer tous les filtres
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleFilteredExport}
              disabled={isExporting}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Export en cours...
                </>
              ) : (
                <>
                  🎯 Exporter avec filtres
                </>
              )}
            </button>

            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Informations sur l'export */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 À propos de l'export</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Export simple :</strong> Télécharge tous les leads au format Excel</li>
          <li>• <strong>Export avec filtres :</strong> Permet de sélectionner les leads à exporter selon vos critères</li>
          <li>• <strong>Format :</strong> Le fichier exporté peut être réimporté directement dans le CRM</li>
          <li>• <strong>Colonnes :</strong> Nom, Téléphone, Email, Site Web, Adresse, Ville, Métier, Motif, Statut, Note, etc.</li>
          <li>• <strong>Nom de fichier :</strong> leads_export_YYYY-MM-DD.xlsx (ou .csv)</li>
        </ul>
      </div>
    </div>
  );
}
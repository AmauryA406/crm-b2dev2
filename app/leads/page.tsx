'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LeadsTable } from '@/components/LeadsTable';
import { ImportExcel } from '@/components/ImportExcel';
import { ExportExcel } from '@/components/ExportExcel';

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<'table' | 'import' | 'export'>('table');
  const [totalLeads, setTotalLeads] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Charger le nombre total de leads
  useEffect(() => {
    loadTotalLeads();
  }, [refreshKey]);

  const loadTotalLeads = async () => {
    try {
      const response = await fetch('/api/leads?limit=1', {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setTotalLeads(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Erreur chargement total leads:', error);
    }
  };

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('table');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'table' as const, label: 'Tableau des leads', icon: '📋', count: totalLeads },
    { id: 'import' as const, label: 'Importer Excel', icon: '📥' },
    { id: 'export' as const, label: 'Exporter Excel', icon: '📤' }
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📋 Gestion des Leads
            </h1>
            <p className="text-gray-600">
              Gérez tous vos prospects scrapés et importés. Modifiez les statuts, importez/exportez des fichiers Excel.
            </p>
          </div>

          {/* Statistique rapide */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalLeads}</div>
                  <div className="text-sm text-gray-500">Total leads</div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-sm text-gray-600">
                  Cliquez sur une ligne pour voir les détails d'un lead
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-6 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Contenu des tabs */}
            <div className="p-6">
              {activeTab === 'table' && (
                <LeadsTable
                  key={refreshKey}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'import' && (
                <ImportExcel onImportComplete={handleImportComplete} />
              )}

              {activeTab === 'export' && (
                <ExportExcel totalLeads={totalLeads} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
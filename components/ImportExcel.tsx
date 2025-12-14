'use client';

import { useState, useRef } from 'react';

interface ImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
  parseErrors: string[];
  duplicateDetails: string[];
  importErrors: string[];
  message: string;
}

interface ImportExcelProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function ImportExcel({ onImportComplete }: ImportExcelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('Le fichier est trop volumineux (maximum 10MB)');
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      setResult(data.data);
      if (onImportComplete) {
        onImportComplete(data.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsUploading(false);
      // Reset l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetImport = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {isUploading ? 'Import en cours...' : 'Cliquez pour sélectionner un fichier Excel'}
              </span>
              <span className="text-sm text-gray-500">
                ou glissez-déposez votre fichier ici
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Formats supportés : .xlsx, .xls (maximum 10MB)
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <div className="text-sm font-medium text-blue-800">Import en cours...</div>
              <div className="text-sm text-blue-600">Analyse du fichier et vérification des doublons</div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur d'import</h3>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-green-800">Import terminé !</h3>
              <p className="text-sm text-green-700 mt-2">{result.message}</p>

              {/* Statistiques */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{result.totalRows}</div>
                  <div className="text-xs text-gray-600">Lignes analysées</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{result.imported}</div>
                  <div className="text-xs text-gray-600">Leads importés</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{result.duplicates}</div>
                  <div className="text-xs text-gray-600">Doublons ignorés</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{result.errors}</div>
                  <div className="text-xs text-gray-600">Erreurs</div>
                </div>
              </div>

              {/* Détails des doublons */}
              {result.duplicateDetails && result.duplicateDetails.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">
                    Doublons détectés ({result.duplicates}) :
                  </h4>
                  <div className="bg-orange-50 rounded p-3 max-h-32 overflow-y-auto">
                    <ul className="text-xs text-orange-700 space-y-1">
                      {result.duplicateDetails.slice(0, 10).map((duplicate, index) => (
                        <li key={index}>• {duplicate}</li>
                      ))}
                      {result.duplicateDetails.length > 10 && (
                        <li className="font-medium">... et {result.duplicateDetails.length - 10} autres</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Erreurs d'import */}
              {result.importErrors && result.importErrors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Erreurs d'import ({result.errors}) :
                  </h4>
                  <div className="bg-red-50 rounded p-3 max-h-32 overflow-y-auto">
                    <ul className="text-xs text-red-700 space-y-1">
                      {result.importErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {result.importErrors.length > 5 && (
                        <li className="font-medium">... et {result.importErrors.length - 5} autres erreurs</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Erreurs de parsing */}
              {result.parseErrors && result.parseErrors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Erreurs de format :
                  </h4>
                  <div className="bg-red-50 rounded p-3 max-h-32 overflow-y-auto">
                    <ul className="text-xs text-red-700 space-y-1">
                      {result.parseErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {result.parseErrors.length > 5 && (
                        <li className="font-medium">... et {result.parseErrors.length - 5} autres erreurs</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={resetImport}
                  className="text-sm bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
                >
                  Importer un autre fichier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Format Excel attendu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">📋 Format Excel attendu</h4>
        <div className="text-xs text-blue-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="font-medium">Colonnes obligatoires :</div>
            <div>• Nom</div>
            <div>• Ville</div>
            <div></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="font-medium">Colonnes optionnelles :</div>
            <div>• Téléphone</div>
            <div>• Site Web</div>
            <div>• Adresse</div>
            <div>• Motif Sélection</div>
            <div>• Statut</div>
            <div>• Note</div>
            <div>• Email</div>
          </div>
          <div className="mt-3 text-blue-600">
            💡 Les doublons sont automatiquement détectés par téléphone, email ou site web.
          </div>
        </div>
      </div>
    </div>
  );
}
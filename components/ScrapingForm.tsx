'use client';

import { useState } from 'react';

interface ScrapingProgress {
  isScrapingActive: boolean;
  currentCity: string;
  cityIndex: number;
  totalCities: number;
  prospectsFound: number;
  prospectsAdded: number;
  prospectsSkipped: number;
  progress: number;
}

interface ScrapingResult {
  success: boolean;
  totalFound: number;
  totalValid: number;
  totalSaved: number;
  totalDuplicates: number;
  villes: string[];
  metier: string;
  message: string;
  error?: string;
}

export function ScrapingForm() {
  const [metier, setMetier] = useState('');
  const [villes, setVilles] = useState('');
  const [maxPerVille, setMaxPerVille] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [progress, setProgress] = useState<ScrapingProgress>({
    isScrapingActive: false,
    currentCity: '',
    cityIndex: 0,
    totalCities: 0,
    prospectsFound: 0,
    prospectsAdded: 0,
    prospectsSkipped: 0,
    progress: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError('');
    setResult(null);
    setIsLoading(true);

    // Validation côté client
    if (!metier.trim()) {
      setError('Le type d\'entreprise est obligatoire');
      setIsLoading(false);
      return;
    }

    if (!villes.trim()) {
      setError('Au moins une ville est obligatoire');
      setIsLoading(false);
      return;
    }

    const villesArray = villes.split(',').map(v => v.trim()).filter(v => v);

    if (villesArray.length === 0) {
      setError('Veuillez saisir au moins une ville valide');
      setIsLoading(false);
      return;
    }

    if (villesArray.length > 30) {
      setError('Maximum 30 villes par session (limite quotidienne recommandée)');
      setIsLoading(false);
      return;
    }

    // Simulation du progress (en attendant l'implémentation de la progression temps réel)
    setProgress({
      isScrapingActive: true,
      currentCity: villesArray[0],
      cityIndex: 0,
      totalCities: villesArray.length,
      prospectsFound: 0,
      prospectsAdded: 0,
      prospectsSkipped: 0,
      progress: 0
    });

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          metier: metier.trim(),
          villes: villesArray,
          maxPerVille: maxPerVille
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du scraping');
      }

      setResult(data.data);
      setProgress(prev => ({
        ...prev,
        isScrapingActive: false,
        progress: 100,
        prospectsFound: data.data.totalFound,
        prospectsAdded: data.data.totalSaved,
        prospectsSkipped: data.data.totalDuplicates
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProgress(prev => ({
        ...prev,
        isScrapingActive: false
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMetier('');
    setVilles('');
    setMaxPerVille(100);
    setError('');
    setResult(null);
    setProgress({
      isScrapingActive: false,
      currentCity: '',
      cityIndex: 0,
      totalCities: 0,
      prospectsFound: 0,
      prospectsAdded: 0,
      prospectsSkipped: 0,
      progress: 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="metier" className="block text-sm font-medium text-gray-700 mb-2">
            Type d'entreprise <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="metier"
            value={metier}
            onChange={(e) => setMetier(e.target.value)}
            placeholder="ex: plombier, électricien, menuisier, coiffeur..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label htmlFor="villes" className="block text-sm font-medium text-gray-700 mb-2">
            Villes (séparées par des virgules) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="villes"
            value={villes}
            onChange={(e) => setVilles(e.target.value)}
            placeholder="ex: Paris, Lyon, Marseille, Toulouse, Nice..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum 30 villes par session recommandé pour éviter la détection
          </p>
        </div>

        <div>
          <label htmlFor="maxPerVille" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum prospects par ville
          </label>
          <select
            id="maxPerVille"
            value={maxPerVille}
            onChange={(e) => setMaxPerVille(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            disabled={isLoading}
          >
            <option value={25}>25 prospects/ville (rapide)</option>
            <option value={50}>50 prospects/ville (équilibré)</option>
            <option value={75}>75 prospects/ville (complet)</option>
            <option value={100}>100 prospects/ville (maximum)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Plus le nombre est élevé, plus le scraping prend du temps
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scraping en cours...
              </span>
            ) : (
              '🚀 Lancer le scraping'
            )}
          </button>

          {(result || error) && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Nouveau scraping
            </button>
          )}
        </div>
      </form>

      {/* Barre de progression */}
      {(isLoading || progress.isScrapingActive) && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progression du scraping</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>

          {progress.currentCity && (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Ville actuelle :</span> {progress.currentCity}
              {progress.totalCities > 0 && (
                <span className="ml-2">({progress.cityIndex + 1}/{progress.totalCities})</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{progress.prospectsFound}</div>
              <div className="text-gray-500">Trouvés</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{progress.prospectsAdded}</div>
              <div className="text-gray-500">Ajoutés</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{progress.prospectsSkipped}</div>
              <div className="text-gray-500">Ignorés</div>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Scraping terminé avec succès !</h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-2">{result.message}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="text-center">
                    <div className="font-semibold text-lg text-blue-600">{result.totalFound}</div>
                    <div className="text-xs">Prospects trouvés</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-green-600">{result.totalSaved}</div>
                    <div className="text-xs">Nouveaux ajoutés</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-orange-600">{result.totalDuplicates}</div>
                    <div className="text-xs">Doublons ignorés</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-purple-600">{result.villes.length}</div>
                    <div className="text-xs">Villes scrapées</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conseils et limites */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Conseils d'utilisation</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Maximum 20-30 villes par jour recommandé pour éviter la détection</li>
          <li>• Évitez de scraper la même ville plusieurs fois par jour</li>
          <li>• Le système ne garde que les entreprises avec sites obsolètes ou inexistants</li>
          <li>• Les doublons sont automatiquement détectés et ignorés</li>
          <li>• Temps estimé : ~2-3 minutes par ville selon le nombre de prospects</li>
        </ul>
      </div>
    </div>
  );
}
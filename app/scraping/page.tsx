'use client';

import { Navbar } from '@/components/Navbar';
import { ScrapingForm } from '@/components/ScrapingForm';

export default function ScrapingPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🔍 Scraping Google Maps
              </h1>
              <p className="text-gray-600">
                Trouvez des prospects avec des sites web obsolètes ou inexistants pour leur proposer vos services de création de sites web.
              </p>
            </div>

            <ScrapingForm />
          </div>

          {/* Section informations sur les critères */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Critères de sélection automatique
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-green-700 mb-2">✅ Prospects sélectionnés</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pas de site web</li>
                  <li>• Site sur annuaire (PagesJaunes, Yelp, etc.)</li>
                  <li>• Réseaux sociaux uniquement (Facebook, Instagram)</li>
                  <li>• Site plateforme (Travaux.com, etc.)</li>
                  <li>• Site non responsive (pas mobile-friendly)</li>
                  <li>• Site obsolète (avant 2018)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-red-700 mb-2">❌ Prospects ignorés</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Sites modernes et récents (après 2018)</li>
                  <li>• Sites responsive et bien conçus</li>
                  <li>• Sites e-commerce professionnels</li>
                  <li>• Sites déjà optimisés</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
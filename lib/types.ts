export interface Lead {
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
  createdAt: Date;
  updatedAt: Date;
}

export type LeadStatus =
  | 'A contacter'
  | 'RDV maquette'
  | 'Envoie Devis'
  | "Attente d'acompte"
  | 'Acompte payé'
  | 'RDV de mis projet'
  | 'RDV de fin de projet + Formation'
  | 'Finis'
  | 'Perdu';

export const LEAD_STATUSES: Array<{ value: LeadStatus; label: string; emoji: string }> = [
  { value: 'A contacter', label: 'A contacter', emoji: '🔍' },
  { value: 'RDV maquette', label: 'RDV maquette', emoji: '📅' },
  { value: 'Envoie Devis', label: 'Envoie Devis', emoji: '📄' },
  { value: "Attente d'acompte", label: "Attente d'acompte", emoji: '⏳' },
  { value: 'Acompte payé', label: 'Acompte payé', emoji: '💰' },
  { value: 'RDV de mis projet', label: 'RDV de mis projet', emoji: '🎨' },
  { value: 'RDV de fin de projet + Formation', label: 'RDV de fin de projet + Formation', emoji: '🎓' },
  { value: 'Finis', label: 'Finis', emoji: '✅' },
  { value: 'Perdu', label: 'Perdu', emoji: '🛑' }
];

export interface ScrapingRequest {
  metier: string;
  villes: string[];
}

export interface ScrapingProgress {
  currentCity: string;
  cityIndex: number;
  totalCities: number;
  prospectsFound: number;
  prospectsAdded: number;
  prospectsSkipped: number;
  isComplete: boolean;
}

export interface ScrapingResult {
  success: boolean;
  totalProspects: number;
  totalAdded: number;
  totalSkipped: number;
  citiesProcessed: string[];
  error?: string;
}

export interface GoogleMapsProspect {
  nom: string;
  telephone?: string;
  siteWeb?: string;
  adresse?: string;
  noteGoogle?: number;
  nombreAvis?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExcelImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: string[];
}

export interface LeadFilters {
  ville?: string;
  statut?: LeadStatus;
  motif?: string;
  search?: string;
}
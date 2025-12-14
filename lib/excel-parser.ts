import * as XLSX from 'xlsx';
import { LeadStatus } from './types';

export interface ExcelRow {
  Nom?: string;
  'Téléphone'?: string;
  'Site Web'?: string;
  Adresse?: string;
  Ville?: string;
  'Motif Sélection'?: string;
  Statut?: string;
  Note?: string;
  Email?: string;
  'Code Postal'?: string;
  'Métier'?: string;
  'Note Google'?: number;
  'Nombre Avis'?: number;
}

export interface ParsedLead {
  nom: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  adresse?: string;
  ville: string;
  codePostal?: string;
  metier: string;
  motifSelection: string;
  statut: LeadStatus;
  note?: string;
  noteGoogle?: number;
  nombreAvis?: number;
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedLead[];
  errors: string[];
  totalRows: number;
}

// Statuts valides selon CLAUDE.md
const VALID_STATUSES: LeadStatus[] = [
  'A contacter',
  'RDV maquette',
  'Envoie Devis',
  "Attente d'acompte",
  'Acompte payé',
  'RDV de mis projet',
  'RDV de fin de projet + Formation',
  'Finis',
  'Perdu'
];

export function parseExcelFile(buffer: Buffer): ExcelParseResult {
  const errors: string[] = [];
  const parsedLeads: ParsedLead[] = [];

  try {
    // Lire le fichier Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (!workbook.SheetNames.length) {
      return {
        success: false,
        data: [],
        errors: ['Aucune feuille trouvée dans le fichier Excel'],
        totalRows: 0
      };
    }

    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir en JSON
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      return {
        success: false,
        data: [],
        errors: ['Aucune donnée trouvée dans le fichier Excel'],
        totalRows: 0
      };
    }

    // Parser chaque ligne
    jsonData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 car Excel commence à 1 et on a un header

      try {
        const parsedLead = parseExcelRow(row, rowNumber);
        if (parsedLead) {
          parsedLeads.push(parsedLead);
        }
      } catch (error) {
        errors.push(`Ligne ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return {
      success: true,
      data: parsedLeads,
      errors,
      totalRows: jsonData.length
    };

  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`Erreur lecture fichier: ${error instanceof Error ? error.message : String(error)}`],
      totalRows: 0
    };
  }
}

function parseExcelRow(row: ExcelRow, rowNumber: number): ParsedLead | null {
  // Validation des champs obligatoires
  if (!row.Nom?.trim()) {
    throw new Error('Nom manquant ou vide');
  }

  if (!row.Ville?.trim()) {
    throw new Error('Ville manquante ou vide');
  }

  // Métier par défaut si manquant
  const metier = row['Métier']?.trim() || 'Non spécifié';

  // Validation et nettoyage du statut avec meilleure gestion
  let statut: LeadStatus = 'A contacter';
  if (row.Statut?.trim()) {
    const statutInput = row.Statut.trim();

    // Recherche exacte d'abord, puis insensible à la casse
    const exactMatch = VALID_STATUSES.find(s => s === statutInput);
    const caseInsensitiveMatch = VALID_STATUSES.find(s => s.toLowerCase() === statutInput.toLowerCase());

    if (exactMatch) {
      statut = exactMatch;
    } else if (caseInsensitiveMatch) {
      statut = caseInsensitiveMatch;
      console.log(`Ligne ${rowNumber}: Statut "${statutInput}" corrigé vers "${caseInsensitiveMatch}"`);
    } else {
      console.warn(`Ligne ${rowNumber}: Statut invalide "${statutInput}", utilisé "A contacter" par défaut`);
    }
  }

  // Nettoyage et formatage du téléphone
  const telephone = row['Téléphone']?.trim();
  let formattedPhone = telephone ? telephone.replace(/[\s\-\.\(\)]/g, '') : undefined;

  // Validation et formatage du téléphone français
  if (formattedPhone && !isValidFrenchPhone(formattedPhone)) {
    // Essayer de corriger automatiquement
    if (formattedPhone.startsWith('33') && formattedPhone.length === 11) {
      formattedPhone = '0' + formattedPhone.substring(2);
      console.log(`Ligne ${rowNumber}: Téléphone "${telephone}" corrigé vers "${formattedPhone}"`);
    } else if (formattedPhone.startsWith('+33') && formattedPhone.length === 12) {
      formattedPhone = '0' + formattedPhone.substring(3);
      console.log(`Ligne ${rowNumber}: Téléphone "${telephone}" corrigé vers "${formattedPhone}"`);
    } else {
      console.warn(`Ligne ${rowNumber}: Téléphone invalide "${telephone}" - format attendu: 0XXXXXXXXX`);
      formattedPhone = undefined; // Ne pas importer un téléphone invalide
    }
  }

  // Nettoyage de l'email
  const email = row.Email?.trim();
  if (email && !isValidEmail(email)) {
    console.warn(`Ligne ${rowNumber}: Email invalide "${email}"`);
  }

  // Nettoyage et validation du site web
  let siteWeb = row['Site Web']?.trim();
  if (siteWeb) {
    // Ajouter http:// si manquant et que ce n'est pas juste un nom de domaine simple
    if (!siteWeb.startsWith('http://') && !siteWeb.startsWith('https://') && siteWeb.includes('.')) {
      siteWeb = 'https://' + siteWeb;
      console.log(`Ligne ${rowNumber}: Site web "${row['Site Web']}" corrigé vers "${siteWeb}"`);
    }

    // Valider que c'est une URL valide
    if (siteWeb !== 'Aucun' && !isValidUrl(siteWeb)) {
      console.warn(`Ligne ${rowNumber}: Site web invalide "${row['Site Web']}"`);
      siteWeb = undefined;
    }
  }

  return {
    nom: row.Nom.trim(),
    telephone: formattedPhone,
    email: email || undefined,
    siteWeb: siteWeb || undefined,
    adresse: row.Adresse?.trim() || undefined,
    ville: row.Ville.trim(),
    codePostal: row['Code Postal']?.trim() || undefined,
    metier,
    motifSelection: row['Motif Sélection']?.trim() || 'Import Excel',
    statut,
    note: row.Note?.trim() || undefined,
    noteGoogle: row['Note Google'] ? parseFloat(String(row['Note Google'])) : undefined,
    nombreAvis: row['Nombre Avis'] ? parseInt(String(row['Nombre Avis'])) : undefined
  };
}

function isValidFrenchPhone(phone: string): boolean {
  // Regex pour numéro français
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(phone);
}

function isValidEmail(email: string): boolean {
  // Regex basique pour email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateExcelColumns(buffer: Buffer): { success: boolean; errors: string[]; warnings: string[] } {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    if (!workbook.SheetNames.length) {
      return {
        success: false,
        errors: ['Aucune feuille trouvée dans le fichier Excel'],
        warnings: []
      };
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!jsonData.length) {
      return {
        success: false,
        errors: ['Aucune donnée trouvée dans le fichier Excel'],
        warnings: []
      };
    }

    // Vérifier les colonnes attendues
    const headers = jsonData[0] as string[];

    // Colonnes obligatoires pour un import réussi
    const requiredColumns = ['Nom', 'Ville'];

    // Colonnes optionnelles mais recommandées
    const optionalColumns = [
      'Téléphone', 'Email', 'Site Web', 'Adresse', 'Code Postal',
      'Métier', 'Motif Sélection', 'Statut', 'Note', 'Note Google', 'Nombre Avis'
    ];

    // Vérifier les colonnes manquantes avec tolérance à la casse et aux espaces
    const normalizeColumn = (col: string) => col.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedHeaders = headers.map(normalizeColumn);

    const missingRequired = requiredColumns.filter(col =>
      !normalizedHeaders.includes(normalizeColumn(col))
    );

    const missingOptional = optionalColumns.filter(col =>
      !normalizedHeaders.includes(normalizeColumn(col))
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    // Erreurs pour colonnes obligatoires
    if (missingRequired.length > 0) {
      errors.push(`Colonnes obligatoires manquantes: ${missingRequired.join(', ')}`);
    }

    // Avertissements pour colonnes optionnelles
    if (missingOptional.length > 0) {
      warnings.push(`Colonnes optionnelles manquantes: ${missingOptional.join(', ')}`);
    }

    // Vérifier qu'il y a au moins quelques lignes de données
    if (jsonData.length < 2) {
      warnings.push('Le fichier ne contient qu\'une ligne d\'en-tête, aucune donnée à importer');
    } else if (jsonData.length === 2) {
      warnings.push('Le fichier ne contient qu\'une seule ligne de données');
    }

    return {
      success: missingRequired.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      errors: [`Erreur validation fichier: ${error instanceof Error ? error.message : String(error)}`],
      warnings: []
    };
  }
}
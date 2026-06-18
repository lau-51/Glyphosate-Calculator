export type AppMode = 'agri' | 'jardin' | 'weather' | 'safety' | 'ai' | 'dilution' | 'calendar' | 'drift' | 'exploitation' | 'help';

export interface Applicator {
  id: string;
  name: string;
  certiphyto: string;
}

export interface Parcelle {
  id: string;
  name: string;
  village: string;
  cru: string;
  surface: number; // in ha
  cepage: string;
}

export interface ParcelleGroup {
  id: string;
  name: string;
  parcelleIds: string[];
}

export interface ManualIftTreatment {
  id: string;
  date: string;
  parcelle: string;
  appliedDose: number; // L/ha
  productConcentration: number; // g/L
  notes?: string;
}

export interface ExploitationData {
  id: string;
  nom: string;
  agrement: string;
  applicators: Applicator[];
  parcelles: Parcelle[];
  groupements: ParcelleGroup[];
  hveCropType?: 'grandes_cultures' | 'viticulture' | 'arboriculture';
  manualIftTreatments?: ManualIftTreatment[];
}

export interface WeedPreset {
  id: string;
  name: string;
  description: string;
  dilutionPercent: number; // in % (e.g., 1.5, 2.5)
  icon: string;
  recommendation: string;
}

export interface AgriInputs {
  surface: number;             // Hectares (ha)
  doseProduct: number;         // L/ha or kg/ha
  volumeWater: number;         // L/ha
  tankCapacity: number;        // Liters (L)
  productConcentration: number;// g/L or g/kg (e.g. 360, 450, 480)
  ephyProductId?: string;      // Linked E-Phy product
  isDry?: boolean;             // True if g/kg (solid) instead of g/L (liquid)
  productName?: string;        // Product name
  activeIngredient?: string;   // Active substance
  ammNumber?: string;          // AMM identification number
  unit?: 'g/L' | 'g/kg';      // Current concentration unit
  reentryDelay?: string;       // DRE
  harvestDelay?: string;       // DAR
}

export interface AgriOutputs {
  totalProduct: number;        // L or kg
  totalWater: number;          // L
  totalBouillie: number;       // L
  numTanks: number;            // Full ratio
  fullTanksCount: number;      // Integer count
  hasPartialTank: boolean;
  partialTankWater: number;    // L
  partialTankProduct: number;  // L or kg
  productPerFullTank: number;  // L or kg
  waterPerFullTank: number;    // L
  autonomieCuve: number;       // ha covered by 1 full tank
}

export interface JardinInputs {
  surface: number;             // m²
  tankCapacity: number;        // L (range like 1L to 20L)
  weedType: string;            // annual, perennial, brush, total, custom
  dilutionPercent: number;     // in % (e.g. 1.5% = 15ml/L)
  coverageRate: number;        // m² treated with 1L of spray mix (default 10 m²/L)
  productConcentration: number;// g/L (e.g. 360, 450, 480, 500)
  ephyProductId?: string;      // Linked E-Phy product
  isDry?: boolean;             // True if g/kg (solid) instead of g/L (liquid)
  productName?: string;        // Product name
  activeIngredient?: string;   // Active substance
  ammNumber?: string;          // AMM identification number
  unit?: 'g/L' | 'g/kg';      // Current concentration unit
  reentryDelay?: string;       // DRE
  harvestDelay?: string;       // DAR
}

export interface JardinOutputs {
  totalBouillie: number;       // L
  totalProduct: number;        // ml or g
  totalWater: number;          // L
  numTanks: number;            // Rounded up count (integer)
  productPerFullTank: number;  // ml or g
  waterPerFullTank: number;    // L
  maxAreaPerTank: number;      // m²
  actualMixRequired: boolean;  // whether total needed is less than full tank capacity
}

export interface MetricDefinition {
  label: string;
  value: string;
  unit: string;
  desc: string;
}

export interface HistoricalFiche {
  id: string;
  dateGen: string;
  mode: 'agri' | 'jardin';
  fileName: string;
  pdfBase64: string;
  ficheInputs: {
    applicateur: string;
    parcelle: string;
    produitNom: string;
    date: string;
    zntRespect: boolean;
    epiComplet: boolean;
    tripleRincage: boolean;
    exploitationNom?: string;
    exploitationAgrement?: string;
  };
  weatherInput: {
    temp: number;
    wind: number;
    humidity: number;
  };
  details: {
    surface: string;
    totalProduct: string;
    totalWater: string;
    totalBouillie: string;
    rawSurface?: number;
    rawTotalProduct?: number;
    rawDoseProduct?: number;
    productConcentration?: number;
  };
}


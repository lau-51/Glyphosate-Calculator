export interface EPhyProduct {
  id: string;
  ammNumber: string;
  name: string;
  category: 'Herbicide' | 'Fongicide' | 'Insecticide' | 'Biocontrôle' | 'Adjuvant' | 'Autre';
  substanceName: string;
  concentration: number; // in g/L or g/kg
  unit: 'g/L' | 'g/kg';
  defaultDose: number; // L/ha or kg/ha
  defaultWaterVolume: number; // L/ha
  reentryDelay: string; // DRE
  harvestDelay: string; // DAR
  isDry: boolean;
  limitsByCrop: {
    grandes_cultures?: number; // in g active substance / ha / year
    viticulture?: number;
    arboriculture?: number;
  };
  ephyUrl: string;
  description: string;
}

export const EPHY_PRODUCTS: EPhyProduct[] = [
  {
    id: 'roundup-360',
    ammNumber: '2170327',
    name: 'Roundup Power 360',
    category: 'Herbicide',
    substanceName: 'Glyphosate',
    concentration: 360,
    unit: 'g/L',
    defaultDose: 2.5,
    defaultWaterVolume: 100,
    reentryDelay: '6 heures',
    harvestDelay: 'Exempt',
    isDry: false,
    limitsByCrop: {
      grandes_cultures: 1080,
      viticulture: 450,
      arboriculture: 900
    },
    ephyUrl: 'https://ephy.anses.fr/substance/glyphosate',
    description: 'Herbicide systémique de post-levée destiné au contrôle des adventices annuelles et vivaces.'
  },
  {
    id: 'bouillie-bordelaise',
    ammNumber: '2110191',
    name: 'Bouillie Bordelaise RSR',
    category: 'Biocontrôle',
    substanceName: 'Cuivre de la bouillie bordelaise',
    concentration: 200,
    unit: 'g/kg',
    defaultDose: 7.5,
    defaultWaterVolume: 400,
    reentryDelay: '6 heures',
    harvestDelay: '21 jours',
    isDry: true,
    limitsByCrop: {
      viticulture: 4000, // Regular EU limit of 4 kg Cu/ha/year averaged over 7 years
      arboriculture: 4000
    },
    ephyUrl: 'https://ephy.anses.fr/produit/bouillie-bordelaise-micronisee',
    description: 'Fongicide traditionnel à action préventive de contact, agréé en Agriculture Biologique pour lutter contre le mildiou.'
  },
  {
    id: 'thiovit-sulfur',
    ammNumber: '9550130',
    name: 'Thiovit Jet',
    category: 'Biocontrôle',
    substanceName: 'Soufre micronisé',
    concentration: 800,
    unit: 'g/kg',
    defaultDose: 7.5,
    defaultWaterVolume: 300,
    reentryDelay: '6 heures',
    harvestDelay: '5 jours',
    isDry: true,
    limitsByCrop: {
      viticulture: 10000,
      arboriculture: 12000
    },
    ephyUrl: 'https://ephy.anses.fr/produit/thiovit-jet',
    description: 'Fongicide préventif par sublimation gazeuse, efficace sur oïdium et exerçant une action secondaire limitatrice d\'acariens.'
  },
  {
    id: 'decis-protech',
    ammNumber: '2090123',
    name: 'Decis Protech',
    category: 'Insecticide',
    substanceName: 'Deltaméthrine',
    concentration: 15,
    unit: 'g/L',
    defaultDose: 0.5,
    defaultWaterVolume: 200,
    reentryDelay: '24 heures',
    harvestDelay: '7 jours',
    isDry: false,
    limitsByCrop: {
      grandes_cultures: 15,
      viticulture: 15,
      arboriculture: 20
    },
    ephyUrl: 'https://ephy.anses.fr/substance/deltamethrine',
    description: 'Insecticide agissant par contact et ingestion, doté d\'un effet de choc rapide sur pucerons, chenilles et coléoptères.'
  },
  {
    id: 'karate-zeon',
    ammNumber: '2010156',
    name: 'Karate Zeon',
    category: 'Insecticide',
    substanceName: 'Lambda-cyhalothrine',
    concentration: 100,
    unit: 'g/L',
    defaultDose: 0.075,
    defaultWaterVolume: 200,
    reentryDelay: '48 heures',
    harvestDelay: '14 jours',
    isDry: false,
    limitsByCrop: {
      grandes_cultures: 10,
      viticulture: 10,
      arboriculture: 15
    },
    ephyUrl: 'https://ephy.anses.fr/substance/lambda-cyhalothrine',
    description: 'Insecticide de contact formulé en micro-capsules pour une persistance d\'action et une sécurité d\'usage accrues.'
  },
  {
    id: 'serenade-max',
    ammNumber: '2080036',
    name: 'Serenade Max',
    category: 'Biocontrôle',
    substanceName: 'Bacillus subtilis strain QST 713',
    concentration: 156.8,
    unit: 'g/kg',
    defaultDose: 4.0,
    defaultWaterVolume: 500,
    reentryDelay: '6 heures',
    harvestDelay: 'Exempt',
    isDry: true,
    limitsByCrop: {}, // biocontrol micro-organics generally don't have tight chemical limits in g/ha
    ephyUrl: 'https://ephy.anses.fr/produit/serenade-max',
    description: 'Fongicide et bactéricide biologique de contact agissant par compétition spatiale et production d\'enzymes antibactériennes.'
  }
];

import { AgriInputs, AgriOutputs, JardinInputs, JardinOutputs, WeedPreset } from '../types';

export const WEED_PRESETS: WeedPreset[] = [
  {
    id: 'annual',
    name: 'Annuelles & Jeunes Pousses',
    description: 'Mauvaises herbes annuelles, plantain, sizeron jeune, mouron.',
    dilutionPercent: 1.5,
    icon: 'Leaf',
    recommendation: 'Dosage de 1.5% (15 ml de Roundup par litre d\'eau). Traiter avant la floraison.'
  },
  {
    id: 'perennial',
    name: 'Vivaces & Profondes',
    description: 'Chiendent, liseron des champs, chardons, pissenlits matures.',
    dilutionPercent: 2.5,
    icon: 'Sparkles',
    recommendation: 'Dosage de 2.5% (25 ml de Roundup par litre d\'eau). Traiter en période de croissance active.'
  },
  {
    id: 'brush',
    name: 'Friches & Broussailles',
    description: 'Ronces, genêts, orties, arbustes sauvages, lierre.',
    dilutionPercent: 3.5,
    icon: 'TreePine',
    recommendation: 'Dosage fort de 3.5% (35 ml de Roundup par litre d\'eau). Mouiller généreusement les feuilles.'
  },
  {
    id: 'total',
    name: 'Allées & Désherbage Total',
    description: 'Cours, allées gravillonnées, pavés, zones non cultivées.',
    dilutionPercent: 2.0,
    icon: 'Grid',
    recommendation: 'Dosage de 2.0% (20 ml de Roundup par litre d\'eau). Éviter le ruissellement vers les zones cultivées.'
  }
];

export const CONCENTRATION_OPTIONS = [
  { label: 'Standard (360 g/L de glyphosate)', value: 360, factor: 1.0 },
  { label: 'Concentré (450 g/L de glyphosate)', value: 450, factor: 0.8 }, // Needs 20% less volume
  { label: 'Super Concentré (480 g/L de glyphosate)', value: 480, factor: 0.75 }, // Needs 25% less volume
  { label: 'Ultra Concentré (500 g/L de glyphosate)', value: 500, factor: 0.72 } // Needs 28% less volume
];

/**
 * Perform agricultural sprayer computations
 */
export function calculateAgri(inputs: AgriInputs): AgriOutputs {
  const { surface, doseProduct, volumeWater, tankCapacity, productConcentration, isDry, ephyProductId } = inputs;

  // Base concentrations factors relative to standard 360g/L
  // ONLY scale if there is no ephyProductId (legacy) or if it's explicitly the roundup-360 product
  const isGlyphosateLegacy = !ephyProductId || ephyProductId === 'roundup-360';
  const concFactor = isGlyphosateLegacy ? (360 / (productConcentration || 360)) : 1.0;
  const adjustedDoseProduct = doseProduct * concFactor;

  const totalProduct = surface * adjustedDoseProduct;
  const totalBouillie = surface * volumeWater;
  
  // To avoid dividing by zero if inputs are incomplete
  const volumeHectareSafe = volumeWater || 1;
  const doseHectareSafe = adjustedDoseProduct || 0;

  const autonomieCuve = tankCapacity / volumeHectareSafe; 
  const numTanks = surface / (autonomieCuve || 1);
  const fullTanksCount = Math.floor(numTanks);
  const hasPartialTank = (numTanks - fullTanksCount) > 0.001;

  const productPerFullTank = tankCapacity * (doseHectareSafe / volumeHectareSafe);
  
  // Clean physically correct calculation: Dry powder does not displace water volume
  const waterPerFullTank = isDry ? tankCapacity : (tankCapacity - productPerFullTank);
  const totalWater = isDry ? totalBouillie : (totalBouillie - totalProduct);

  let partialTankWater = 0;
  let partialTankProduct = 0;

  if (hasPartialTank) {
    const remainingSurface = surface - (fullTanksCount * autonomieCuve);
    const partialTankBouillie = remainingSurface * volumeHectareSafe;
    partialTankProduct = remainingSurface * doseHectareSafe;
    // Dry powder does not displace water
    partialTankWater = isDry ? partialTankBouillie : (partialTankBouillie - partialTankProduct);
  }

  return {
    totalProduct: Number(totalProduct.toFixed(2)),
    totalWater: Number(totalWater.toFixed(2)),
    totalBouillie: Number(totalBouillie.toFixed(2)),
    numTanks: Number(numTanks.toFixed(2)),
    fullTanksCount,
    hasPartialTank,
    partialTankWater: Number(partialTankWater.toFixed(1)),
    partialTankProduct: Number(partialTankProduct.toFixed(1)),
    productPerFullTank: Number(productPerFullTank.toFixed(2)),
    waterPerFullTank: Number(waterPerFullTank.toFixed(2)),
    autonomieCuve: Number(autonomieCuve.toFixed(2))
  };
}

/**
 * Perform gardening sprayer computations (manual / knapsack)
 */
export function calculateJardin(inputs: JardinInputs): JardinOutputs {
  const { surface, tankCapacity, dilutionPercent, coverageRate, productConcentration, isDry, ephyProductId } = inputs;

  const isGlyphosateLegacy = !ephyProductId || ephyProductId === 'roundup-360';
  const conc = productConcentration || 360;
  const concFactor = isGlyphosateLegacy ? (360 / conc) : 1.0;
  const activePercent = dilutionPercent * concFactor;

  // coverageRate: m² per 1 Liter of bouillie. Usually 10m²/L, meaning for 100m² we need 10L.
  const rateSafe = coverageRate || 10;
  const totalBouillie = surface / rateSafe;
  
  // totalProduct in ml or g (1% = 10 ml/L or 10 g/L)
  const totalProduct = totalBouillie * (activePercent / 100) * 1000;
  
  // Dry powder doesn't displace liquid volume in knapsack
  const totalWater = isDry ? totalBouillie : (totalBouillie - (totalProduct / 1000)); 

  const productPerFullTank = tankCapacity * (activePercent / 100) * 1000;
  const waterPerFullTank = isDry ? tankCapacity : (tankCapacity - (productPerFullTank / 1000));

  const numTanksStr = (totalBouillie / tankCapacity).toFixed(2);
  const numTanksRaw = parseFloat(numTanksStr);
  const numTanks = Math.ceil(numTanksRaw);

  const maxAreaPerTank = tankCapacity * rateSafe;
  const actualMixRequired = totalBouillie < tankCapacity;

  return {
    totalBouillie: Number(totalBouillie.toFixed(2)),
    totalProduct: Number(totalProduct.toFixed(1)),
    totalWater: Number((totalWater > 0 ? totalWater : totalBouillie).toFixed(2)),
    numTanks,
    productPerFullTank: Number(productPerFullTank.toFixed(1)),
    waterPerFullTank: Number(waterPerFullTank.toFixed(2)),
    maxAreaPerTank: Number(maxAreaPerTank.toFixed(0)),
    actualMixRequired
  };
}

/**
 * Get spray advisory based on environmental conditions
 * Standard pesticide guidelines:
 * - Temp: ideal 12-25°C. Under 8°C formulation is inactive, over 25°C volatilization occurs.
 * - Wind: optimal < 12 km/h. Regulatory limit in France is 19 km/h (force 3 Beaufort).
 * - Humidity (Hygrométrie): optimal > 70% to prevent rapid drop drying, acceptable 50-70%, bad < 50%.
 */
export interface WeatherAdvisory {
  status: 'optimal' | 'warning' | 'forbidden';
  badgeColor: string;
  badgeBg: string;
  verdict: string;
  details: string[];
}

export function getWeatherAdvisory(temp: number, wind: number, humidity: number): WeatherAdvisory {
  const details: string[] = [];
  let score = 0; // 0 = perfect, >1 warning, >=5 forbidden

  // Temp check
  if (temp < 8) {
    score += 5;
    details.push('Température trop basse (< 8°C) : l\'absorption de l\'herbicide est bloquée par la plante.');
  } else if (temp < 12) {
    score += 1;
    details.push('Température un peu fraîche (8-12°C) : l\'action sera ralentie.');
  } else if (temp > 28) {
    score += 5;
    details.push('Température critique (> 28°C) : évaporation instantanée et gros risques de dérives volatiles.');
  } else if (temp > 25) {
    score += 2;
    details.push('Température élevée (25-28°C) : préférer un traitement aux heures fraîches.');
  } else {
    details.push('Température idéale (12-25°C) pour la pénétration du produit.');
  }

  // Wind check (In France, legal wind speed limit for spraying is 19 km/h)
  if (wind > 19) {
    score += 5;
    details.push('Vent supérieur à la limite légale (> 19 km/h) : pulvérisation interdite pour limiter la dérive.');
  } else if (wind > 12) {
    score += 2;
    details.push('Vent modéré (12-19 km/h) : risque de dispersion. Utilisez des buses anti-dérive.');
  } else if (wind < 3) {
    score += 1;
    details.push('Vent nul ou très faible (< 3 km/h) : attention aux risques d\'inversion thermique.');
  } else {
    details.push('Vent favorable (3-12 km/h) qui évite les dérives tout en brassant la bouillie.');
  }

  // Humidity check
  if (humidity < 50) {
    score += 2;
    details.push('Hygrométrie sèche (< 50%) : les gouttes sèchent trop vite et ne pénètrent pas dans les feuilles.');
  } else if (humidity > 95) {
    score += 1;
    details.push('Hygrométrie très élevée (> 95%) : risque d\'excès de rosée provoquant le lessivage.');
  } else {
    details.push('Hygrométrie parfaite (> 60%) favorisant le maintien des gouttelettes à l\'état liquide.');
  }

  if (score >= 5) {
    return {
      status: 'forbidden',
      badgeColor: 'text-red-700 border-red-200',
      badgeBg: 'bg-red-50',
      verdict: '⚠️ CONDITIONS DÉCONSEILLÉES / PULVÉRISATION INTERDITE',
      details
    };
  } else if (score >= 2) {
    return {
      status: 'warning',
      badgeColor: 'text-amber-700 border-amber-200',
      badgeBg: 'bg-amber-50',
      verdict: '⚠️ CONDITIONS SOUS VIGILANCE',
      details
    };
  } else {
    return {
      status: 'optimal',
      badgeColor: 'text-green-700 border-green-200',
      badgeBg: 'bg-green-50',
      verdict: '✅ CONDITIONS DE PULVÉRISATION OPTIMALES',
      details
    };
  }
}

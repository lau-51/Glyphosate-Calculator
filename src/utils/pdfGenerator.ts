import { jsPDF } from 'jspdf';
import { AgriInputs, AgriOutputs, JardinInputs, JardinOutputs } from '../types';

interface FicheInputs {
  applicateur: string;
  parcelle: string;
  produitNom: string;
  date: string;
  zntRespect: boolean;
  epiComplet: boolean;
  tripleRincage: boolean;
  exploitationNom?: string;
  exploitationAgrement?: string;
}

interface WeatherInput {
  temp: number;
  wind: number;
  humidity: number;
}

export function generateFichePDF(
  mode: 'agri' | 'jardin',
  ficheInputs: FicheInputs,
  agriInputs: AgriInputs,
  agriOutputs: AgriOutputs,
  jardinInputs: JardinInputs,
  jardinOutputs: JardinOutputs,
  weatherInput: WeatherInput
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Fonts & styles config
  const textGray = '#334155';
  const textDark = '#0f172a';
  const primaryColor = '#059669'; // Emerald-600

  // Draw a border around the page
  doc.setDrawColor(203, 213, 225); // slate-200
  doc.setLineWidth(0.5);
  doc.rect(8, 8, 194, 281);

  // Top header box
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.7);
  doc.rect(12, 12, 186, 32);

  // Header content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTRE DES APPLICATIONS PHYTOSANITAIRES', 16, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('CONFORME AUX ENJEUX DU PLAN ÉCOPHYTO II & CODE RURAL FRANÇAIS', 16, 27);
  if (ficheInputs.exploitationNom) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text(`EXPLOITATION : ${ficheInputs.exploitationNom.toUpperCase()} (N° Agrément : ${ficheInputs.exploitationAgrement || 'N/A'})`, 16, 32);
  } else {
    doc.text('ÉDITION NUMÉRIQUE SÉCURISÉE • AGRONOMIE PROFESSIONNELLE', 16, 32);
  }

  // Stamp badge top right
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setFillColor(240, 253, 250); // emerald-50
  doc.rect(138, 16, 54, 24, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('DOCUMENT CONFORME', 142, 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(6, 95, 70);
  doc.text('Réglementation LOI LABBÉ', 142, 28);
  doc.text('Généré via RoundupCalc v2.8', 142, 33);

  // Section 1: TRACEABILITY IDENTIFICATION
  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240); // slate-100
  doc.line(12, 49, 198, 49);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('1. IDENTIFICATION ET TRAÇABILITÉ DE L\'APPLICATION', 12, 55);

  // Table header box for Section 1
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(12, 59, 186, 38, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  // Coordinates for fields
  doc.text('APPLICATEUR / EXPLOITANT CERTIFIÉ :', 16, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(ficheInputs.applicateur || 'Non spécifié', 16, 71);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('RÉFÉRENCE DE LA PARCELLE / ZONE :', 108, 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(ficheInputs.parcelle || 'Non spécifiée', 108, 71);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('NOM COMMERCIAL DU PRODUIT :', 16, 82);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(ficheInputs.produitNom || 'Glyphosate équivalent', 16, 87);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATE DU TRAITEMENT :', 108, 82);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(ficheInputs.date || 'Non spécifiée', 108, 87);


  // Section 2: CALCULATIONS & MEASSUREMENTS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('2. DOSAGES ET CONSIGNE DE PRÉPARATION (Calcul Scientifique v2.8)', 12, 106);

  // Table structure
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(12, 110, 186, 68);

  // Table columns line
  doc.line(116, 110, 116, 178);

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(12, 110, 186, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PARAMÈTRE D\'APPLICATION', 16, 115);
  doc.text('CONSIGNE ET QUANTITÉ THÉORIQUE', 120, 115);
  doc.line(12, 118, 198, 118);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const rowH = 7.5;
  let currentY = 118;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Méthode de pulvérisation', 16, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(mode === 'agri' ? 'Tracteur agricole (Grande Culture)' : 'Pulvérisateur mobile à dos (Manuel)', 120, currentY + 5);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Surface totale du lot traitée', 16, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(mode === 'agri' ? `${agriInputs.surface} Hectares (ha)` : `${jardinInputs.surface} m²`, 120, currentY + 5);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Concentration de la formulation', 16, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(mode === 'agri' ? `${agriInputs.productConcentration} g/L (Glyphosate)` : `${jardinInputs.productConcentration} g/L (Glyphosate)`, 120, currentY + 5);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 4
  doc.setFont('helvetica', 'bold');
  doc.text('Volume total d\'Eau Claire requis', 16, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(mode === 'agri' ? `${agriOutputs.totalWater} Litres` : `${jardinOutputs.totalWater} Litres`, 120, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 5
  doc.setFont('helvetica', 'bold');
  doc.text('Volume total d\'Herbicide Pur requis', 16, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(mode === 'agri' ? `${agriOutputs.totalProduct} Litres` : `${jardinOutputs.totalProduct} ml`, 120, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 6
  doc.setFont('helvetica', 'bold');
  doc.text('Volume total de Bouillie (Mélange)', 16, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(mode === 'agri' ? `${agriOutputs.totalBouillie} Litres` : `${jardinOutputs.totalBouillie} Litres`, 120, currentY + 5);
  currentY += rowH;
  doc.line(12, currentY, 198, currentY);

  // Row 7 (Plan)
  doc.setFont('helvetica', 'bold');
  doc.text('Plan de remplissage (recharges)', 16, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  if (mode === 'agri') {
    doc.text(`${agriOutputs.numTanks} cuve(s) (${agriOutputs.fullTanksCount} pleine(s) de ${agriInputs.tankCapacity}L)`, 120, currentY + 5);
  } else {
    doc.text(`${jardinOutputs.numTanks} cycle(s) de cuve de ${jardinInputs.tankCapacity}L`, 120, currentY + 5);
  }
  doc.setTextColor(51, 65, 85);


  // Section 3: DEPLOYMENT CHRONOLOGY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('3. INSTRUCTIONS CHRONOLOGIQUES DE CUVE (SÉCURITÉ & RESPECT)', 12, 186);

  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(254, 254, 255);
  doc.rect(12, 190, 186, 42, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  let stepY = 195;
  doc.text('1. Verser exactly 50% du volume d\'eau claire requis dans le réservoir de l\'appareil.', 16, stepY);
  
  stepY += 5.5;
  doc.text('2. Activer l\'agitateur mécanique ou remuer activement de manière sécurisée.', 16, stepY);

  stepY += 5.5;
  if (mode === 'agri') {
    doc.text(`3. Verser lentement ${agriOutputs.productPerFullTank} L de produit (ou ${agriOutputs.partialTankProduct} L pour la cuve partielle).`, 16, stepY);
  } else {
    doc.text(`3. Verser précisément ${jardinOutputs.productPerFullTank} ml d'herbicide concentré dans l'eau de la cuve de ${jardinInputs.tankCapacity}L.`, 16, stepY);
  }

  stepY += 5.5;
  doc.text('4. Faire un triple rinçage à l\'eau claire des bidons vides et reverser l\'eau de rinçage en cuve.', 16, stepY);

  stepY += 5.5;
  if (mode === 'agri') {
    doc.text(`5. Compléter à 100% avec de l\'eau pour atteindre la graduation (${agriInputs.tankCapacity} L).`, 16, stepY);
  } else {
    doc.text(`5. Compléter à 100% jusqu\'au repère de graduation de niveau de bouillie (${jardinInputs.tankCapacity} L).`, 16, stepY);
  }

  stepY += 5.5;
  doc.text('6. Pulvériser en continu sur les cibles. Ne pas garder de reste de bouillie préparée dans la cuve.', 16, stepY);


  // Section 4: CLIMATOLOGY & REGULATORY GATEKEEPER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text('4. CONDITIONS ENVIRONNEMENTALES & RESPECT DES SEUILS LOI LABBÉ', 12, 240);

  doc.rect(12, 244, 186, 22);
  doc.line(100, 244, 100, 266);

  // Left column: weather
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CONDITIONS CLIMATIQUES SAISIES :', 16, 249);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`- Température de la parcelle : ${weatherInput.temp} °C`, 16, 254);
  doc.text(`- Vitesse moyenne du vent : ${weatherInput.wind} km/h ${weatherInput.wind > 19 ? '(BLOCAGE LÉGAL)' : ''}`, 16, 259);
  doc.text(`- Taux d\'hygrométrie : ${weatherInput.humidity} % d\'humidité`, 16, 264);

  // Right column: checklists
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('ENGAGEMENTS DE SÉCURITÉ EXPLOITANT :', 104, 249);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`[${ficheInputs.zntRespect ? 'X' : ' '}] respect de la zone de non-traitement (ZNT) 5m`, 104, 254);
  doc.text(`[${ficheInputs.epiComplet ? 'X' : ' '}] port obligatoire des Équipements de Protection (EPI)`, 104, 259);
  doc.text(`[${ficheInputs.tripleRincage ? 'X' : ' '}] triple rinçage obligatoire des flacons de produit vide`, 104, 264);


  // Footer branding and signature
  doc.line(12, 274, 198, 274);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Note légale : Ce document est une aide à l\'enregistrement réglementaire des pratiques agricoles.', 12, 279);
  doc.text('L\'exploitant demeure seul pénalement responsable de la conformité de son traitement et de l\'entretien matériel.', 12, 283);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Signature de l\'applicateur qualifié :', 134, 279);
  doc.line(134, 285, 186, 285);

  return doc;
}

export async function shareFichePDF(
  mode: 'agri' | 'jardin',
  ficheInputs: FicheInputs,
  agriInputs: AgriInputs,
  agriOutputs: AgriOutputs,
  jardinInputs: JardinInputs,
  jardinOutputs: JardinOutputs,
  weatherInput: WeatherInput
): Promise<{ success: boolean; method: 'share' | 'download' | 'error'; error?: string; pdfBase64?: string }> {
  try {
    const doc = generateFichePDF(
      mode,
      ficheInputs,
      agriInputs,
      agriOutputs,
      jardinInputs,
      jardinOutputs,
      weatherInput
    );

    const pdfBlob = doc.output('blob');
    const pdfBase64 = doc.output('datauristring');
    const safeParcelleName = (ficheInputs.parcelle || 'parcelle').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `fiche-traitement-${safeParcelleName}-${ficheInputs.date || 'date'}.pdf`;

    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Fiche de Traitement Phytosanitaire - ${ficheInputs.parcelle || 'Parcelle'}`,
          text: `Veuillez trouver ci-joint la fiche de traitement réglementaire pour la parcelle "${ficheInputs.parcelle || 'N/A'}" émise le ${ficheInputs.date}.`
        });
        return { success: true, method: 'share', pdfBase64 };
      } catch (shareErr: any) {
        // Handle Cancel or Abort action by web share UI
        if (shareErr.name === 'AbortError' || shareErr.message?.includes('share canceled')) {
          return { success: false, method: 'share', error: 'partage_annule' };
        }
        console.warn('[Web Share] Failed, falling back to download:', shareErr);
      }
    }

    // Default download fallback
    doc.save(fileName);
    return { success: true, method: 'download', pdfBase64 };
  } catch (err: any) {
    console.error('[jsPDF Share] Critical failure:', err);
    return { success: false, method: 'error', error: err.message || String(err) };
  }
}

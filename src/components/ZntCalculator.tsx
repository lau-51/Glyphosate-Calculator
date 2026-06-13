import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Wind, 
  Layers, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  XOctagon, 
  ArrowRight,
  Info,
  Compass,
  Building2
} from 'lucide-react';
import { ExploitationData } from '../types';

interface ZntCalculatorProps {
  isDarkMode: boolean;
  currentWindSpeed: number; // to sync with current weather input
  onApplyZntToFiche?: (zntValue: number) => void; // Callback to apply calculated ZNT
  isProMode?: boolean;
  exploitationData?: ExploitationData;
}

export default function ZntCalculator({ 
  isDarkMode, 
  currentWindSpeed, 
  onApplyZntToFiche,
  isProMode = false,
  exploitationData
}: ZntCalculatorProps) {
  // Inputs state
  const [wind, setWind] = useState<number>(currentWindSpeed || 12);
  const [height, setHeight] = useState<number>(50); // height of boom in cm
  const [nozzleType, setNozzleType] = useState<string>('anti_drift_75');
  const [culture, setCulture] = useState<string>('basses_grandes');
  const [selectedParcelLabel, setSelectedParcelLabel] = useState<string>('');

  // Synchronize with parent wind when changed
  useEffect(() => {
    if (currentWindSpeed !== undefined) {
      setWind(currentWindSpeed);
    }
  }, [currentWindSpeed]);

  const NOZZLE_PRESETS = [
    { id: 'standard', name: 'Buse Fente Classique', reduction: 0, description: 'Aucune limitation de dérive (0% réduction)' },
    { id: 'low_drift_50', name: 'Buse Basse Dérive (-50%)', reduction: 50, description: 'Limitation modérée, pression stabilisée' },
    { id: 'anti_drift_75', name: 'Buse Injection d\'Air (-75%)', reduction: 75, description: 'Homologuée ZNT standard, dérive fortement réduite' },
    { id: 'anti_drift_90', name: 'Buse Injection d\'Air Ultra (-90%)', reduction: 90, description: 'Recommandée conditions limites, dérive minimale' },
  ];

  // Calculations based on scientific models
  const isIllegal = wind > 19; // Legal limit in France: 19 km/h

  // Raw drift index calculation before nozzle reduction (indicative)
  const baseDrift = wind * (height / 50) * (culture === 'vignes_arbo' ? 1.4 : 1.0);
  
  // Calculate recommended safety distance
  let rawDistance = 0;
  if (culture === 'basses_grandes') {
    const baseZnt = 5; // standard legal minimum
    const extraWind = wind > 10 ? (wind - 10) * 0.9 : 0;
    const extraHeight = height > 50 ? (height - 50) * 0.15 : 0;
    rawDistance = baseZnt + extraWind + extraHeight;
  } else {
    // vine/arboriculture has higher vertical spray drift
    const baseZnt = 20;
    const extraWind = wind > 8 ? (wind - 8) * 1.6 : 0;
    rawDistance = baseZnt + extraWind;
  }

  // Apply reduction
  const selectedNozzleObj = NOZZLE_PRESETS.find(n => n.id === nozzleType) || NOZZLE_PRESETS[0];
  const reductionFactor = (100 - selectedNozzleObj.reduction) / 100;
  
  // Final calculated ZNT recommendation. Standard national regulations enforce 5m minimum for most products anyway.
  const recommendedZnt = isIllegal ? 0 : Math.ceil(Math.max(5, rawDistance * reductionFactor));

  // Determine hazard category
  const driftRiskPercent = Math.min(100, Math.round(baseDrift * reductionFactor * 4));
  let hazardLevel: 'faible' | 'modere' | 'eleve' | 'critique' = 'faible';
  if (isIllegal) {
    hazardLevel = 'critique';
  } else if (driftRiskPercent > 60) {
    hazardLevel = 'eleve';
  } else if (driftRiskPercent > 25) {
    hazardLevel = 'modere';
  }

  return (
    <div className={`p-6 rounded-2xl border ${
      isDarkMode 
        ? 'bg-slate-950/40 border-slate-800 shadow-inner text-white' 
        : 'bg-white border-slate-200 shadow-md text-slate-800'
    } transition-all duration-300`}>
      
      {/* Title */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-x-2">
          <div className="w-9 h-9 bg-teal-500/10 text-teal-500 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display">Calculateur Dynamique de Dérive & Risque ZNT</h3>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Selon les recommandations d'épandage de l'Arrêté Ministériel du 4 mai 2017 & plan Écophyto.
            </p>
          </div>
        </div>
        
        {/* Quick Sync Button with live Weather Station */}
        <button
          type="button"
          onClick={() => setWind(currentWindSpeed)}
          className={`text-[9px] px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-x-1 transition-all ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
          title="Synchroniser avec le vent mesuré sur la station météo"
        >
          <Wind className="w-3 h-3 text-teal-500" />
          <span>Synchroniser vent ({currentWindSpeed} km/h)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-4">

          {/* Pro Mode parcel selector for Drift */}
          {isProMode && exploitationData && (exploitationData.parcelles.length > 0 || exploitationData.groupements.length > 0) && (
            <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <div className="flex items-center gap-x-1.5 text-[10px] uppercase font-mono font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <span>Sélecteur Pro de Parcelle (Ajustement de cultures)</span>
              </div>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedParcelLabel('');
                    return;
                  }
                  
                  if (val.startsWith('p-')) {
                    const id = val.replace('p-', '');
                    const p = exploitationData.parcelles.find(item => item.id === id);
                    if (p) {
                      const txt = `${p.cepage || ''} ${p.name || ''} ${p.cru || ''}`.toLowerCase();
                      const vineKeywords = ['pinot', 'chardonnay', 'cabernet', 'merlot', 'syrah', 'vigne', 'cru', 'cépage', 'cepage', 'sauvignon', 'gamay', 'riesling', 'grenache', 'cinsault'];
                      const isVine = vineKeywords.some(kw => txt.includes(kw)) || (p.cepage && p.cepage.trim().length > 0);
                      
                      setCulture(isVine ? 'vignes_arbo' : 'basses_grandes');
                      setSelectedParcelLabel(`📍 Parcelle "${p.name}" (${p.surface} ha, Cépage: ${p.cepage || 'Non spécifié'}) ${isVine ? 'identifiée comme Vigne' : 'identifiée comme Culture Basse'}`);
                    }
                  } else if (val.startsWith('g-')) {
                    const id = val.replace('g-', '');
                    const g = exploitationData.groupements.find(item => item.id === id);
                    if (g) {
                      setCulture('vignes_arbo');
                      setSelectedParcelLabel(`📍 Groupement "${g.name}" sélectionné.`);
                    }
                  }
                }}
                className={`w-full p-2.5 rounded-xl border text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-medium ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-850 text-slate-300' 
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
                defaultValue=""
              >
                <option value="">-- Choisir Parcelle / Groupement pour configurer la culture --</option>
                {exploitationData.parcelles.length > 0 && (
                  <optgroup label="Parcelles">
                    {exploitationData.parcelles.map(p => (
                      <option key={p.id} value={`p-${p.id}`}>{p.name} ({p.surface} ha, Cépage: {p.cepage || 'N/A'})</option>
                    ))}
                  </optgroup>
                )}
                {exploitationData.groupements.length > 0 && (
                  <optgroup label="Groupements">
                    {exploitationData.groupements.map(g => (
                      <option key={g.id} value={`g-${g.id}`}>{g.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {selectedParcelLabel && (
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium font-sans mt-2 animate-fade-in">
                  {selectedParcelLabel}
                </p>
              )}
            </div>
          )}
          
          {/* Grid of basic inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Culture / Device selector */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Type de Culture
              </label>
              <select
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs text-left focus:ring-1 focus:ring-teal-500 focus:outline-hidden ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="basses_grandes">Cultures basses (Standard, Rampe horizontale)</option>
                <option value="vignes_arbo">Vignes & Arboriculture (Atomiseur vertical)</option>
              </select>
            </div>

            {/* Nozzle selector */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Type de Buse / Réduction de Dérive
              </label>
              <select
                value={nozzleType}
                onChange={(e) => setNozzleType(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs text-left focus:ring-1 focus:ring-teal-500 focus:outline-hidden ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {NOZZLE_PRESETS.map((nozzle) => (
                  <option key={nozzle.id} value={nozzle.id}>
                    {nozzle.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Wind slider */}
            <div className="p-3.5 rounded-xl border space-y-2.5 bg-slate-500/5 border-slate-500/10">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-350' : 'text-slate-600'} flex items-center gap-1`}>
                  <Wind className="w-3.5 h-3.5 text-sky-500" />
                  Vitesse du vent
                </span>
                <span className={`text-xs font-mono font-bold ${wind > 19 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {wind} km/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="1"
                value={wind}
                onChange={(e) => setWind(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                <span>0 km/h</span>
                <span>12 km/h</span>
                <span className="text-red-400">19 km/h (Critique)</span>
                <span>35 km/h</span>
              </div>
            </div>

            {/* Height slider (only make sense for horizontal booms) */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 bg-slate-500/5 border-slate-500/10 transition-all ${
              culture === 'vignes_arbo' ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-350' : 'text-slate-600'} flex items-center gap-1`}>
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
                  Hauteur de rampe
                </span>
                <span className="text-xs font-mono font-bold text-teal-500">
                  {culture === 'vignes_arbo' ? 'N/A' : `${height} cm`}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="5"
                value={height}
                disabled={culture === 'vignes_arbo'}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                <span>30 cm (Ras)</span>
                <span>50 cm (Optimal)</span>
                <span>80 cm (Moyen)</span>
                <span>120 cm (Critique)</span>
              </div>
            </div>
          </div>

          {/* Preset details info string */}
          <div className={`p-2.5 rounded-xl text-[10px] flex items-center gap-x-2 ${
            isDarkMode ? 'bg-slate-900/60 text-slate-400' : 'bg-slate-50 text-slate-500'
          }`}>
            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              <strong>Principe actif :</strong> {selectedNozzleObj.description}. Préférer une rampe positionnée à exactement <strong>50 cm</strong> au-dessus de la cible pour réduire l'exposition directe aux turbulences de l'air.
            </span>
          </div>

        </div>

        {/* Dynamic Graphic Gauge / Result Column */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className={`p-4 rounded-xl border h-full flex flex-col justify-between ${
            isIllegal 
              ? 'bg-rose-500/5 border-rose-500/20' 
              : hazardLevel === 'eleve' 
              ? 'bg-amber-500/5 border-amber-500/20' 
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            
            {/* Verdict Display */}
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest font-mono block mb-1 ${
                isIllegal ? 'text-red-500' : 'text-slate-500'
              }`}>
                {isIllegal ? '❌ BLOCAGE RÉGLEMENTAIRE' : '🛡️ ANALYSE DU RISQUE DE DÉRIVE'}
              </span>

              {isIllegal ? (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-x-1.5 text-red-600 dark:text-red-400 font-bold text-xs uppercase">
                    <XOctagon className="w-4.5 h-4.5 shrink-0" />
                    <span>TRAITMENT ABSOLUMENT INTERDIT</span>
                  </div>
                  <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-350' : 'text-slate-600'}`}>
                    Le vent mesuré ({wind} km/h) excède la limite légale française stricte de <strong>19 km/h</strong> (Arrêté du 4 mai 2017). Risque de pollution généralisée du voisinage et d'asphyxie biologique des cours d'eau.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-x-1.5 font-bold text-xs">
                    {hazardLevel === 'faible' ? (
                      <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-x-1">
                        <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                        <span>DÉRIVE MINIMISÉE / SÉCURISÉE</span>
                      </div>
                    ) : (
                      <div className="text-amber-600 dark:text-amber-400 flex items-center gap-x-1">
                        <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                        <span>SÉCURITÉ LIMITROPHE CRITIQUE</span>
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-350' : 'text-slate-600'}`}>
                    {hazardLevel === 'faible' 
                      ? "Configuration idéale pour un épandage ciblé. Les micro-gouttelettes générées sont assez lourdes pour se fixer rapidement sans polluer les parcelles adjacentes."
                      : "Le vent ou la hauteur accentuent la dérive. Pour votre sécurité et celle du littoral, augmentez impérativement la distance de recul des plans d'eau."
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Raw Drift Risk Index percentage bar */}
            {!isIllegal && (
              <div className="my-3 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold font-mono">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-550'}>NIVEAU DE DÉRIVE EN PARCELLE</span>
                  <span className={
                    hazardLevel === 'eleve' ? 'text-amber-500' : 'text-emerald-500'
                  }>
                    {driftRiskPercent}% d'instabilité locale
                  </span>
                </div>
                <div className="w-full bg-slate-205 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      hazardLevel === 'eleve' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${driftRiskPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 leading-none">
                  <span>Micro-vaporisation stable</span>
                  <span>Limites tolérées</span>
                </div>
              </div>
            )}

            {/* Recommended ZNT distance badge view */}
            <div className={`mt-3 p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
              isIllegal
                ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                : 'bg-emerald-600/10 border-emerald-600/20 text-emerald-700 dark:text-emerald-400'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                {isIllegal ? "ZNT Réglementaire Recommandée" : "Distance de Sécurité Conseillée des Cours d'Eau"}
              </span>
              
              <div className="flex items-baseline gap-x-1.5 my-1 justify-center">
                <span className="text-3xl font-extrabold font-mono tracking-tight">
                  {isIllegal ? '—' : `${recommendedZnt}`}
                </span>
                <span className="text-sm font-bold">{isIllegal ? '' : 'mètres'}</span>
              </div>

              {!isIllegal && (
                <div className="space-y-1">
                  <span className={`text-[9px] block ${isDarkMode ? 'text-slate-300' : 'text-slate-500'} italic font-sans`}>
                    (Code Rural : <strong>{recommendedZnt === 5 ? 'ZNT légale minimale tolérée de 5m' : 'ZNT élargie de sécurité'}</strong>)
                  </span>
                  
                  {onApplyZntToFiche && (
                    <button
                      type="button"
                      onClick={() => onApplyZntToFiche(recommendedZnt)}
                      className="mt-2 text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded-lg transition-all shadow-xs inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <span>Reporter cette ZNT sur la Fiche</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

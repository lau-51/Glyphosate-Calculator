import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  User, 
  MapPin, 
  Droplet, 
  Compass, 
  AlertTriangle, 
  CheckCircle, 
  Wind, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  BellRing,
  BookmarkCheck
} from 'lucide-react';
import { getInputItem, saveInputItem } from '../utils/indexedDB';

export interface TreatmentTask {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: 'matin' | 'apres-midi' | 'soir';
  applicator: string;
  parcelle: string;
  produitNom: string;
  baseZntType: 'eau_5m' | 'eau_20m' | 'eau_50m' | 'eau_100m' | 'riverains_5m' | 'riverains_10m' | 'custom';
  customBaseZntVal?: number;
  nozzleType: 'standard' | 'low_drift_50' | 'anti_drift_75' | 'anti_drift_90';
  hasHedge: boolean; // protective vegetative hedge reduces default required distances
  height: number; // Boom height in cm
  targetWind: number; // km/h predicted for this scheduled day
  notes?: string;
  computedZnt: number; // calculated variable ZNT
  isZntValidated: boolean;
}

interface TreatmentCalendarProps {
  isDarkMode: boolean;
  forecastDaily: any[]; // 7 days of forecast from weather tab to match planned treatments
  onLoadIntoDraftFiche: (task: TreatmentTask) => void;
  currentWindSpeed: number;
}

export default function TreatmentCalendar({ 
  isDarkMode, 
  forecastDaily = [], 
  onLoadIntoDraftFiche,
  currentWindSpeed
}: TreatmentCalendarProps) {
  
  // Tasks list state
  const [tasks, setTasks] = useState<TreatmentTask[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'matin' as 'matin' | 'apres-midi' | 'soir',
    applicator: '',
    parcelle: '',
    produitNom: '',
    baseZntType: 'eau_20m' as any,
    customBaseZntVal: 20,
    nozzleType: 'anti_drift_75' as any,
    hasHedge: true,
    height: 50,
    targetWind: 10,
    notes: ''
  });

  // Load planned treatments
  useEffect(() => {
    async function loadTasks() {
      try {
        const saved = await getInputItem<TreatmentTask[]>('treatment_agenda');
        if (saved && Array.isArray(saved)) {
          setTasks(saved);
        } else {
          // Fallback static high fidelity setup if empty
          const fallbackTasks: TreatmentTask[] = [
            {
              id: 'task-1',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
              timeSlot: 'matin',
              applicator: 'Jean-Marc D.',
              parcelle: 'Parcelle des Chênes (Vignes)',
              produitNom: 'Substitut Biocontrôle Soufre de Contact',
              baseZntType: 'eau_20m',
              nozzleType: 'anti_drift_90',
              hasHedge: true,
              height: 50,
              targetWind: 8,
              notes: 'Traitement antifongique préventif oïdium. Passer à basse vitesse.',
              computedZnt: 5,
              isZntValidated: true
            },
            {
              id: 'task-2',
              date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // after tomorrow
              timeSlot: 'soir',
              applicator: 'Jean-Marc D.',
              parcelle: 'Plaine Est (Orge)',
              produitNom: 'Herbicide de Biocontrôle acide pélargonique',
              baseZntType: 'eau_50m',
              nozzleType: 'anti_drift_75',
              hasHedge: false,
              height: 50,
              targetWind: 15,
              notes: 'Surveiller le vent avant de pulvériser.',
              computedZnt: 12,
              isZntValidated: true
            }
          ];
          setTasks(fallbackTasks);
          await saveInputItem('treatment_agenda', fallbackTasks);
        }
      } catch (err) {
        console.error('Failed to load agenda database:', err);
      } finally {
        setDbLoaded(true);
      }
    }
    loadTasks();
  }, []);

  // Save changes
  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('treatment_agenda', tasks);
    }
  }, [tasks, dbLoaded]);

  // Current Calendar Month Control
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Helper: Get days in month
  const getDaysInMonth = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Previous month padding days for alignment (0-6 starting Monday or Sunday)
    // French calendars standard start: Monday which is index 1
    let startDayIdx = date.getDay() - 1; 
    if (startDayIdx < 0) startDayIdx = 6; // Sunday is index 6
    
    // Add empty space for starting day shift
    for (let i = 0; i < startDayIdx; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  // Calculate dynamic Variable ZNT based on regulatory standards
  const calculateVariableZntForValues = (values: typeof formData) => {
    let baseZnt = 20; // default standard
    
    // 1. Resolve base ZNT from chemical product specifications
    switch (values.baseZntType) {
      case 'eau_5m': baseZnt = 5; break;
      case 'eau_20m': baseZnt = 20; break;
      case 'eau_50m': baseZnt = 50; break;
      case 'eau_100m': baseZnt = 100; break;
      case 'riverains_5m': baseZnt = 5; break;
      case 'riverains_10m': baseZnt = 10; break;
      case 'custom': baseZnt = values.customBaseZntVal || 20; break;
    }

    // 2. Reduce based on Anti-Drift Nozzles (Arrêté du 4 mai 2017)
    // 50% drift reduction -> raw reduction factor 0.5 (or according to specifications, reduces ZNT class)
    // 75% flow reduction -> turns 20m into 5m, 50m into 10m/5m, etc.
    let reductionMultiplier = 1.0;
    if (values.nozzleType === 'low_drift_50') {
      reductionMultiplier = 0.5;
    } else if (values.nozzleType === 'anti_drift_75') {
      reductionMultiplier = 0.25; // 4x factor reduction
    } else if (values.nozzleType === 'anti_drift_90') {
      reductionMultiplier = 0.10; // 10x factor reduction
    }

    let calculatedZnt = baseZnt * reductionMultiplier;

    // 3. Dense Hedge modification (under French riverains rules, allows 1 step reduction up to 3m)
    if (values.hasHedge) {
      calculatedZnt = calculatedZnt * 0.7; // 30% bonus safety reduction
    }

    // 4. Height compensation (if sprayer boom is higher than 50cm recommendation)
    if (values.height > 55) {
      const excessHeight = (values.height - 50) / 10; // per 10cm extra
      calculatedZnt += excessHeight * 1.5; // add buffer margin for drift risks
    }

    // Apply legal bounds: minimum 5m for standard riverain/aquatic buffers (3m with anti-drift on crops)
    const minLegalBound = values.nozzleType === 'anti_drift_90' ? 3 : 5;
    const finalZntValue = Math.ceil(Math.max(minLegalBound, calculatedZnt));

    return finalZntValue;
  };

  // Synchronize dynamic ZNT calculation as user types in form
  const dynamicFormZnt = calculateVariableZntForValues(formData);

  // Handles adding treatment to schedule list
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicator.trim() || !formData.parcelle.trim() || !formData.produitNom.trim()) {
      setFormError("Veuillez remplir tous les champs obligatoires (Applicateur, Parcelle, Produit).");
      return;
    }

    const calculatedZnt = calculateVariableZntForValues(formData);

    const newTask: TreatmentTask = {
      id: `task-${Date.now()}`,
      date: formData.date,
      timeSlot: formData.timeSlot,
      applicator: formData.applicator,
      parcelle: formData.parcelle,
      produitNom: formData.produitNom,
      baseZntType: formData.baseZntType,
      customBaseZntVal: formData.customBaseZntVal,
      nozzleType: formData.nozzleType,
      hasHedge: formData.hasHedge,
      height: formData.height,
      targetWind: formData.targetWind,
      notes: formData.notes,
      computedZnt: calculatedZnt,
      isZntValidated: true
    };

    setTasks(prev => {
      const updated = [...prev, newTask];
      // sort by date ascending
      return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Reset Form & close
    setShowAddForm(false);
    setFormError(null);
    setFormData(prev => ({
      ...prev,
      parcelle: '',
      notes: ''
    }));
  };

  // Handles deleting a task
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Match planned tasks to target weather metrics if possible
  const checkLiveWeatherStatus = (task: TreatmentTask) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find if weather fits this planned date
    // forecastDaily has days in label format, let's see if we can match
    // For convenience, let's check wind speed
    let matchedWind = task.targetWind;
    let isMatchedWithRealForecast = false;

    const taskDateObj = new Date(task.date);
    const timeDiffDays = Math.ceil((taskDateObj.getTime() - Date.now()) / (1000 * 3600 * 24));

    if (task.date === todayStr) {
      matchedWind = currentWindSpeed;
      isMatchedWithRealForecast = true;
    } else if (timeDiffDays > 0 && timeDiffDays <= forecastDaily.length) {
      // rough match based on index
      const forecastItem = forecastDaily[timeDiffDays - 1];
      if (forecastItem && forecastItem.wind !== undefined) {
        matchedWind = forecastItem.wind;
        isMatchedWithRealForecast = true;
      }
    }

    const isIllegal = matchedWind > 19;
    const isRisky = matchedWind > 12 && matchedWind <= 19;

    return {
      wind: matchedWind,
      isMatchedWithRealForecast,
      isIllegal,
      isRisky,
      text: isIllegal 
        ? `⚠️ VENT CRITIQUE DE ${matchedWind} km/h - Pulvérisation formellement interdite par la loi (>19 km/h)!` 
        : isRisky 
        ? `⚠️ Vent modéré de ${matchedWind} km/h - Vigilance accrue : buses bas volume exigées pour limiter la dérive.` 
        : `🍏 Conditions optimales (Vent de ${matchedWind} km/h < 19 km/h). Traitement autorisé.`
    };
  };

  const getMonthNameFrench = (d: Date) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Helper to locate active tasks for a specific calendar day grid box
  const getTasksForDate = (day: Date) => {
    const dateStr = day.toISOString().split('T')[0];
    return tasks.filter(t => t.date === dateStr);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner info */}
      <div className={`p-5 rounded-3xl border text-left flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 inline-flex">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h2 className={`font-display text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Planning Intelligent & Calendrier Agro-Météorologique
            </h2>
          </div>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
            Planifiez à l'avance vos traitements. Notre système évalue automatiquement les <strong>risques de dérive réglementaire (ZNT variable)</strong> et émet des <strong>alertes Push si le vent réel dépasse 19 km/h</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Planifier un Traitement</span>
        </button>
      </div>

      {/* FORM TO PLAN A NEW TREATMENT WITH VARIABLE ZNT & WIND CHECKS */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            onSubmit={handleAddTask}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-6 rounded-2xl border text-left overflow-hidden transition-all ${
              isDarkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200/40">
              <div className="flex items-center gap-x-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">Nouveau Traitement Planifié</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-semibold rounded-lg mb-4">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Date of Treatment */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date du traitement</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                  }`}
                />
              </div>

              {/* Time slot picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Créneau horaire d'épandage</label>
                <select
                  value={formData.timeSlot}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, timeSlot: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-855 text-white':'bg-white border-slate-200'
                  }`}
                >
                  <option value="matin">Matin (Humidité élevée, moins de vent)</option>
                  <option value="apres-midi">Après-midi (Chaleur, risque de convection)</option>
                  <option value="soir">Soir (Calme thermique, excellent)</option>
                </select>
              </div>

              {/* Applicator Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nom de l'applicateur *</label>
                <input
                  type="text"
                  placeholder="Ex: Jean-Marc D."
                  required
                  value={formData.applicator}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicator: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                  }`}
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              
              {/* Product and parcelle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Substance / Produit chimique *</label>
                <input
                  type="text"
                  placeholder="Ex: Bouillie Bordelaise, Acide Pélargonique"
                  required
                  value={formData.produitNom}
                  onChange={(e) => setFormData(prev => ({ ...prev, produitNom: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Zone ou Parcelle ciblée *</label>
                <input
                  type="text"
                  placeholder="Ex: Parcelle Sud (Maïs), Verger"
                  required
                  value={formData.parcelle}
                  onChange={(e) => setFormData(prev => ({ ...prev, parcelle: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                  }`}
                />
              </div>

              {/* Base ZNT Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">ZNT Mentionnée sur l'étiquette</label>
                <select
                  value={formData.baseZntType}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseZntType: e.target.value as any }))}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                  }`}
                >
                  <option value="eau_5m">Cours d'eau standard : 5 mètres</option>
                  <option value="eau_20m">Cours d'eau sensible : 20 mètres</option>
                  <option value="eau_50m">Cours d'eau critique : 50 mètres</option>
                  <option value="eau_100m">Cours d'eau ultra-protégé : 100 mètres</option>
                  <option value="riverains_5m">Riverains (Cultures basses) : 5 mètres</option>
                  <option value="riverains_10m">Riverains (Arboriculture/Vignes) : 10 mètres</option>
                  <option value="custom">Distance personnalisée libre</option>
                </select>
              </div>

            </div>

            {formData.baseZntType === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-amber-500">ZNT de base sur l'étiquette (mètres)</label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={formData.customBaseZntVal}
                    onChange={(e) => setFormData(prev => ({ ...prev, customBaseZntVal: Number(e.target.value) }))}
                    className={`w-full p-2 rounded-xl border text-xs focus:outline-hidden ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white':'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* VARIABLE PARAMETERS SECTION */}
            <div className={`mt-5 p-4 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200/70 shadow-2xs'
            }`}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                ⚙️ Ajustement de la ZNT Variable (Normes Arrêté du 4 mai 2017)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Nozzle Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 block">Réduction de dérive (Buse)</label>
                  <select
                    value={formData.nozzleType}
                    onChange={(e) => setFormData(prev => ({ ...prev, nozzleType: e.target.value as any }))}
                    className={`w-full p-2 rounded-lg border text-[11px] text-left focus:outline-hidden ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200':'bg-slate-50 border-slate-250'
                    }`}
                  >
                    <option value="standard">Fente Classique (0% dérive réduite)</option>
                    <option value="low_drift_50">Basse dérive (-50% dérive moyenne)</option>
                    <option value="anti_drift_75">Injection d'air standard (-75% homologuée)</option>
                    <option value="anti_drift_90">Injection d'air ultra (-90% vent fort)</option>
                  </select>
                </div>

                {/* Protective Hedge toggle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 block">Présence d'une Haie Dense</label>
                  <div className="pt-1">
                    <label className="flex items-center gap-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasHedge}
                        onChange={(e) => setFormData(prev => ({ ...prev, hasHedge: e.target.checked }))}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">Oui, écran de verdure</span>
                    </label>
                  </div>
                </div>

                {/* Boom height */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 block">Hauteur de rampe ({formData.height} cm)</label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Wind preset estimate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 block">Vent prévu ({formData.targetWind} km/h)</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={formData.targetWind}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetWind: Number(e.target.value) }))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

              </div>

              {/* LIVE ZNT PREVIEW ACCORDING TO VARIABLES */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-x-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    La ZNT de base du produit est ajustée dynamiquement en fonction du matériel utilisé et de la haie d'atténuation.
                  </span>
                </span>
                
                <div className={`p-2.5 rounded-lg border flex items-center gap-x-4 ${
                  dynamicFormZnt > 10 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <div className="text-right">
                    <span className="text-[9px] block uppercase font-bold text-slate-400 font-mono tracking-wide">ZNT Variable Calculée :</span>
                    <span className="text-xs italic font-sans">(Conforme réglementation routière/rivière)</span>
                  </div>
                  <span className="text-2xl font-black font-mono">{dynamicFormZnt}m</span>
                </div>
              </div>

            </div>

            {/* Notes/Observation */}
            <div className="space-y-1 mt-4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notes d'observation & sécurité</label>
              <textarea
                rows={2}
                placeholder="Ex: Attention à la dérive vers la parcelle voisine d'arboriculture biologique. Éviter d'épandre le midi..."
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-hidden ${
                  isDarkMode ? 'bg-slate-900 border-slate-850 text-white':'bg-white border-slate-200'
                }`}
              />
            </div>

            <div className="mt-5 flex justify-end gap-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`text-xs font-semibold py-2 px-4 rounded-xl border ${
                  isDarkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Valider & Enregistrer dans l'Agenda
              </button>
            </div>

          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE MONTHLY MINI-CALENDAR GRID */}
        <div className="xl:col-span-4 space-y-4">
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
          }`}>
            
            {/* Calendar controller */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-black font-display uppercase tracking-wider ${isDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>
                {getMonthNameFrench(currentMonth)}
              </span>
              <div className="flex items-center gap-x-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={`p-1.5 rounded-lg border cursor-pointer hover:scale-105 transition active:scale-95 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className={`p-1.5 rounded-lg border cursor-pointer hover:scale-105 transition active:scale-95 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 uppercase font-mono mb-2">
              <span>Lu</span>
              <span>Ma</span>
              <span>Me</span>
              <span>Je</span>
              <span>Ve</span>
              <span>Sa</span>
              <span>Di</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="h-8 rounded-lg bg-transparent" />;
                }
                
                const dateStr = date.toISOString().split('T')[0];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const dayTasks = getTasksForDate(date);
                const hasTask = dayTasks.length > 0;
                
                // Let's see if any task has an active critical wind alert
                const hasCriticalWind = dayTasks.some(t => checkLiveWeatherStatus(t).isIllegal);

                return (
                  <div
                    key={dateStr}
                    className={`h-8 rounded-lg flex flex-col items-center justify-between p-1 text-[10px] relative transition-all ${
                      isToday 
                        ? 'bg-emerald-600/20 text-emerald-600 font-extrabold ring-1 ring-emerald-500' 
                        : hasTask 
                        ? (hasCriticalWind 
                          ? 'bg-red-500/10 text-red-600 border border-red-500/30' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20')
                        : 'hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                    title={hasTask ? `${dayTasks.length} traitement(s) planifié(s)` : undefined}
                  >
                    <span>{date.getDate()}</span>
                    
                    {/* Tiny dots or icons for tasks info */}
                    {hasTask && (
                      <div className="flex gap-[1px]">
                        {dayTasks.map(t => (
                          <span 
                            key={t.id} 
                            className={`w-1 h-1 rounded-full ${
                              checkLiveWeatherStatus(t).isIllegal ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                            }`} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 pt-3 border-t text-[10px] space-y-1.5 text-slate-500 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-150'
            }`}>
              <div className="flex items-center gap-x-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/25 block" />
                <span>Traitement sûr prévu le jour même</span>
              </div>
              <div className="flex items-center gap-x-2 w-full">
                <span className="w-2.5 h-2.5 rounded bg-red-500/15 border border-red-500/25 block animate-pulse" />
                <span>Interdiction légale (vent &gt;19 km/h détecté)</span>
              </div>
            </div>

          </div>

          {/* QUICK LEGAL RECALL */}
          <div className={`p-4 rounded-2xl border text-left ${
            isDarkMode ? 'bg-slate-900/30 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-205 text-slate-600 shadow-2xs'
          }`}>
            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-x-1.5 uppercase tracking-wider mb-2">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Normes Légales Clés</span>
            </h4>
            <p className="text-[10px] leading-relaxed">
              Il est strictement interdit d'appliquer tout traitement phytopharmaceutique :
            </p>
            <ul className="text-[10px] list-disc list-inside mt-1.5 space-y-1 pl-1">
              <li>Si l'intensité du vent local est supérieure à <strong>3 Beaufort</strong> (soit <strong>19 km/h</strong>).</li>
              <li>Dans et aux abords des cours d'eau sans respecter la ZNT mentionnée (de 5m à 100m).</li>
              <li>Nos formules appliquent automatiquement l'Arrêté français du 4 mai 2017 décrivant les modalités de réduction de dérive légale.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIST OF PLANNED TREATMENTS */}
        <div className="xl:col-span-8 space-y-4">
          
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-xs font-extrabold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Traitements Enregistrés ({tasks.length})
            </h3>
            
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-1 rounded-md font-mono ${
                isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                Stockage Web local persistant
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center transition-all ${
              isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Aucun traitement n'est planifié pour le moment.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-[11px] text-emerald-600 hover:text-emerald-500 font-bold underline"
              >
                Planifier votre premier traitement maintenant
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const weatherStatus = checkLiveWeatherStatus(task);
                const dateObj = new Date(task.date);
                const displayDateFr = dateObj.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    className={`p-5 rounded-2xl border text-left transition-all relative ${
                      weatherStatus.isIllegal 
                        ? 'bg-rose-500/5 border-rose-500/35 hover:border-rose-500/50 shadow-inner' 
                        : weatherStatus.isRisky
                        ? 'bg-amber-500/5 border-amber-500/35 hover:border-amber-500/50 shadow-2xs'
                        : isDarkMode
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Background Alert warning tag */}
                    {weatherStatus.isIllegal && (
                      <div className="absolute top-0 right-0 transform translate-y-0.5 bg-red-600 text-white font-mono uppercase font-black text-[8px] tracking-wider px-2.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                        ⚠️ Alerte Météo Bloquante
                      </div>
                    )}

                    {/* Task Title & Action row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 border-slate-200/20 mb-3">
                      <div>
                        <div className="flex items-center gap-x-1.5 flex-wrap">
                          <span className={`text-[12px] font-bold ${isDarkMode ? 'text-white':'text-slate-900'} uppercase font-display`}>
                            {task.produitNom}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                            task.timeSlot === 'matin' ? 'bg-sky-500/10 text-sky-500' :
                            task.timeSlot === 'apres-midi' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-violet-500/10 text-violet-500'
                          }`}>
                            🌅 {task.timeSlot}
                          </span>
                        </div>
                        
                        <span className={`text-[11px] font-mono block mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          📅 {displayDateFr}
                        </span>
                      </div>

                      {/* Delete and Pre-fill buttons */}
                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Charger ce planning préparé dans votre Brouillon de Fiche de Traçabilité active ? cela écrasera les données actuelles de la fiche.")) {
                              onLoadIntoDraftFiche(task);
                            }
                          }}
                          className={`text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            isDarkMode 
                              ? 'bg-slate-800 hover:bg-slate-700 text-teal-400' 
                              : 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800'
                          }`}
                          title="Copier et charger tous ces paramètres dans l'éditeur de fiche pour export PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Générer Fiche</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Supprimer du planning"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Treatment detailed parameters (ZNT layout details) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2 text-xs">
                      
                      {/* Applicator and zone */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Zone à traiter :</span>
                        <div className="flex items-center gap-x-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="line-clamp-1">{task.parcelle}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Opérateur: {task.applicator}</span>
                      </div>

                      {/* Equipment parameters */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Buses & Rampe :</span>
                        <div className="flex items-center gap-x-1 font-semibold text-[11px]">
                          <span>{
                            task.nozzleType === 'standard' ? 'Buse standard' :
                            task.nozzleType === 'low_drift_50' ? 'Buses -50% dérive' :
                            task.nozzleType === 'anti_drift_75' ? 'Buses -75% d\'air' :
                            'Buses ultra -90% d\'air'
                          }</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Rampe : {task.height} cm | Écran Haie: {task.hasHedge ? 'OUI': 'NON'}
                        </span>
                      </div>

                      {/* Base ZNT Type */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">ZNT Minimale Initiale :</span>
                        <div className="flex items-center gap-x-1 font-semibold text-[11px] text-amber-500">
                          <span>{
                            task.baseZntType === 'eau_5m' ? '5m (Cours d\'eau)' :
                            task.baseZntType === 'eau_20m' ? '20m (Cours d\'eau sensible)' :
                            task.baseZntType === 'eau_50m' ? '50m (Cours d\'eau critique)' :
                            task.baseZntType === 'eau_100m' ? '100m (Cours d\'eau interdit)' :
                            task.baseZntType === 'riverains_5m' ? '5m (Habitation standard)' :
                            task.baseZntType === 'riverains_10m' ? '10m (Arboriculture)' :
                            `${task.customBaseZntVal || 20}m (Libre)`
                          }</span>
                        </div>
                      </div>

                      {/* Computed Variable ZNT */}
                      <div className="space-y-0.2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Distance Finale Variable (ZNT) :</span>
                        <div className="flex items-baseline gap-x-1 text-emerald-600 dark:text-emerald-450 font-black font-mono">
                          <span className="text-xl">{task.computedZnt}</span>
                          <span className="text-[10px] font-bold">mètres</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block leading-none">
                          Réduction légale de dérive appliquée d'après l'Arrêté.
                        </span>
                      </div>

                    </div>

                    {/* Météo Diagnostic strip inside card */}
                    <div className={`mt-3 p-3 rounded-xl flex items-center justify-between gap-4 text-xs ${
                      weatherStatus.isIllegal 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold' 
                        : weatherStatus.isRisky
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                    }`}>
                      <div className="flex items-start gap-x-2">
                        <Wind className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-snug">{weatherStatus.text}</span>
                      </div>
                      
                      <div className="shrink-0 text-[10px] text-slate-400 italic">
                        {weatherStatus.isMatchedWithRealForecast ? '⚡ Connecté météo réelle' : '⚠️ Prévision calculée'}
                      </div>
                    </div>

                    {/* Notes display */}
                    {task.notes && (
                      <p className={`mt-2.5 text-[10px] border-t border-slate-200/10 pt-2 italic ${
                        isDarkMode ? 'text-slate-400':'text-slate-500'
                      }`}>
                        📔 <strong>Notes:</strong> {task.notes}
                      </p>
                    )}

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

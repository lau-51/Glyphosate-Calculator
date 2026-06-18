import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Globe, 
  FileText, 
  ChevronRight, 
  Check, 
  Download, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Info, 
  Droplet, 
  ArrowRight,
  Sparkles,
  ClipboardList,
  Wind,
  Layers,
  HelpCircle,
  FileDown
} from 'lucide-react';
import { getInputItem, saveInputItem } from '../utils/indexedDB';
import { ExploitationData, Parcelle } from '../types';

export interface PhytoUsage {
  culture: string;
  target: string;
  maxDose: number; // L/ha or kg/ha
  maxApplications?: number;
  dar: string; // Delay before harvest
  zntEau: string; // Distance to water
  zntSante: string; // Distance to residents
  dre: string; // Re-entry delay
}

export interface PhytoProduct {
  id: string;
  name: string;
  amm: string;
  substances: string[];
  holder: string;
  type: string; // Fongicide, Herbicide, Insecticide, etc.
  formulation: string;
  usages: PhytoUsage[];
  mentionDanger: string[];
  epiRequis: string[];
  dateImport: string;
  source: string;
}

interface PhytosManagerProps {
  isDarkMode: boolean;
  exploitationData: ExploitationData;
  onAddManualIft: (date: string, parcelle: string, appliedDose: number, productConcentration: number, notes?: string) => void;
  currentWindSpeed: number;
}

export default function PhytosManager({ 
  isDarkMode, 
  exploitationData,
  onAddManualIft,
  currentWindSpeed
}: PhytosManagerProps) {
  
  // List of imported products
  const [products, setProducts] = useState<PhytoProduct[]>([]);
  const [currentTab, setCurrentTab] = useState<'import' | 'catalog' | 'calculate'>('import');
  
  // Storage loading tracker
  const [dbLoaded, setDbLoaded] = useState(false);
  
  // Importer state
  const [importMethod, setImportMethod] = useState<'url' | 'search' | 'text'>('search');
  const [importUrl, setImportUrl] = useState('');
  const [importSearch, setImportSearch] = useState('');
  const [importText, setImportText] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<PhytoProduct | null>(null);

  // Treatment builder state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedUsageIndex, setSelectedUsageIndex] = useState<number>(0);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  
  const [appliedDose, setAppliedDose] = useState<number>(0);
  const [volumeBouillie, setVolumeBouillie] = useState<number>(120); // standard L/ha
  const [tankCapacity, setTankCapacity] = useState<number>(800); // standard tractor tank size
  const [treatmentDate, setTreatmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [applicatorName, setApplicatorName] = useState<string>('L. Autreau');
  const [notes, setNotes] = useState<string>('');
  
  // Checked EPI verification state
  const [checkedEpis, setCheckedEpis] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState<{ type: 'calendar' | 'ift' | 'pdf'; value: boolean } | null>(null);

  // Ephy site helpful demo products
  const SAMPLE_EPHY_SEARCHES = [
    { name: "CHAMP FLO", type: "Fongicide", ammac: "8200052" },
    { name: "DECIS PROTECH", type: "Insecticide", ammac: "2030177" },
    { name: "PELT 44 SC", type: "Fongicide", ammac: "9100239" },
    { name: "KART", type: "Herbicide", ammac: "2190135" }
  ];

  // Load imported products database
  useEffect(() => {
    async function loadImported() {
      try {
        const saved = await getInputItem<PhytoProduct[]>('imported_phytos');
        if (saved && Array.isArray(saved)) {
          setProducts(saved);
        } else {
          // Pre-populate with high quality mock starting products based on exact EPHY values
          const initialProducts: PhytoProduct[] = [
            {
              id: "8200052",
              name: "CHAMP FLO",
              amm: "8200052",
              substances: ["Cuivre de l'hydroxyde de cuivre 360 g/L"],
              holder: "Nufarm SAS",
              type: "Fongicide",
              formulation: "Suspension concentrée (SC)",
              usages: [
                {
                  culture: "Vigne",
                  target: "Mildiou de la vigne",
                  maxDose: 2.5,
                  maxApplications: 4,
                  dar: "21 jours",
                  zntEau: "20 m",
                  zntSante: "10 m",
                  dre: "24 heures"
                },
                {
                  culture: "Pommier",
                  target: "Tavelure du pommier",
                  maxDose: 1.8,
                  maxApplications: 3,
                  dar: "F (Sans objet)",
                  zntEau: "5 m",
                  zntSante: "5 m",
                  dre: "6 heures"
                }
              ],
              mentionDanger: [
                "H318 : Provoque de graves lésions des yeux",
                "H410 : Très toxique pour les organismes aquatiques, entraîne des effets de dérive durables"
              ],
              epiRequis: [
                "Gants en nitrile EN 374-3",
                "Combinaison de protection de catégorie III type 4",
                "Lunettes de sécurité étanches",
                "Masque respiratoire de classe FFP3"
              ],
              dateImport: "18/06/2026",
              source: "Pré-chargement de conformité"
            },
            {
              id: "2030177",
              name: "DECIS PROTECH",
              amm: "2030177",
              substances: ["Deltaméthrine 15 g/L"],
              holder: "Bayer S.A.S.",
              type: "Insecticide",
              formulation: "Émulsion de contact (EW)",
              usages: [
                {
                  culture: "Blé",
                  target: "Pucerons de l'épi",
                  maxDose: 0.8,
                  maxApplications: 1,
                  dar: "30 jours",
                  zntEau: "50 m",
                  zntSante: "10 m",
                  dre: "48 heures"
                },
                {
                  culture: "Vigne",
                  target: "Cicadelles de la cicadelle verte",
                  maxDose: 0.5,
                  maxApplications: 2,
                  dar: "7 jours",
                  zntEau: "20 m",
                  zntSante: "10 m",
                  dre: "24 heures"
                }
              ],
              mentionDanger: [
                "H302 : Nocif en cas d'ingestion",
                "H410 : Extrêmement toxique pour la faune aquatique ainsi que pour les pollinisateurs"
              ],
              epiRequis: [
                "Gants de protection à manches longues nitrile",
                "Combinaison de protection robuste type 4",
                "Écran facial étanche",
                "Bottes de sécurité en caoutchouc imperméables"
              ],
              dateImport: "18/06/2026",
              source: "Pré-chargement de conformité"
            }
          ];
          setProducts(initialProducts);
          await saveInputItem('imported_phytos', initialProducts);
        }
      } catch (err) {
        console.error("Impossible de charger les produits phytosanitaires :", err);
      } finally {
        setDbLoaded(true);
      }
    }
    loadImported();
  }, []);

  // Sync to IndexedDB on changes
  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('imported_phytos', products);
    }
  }, [products, dbLoaded]);

  // Set default form values when a product or usage changes
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const selectedUsage = useMemo(() => {
    if (!selectedProduct || !selectedProduct.usages) return null;
    return selectedProduct.usages[selectedUsageIndex] || selectedProduct.usages[0] || null;
  }, [selectedProduct, selectedUsageIndex]);

  const selectedParcel = useMemo(() => {
    if (!exploitationData || !exploitationData.parcelles) return null;
    return exploitationData.parcelles.find(p => p.id === selectedParcelId) || exploitationData.parcelles[0] || null;
  }, [exploitationData, selectedParcelId]);

  // Handle setting initial parameters when tabs trigger
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.usages && selectedProduct.usages.length > 0) {
        const usage = selectedProduct.usages[0];
        setAppliedDose(usage.maxDose);
      }
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedUsage) {
      setAppliedDose(selectedUsage.maxDose);
      // Reset EPI checks
      const checks: Record<string, boolean> = {};
      selectedProduct?.epiRequis.forEach(epi => {
        checks[epi] = false;
      });
      setCheckedEpis(checks);
    }
  }, [selectedUsageIndex, selectedProductId]);

  useEffect(() => {
    if (exploitationData && exploitationData.parcelles && exploitationData.parcelles.length > 0 && !selectedParcelId) {
      setSelectedParcelId(exploitationData.parcelles[0].id);
    }
    if (exploitationData && exploitationData.applicators && exploitationData.applicators.length > 0) {
      setApplicatorName(exploitationData.applicators[0].name);
    }
  }, [exploitationData]);

  // Search/Import trigger
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);

    const payload: { url?: string; rawText?: string; name?: string } = {};
    if (importMethod === 'url') {
      if (!importUrl) {
        setImportError("Veuillez saisir une URL valide du site ephy.anses.fr");
        setIsLoading(false);
        return;
      }
      payload.url = importUrl;
    } else if (importMethod === 'text') {
      if (!importText) {
        setImportError("Veuillez coller le texte de la page du produit.");
        setIsLoading(false);
        return;
      }
      payload.rawText = importText;
    } else {
      if (!importSearch) {
        setImportError("Veuillez renseigner le nom ou le code AMM du produit.");
        setIsLoading(false);
        return;
      }
      payload.name = importSearch;
    }

    try {
      const response = await fetch('/api/phytos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d'importer le produit.");
      }

      const importedProduct: PhytoProduct = data.product;
      
      // Save product to local state catalogue
      setProducts(prev => {
        const filtered = prev.filter(p => p.amm !== importedProduct.amm);
        return [importedProduct, ...filtered];
      });

      setImportSuccess(importedProduct);
      setImportUrl('');
      setImportSearch('');
      setImportText('');
    } catch (err: any) {
      console.error(err);
      setImportError(err.message || "Erreur de communication avec l'extracteur IA d'Ephy Anses.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (selectedProductId === id) {
      setSelectedProductId('');
    }
  };

  const triggerPresetSearch = (name: string) => {
    setImportMethod('search');
    setImportSearch(name);
  };

  // Treatment Calculations
  const calculatedOutputs = useMemo(() => {
    if (!selectedProduct || !selectedUsage || !selectedParcel) return null;

    const surfaceHa = selectedParcel.surface; // Area in hectares
    const totalProductNeeded = surfaceHa * appliedDose; // Liters of product needed
    const totalBouillieNeeded = surfaceHa * volumeBouillie; // Total Liters of mix

    const numTanksFull = Math.floor(totalBouillieNeeded / tankCapacity);
    const hasRemainderTank = (totalBouillieNeeded % tankCapacity) > 0.01;
    const remainderVolume = totalBouillieNeeded % tankCapacity;

    // Formula: Product per tank = tank volume * appliedDose / volumeBouillie
    const productPerFullTank = (tankCapacity * appliedDose) / volumeBouillie;
    const waterPerFullTank = tankCapacity - productPerFullTank;

    let remainderProduct = 0;
    let remainderWater = 0;
    if (hasRemainderTank) {
      remainderProduct = (remainderVolume * appliedDose) / volumeBouillie;
      remainderWater = remainderVolume - remainderProduct;
    }

    // Indicator of compliance: Applied dose vs maximum dosage authorized
    const maxDose = selectedUsage.maxDose;
    const isCompliant = appliedDose <= maxDose;
    const calculatedIftValue = appliedDose / maxDose; // Unitary treatment index

    return {
      surfaceHa,
      totalProductNeeded: Number(totalProductNeeded.toFixed(2)),
      totalBouillieNeeded: Number(totalBouillieNeeded.toFixed(1)),
      numTanksFull,
      hasRemainderTank,
      remainderVolume: Number(remainderVolume.toFixed(1)),
      productPerFullTank: Number(productPerFullTank.toFixed(2)),
      waterPerFullTank: Number(waterPerFullTank.toFixed(1)),
      remainderProduct: Number(remainderProduct.toFixed(2)),
      remainderWater: Number(remainderWater.toFixed(1)),
      isCompliant,
      calculatedIftValue: Number(calculatedIftValue.toFixed(2))
    };
  }, [selectedProduct, selectedUsage, selectedParcel, appliedDose, volumeBouillie, tankCapacity]);

  // Weather suitability check
  const isWeatherForbidden = currentWindSpeed > 19; // > 19 km/h is illegal in France

  // PPE progress completed percentage
  const epiPercentage = useMemo(() => {
    if (!selectedProduct || !selectedProduct.epiRequis.length) return 100;
    const required = selectedProduct.epiRequis.length;
    const checked = Object.values(checkedEpis).filter(Boolean).length;
    return Math.round((checked / required) * 100);
  }, [selectedProduct, checkedEpis]);

  // Action: Save to agenda/calendar
  const handleSaveToCalendar = async () => {
    if (!selectedProduct || !selectedUsage || !selectedParcel || !calculatedOutputs) return;

    try {
      const savedTasks = await getInputItem<any[]>('treatment_agenda') || [];
      
      const parsedZntVal = parseFloat(selectedUsage.zntEau.replace(/[^0-9.]/g, '')) || 5;

      const newTask = {
        id: 'task-' + Date.now(),
        date: treatmentDate,
        timeSlot: 'matin',
        applicator: applicatorName,
        parcelle: selectedParcel.name,
        produitNom: selectedProduct.name,
        baseZntType: `eau_${parsedZntVal}m` as any,
        customBaseZntVal: parsedZntVal,
        nozzleType: 'anti_drift_75',
        hasHedge: true,
        height: 50,
        targetWind: currentWindSpeed,
        notes: `Dosage : ${appliedDose} L/ha. Volume de bouillie : ${volumeBouillie} L/ha. ${notes}. Importé du site ephy.anses.fr (AMM ${selectedProduct.amm}).`,
        computedZnt: parsedZntVal,
        isZntValidated: true
      };

      await saveInputItem('treatment_agenda', [newTask, ...savedTasks]);
      
      setSaveSuccess({ type: 'calendar', value: true });
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement au calendrier.");
    }
  };

  // Action: Add to IFT registers
  const handleAddToIft = () => {
    if (!selectedProduct || !selectedUsage || !selectedParcel || !calculatedOutputs) return;

    // Call callback to add manual IFT
    onAddManualIft(
      treatmentDate,
      selectedParcel.name,
      appliedDose,
      360, // standard concentration index
      `Traitement avec ${selectedProduct.name} pour usage : ${selectedUsage.culture} contre ${selectedUsage.target}. IFT estimé: ${calculatedOutputs.calculatedIftValue}`
    );

    setSaveSuccess({ type: 'ift', value: true });
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  return (
    <div className="space-y-6" id="phytos-workspace">
      
      {/* Tab Header Banner */}
      <div className={`p-6 rounded-2xl relative overflow-hidden border ${isDarkMode ? 'bg-slate-905 border-slate-800' : 'bg-emerald-50/40 border-emerald-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1">
            <div className="flex items-center gap-x-2.5">
              <span className="p-2 bg-emerald-600 rounded-xl text-white">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Traitements Phytosanitaires & Import EPHY Anses
              </h2>
            </div>
            <p className="text-secondary-label text-sm max-w-2xl mt-1 text-slate-500 dark:text-slate-400">
              Importez des données homologuées du site d'État <strong className="text-emerald-500 font-semibold">ephy.anses.fr</strong> par IA, 
              déterminez les dosages conformes, estimez votre IFT et planifiez vos interventions sur vos parcelles.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              id="goto-import"
              onClick={() => setCurrentTab('import')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'import'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              Importer Produit
            </button>
            <button
              id="goto-catalog"
              onClick={() => setCurrentTab('catalog')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                currentTab === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              Catalogue ({products.length})
              {products.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {products.length}
                </span>
              )}
            </button>
            <button
              id="goto-calculate"
              onClick={() => {
                // If there are products but none selected yet, default to the first one
                if (products.length > 0 && !selectedProductId) {
                  setSelectedProductId(products[0].id);
                }
                setCurrentTab('calculate');
              }}
              disabled={products.length === 0}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-x-1 ${
                products.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                currentTab === 'calculate'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              Préparer Traitement
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Views */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: IMPORT FROM ANSES */}
        {currentTab === 'import' && (
          <motion.div
            key="import-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in"
          >
            {/* Control Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-x-2">
                  <Globe className="w-4.5 h-4.5 text-emerald-500" />
                  Mode d'Importation
                </h3>
                
                {/* Method selector buttons */}
                <div className="grid grid-cols-3 gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => { setImportMethod('search'); setImportError(null); }}
                    className={`py-2 px-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      importMethod === 'search' 
                        ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Recherche Nom
                  </button>
                  <button
                    onClick={() => { setImportMethod('url'); setImportError(null); }}
                    className={`py-2 px-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      importMethod === 'url' 
                        ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    URL EPHY
                  </button>
                  <button
                    onClick={() => { setImportMethod('text'); setImportError(null); }}
                    className={`py-2 px-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      importMethod === 'text' 
                        ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Texte Copié
                  </button>
                </div>

                {/* Import Forms */}
                <form onSubmit={handleImportSubmit} className="space-y-4">
                  {importMethod === 'search' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Nom Commercial ou AMM
                      </label>
                      <div className="relative">
                        <input
                          id="phyto-search-input"
                          type="text"
                          value={importSearch}
                          onChange={(e) => setImportSearch(e.target.value)}
                          placeholder="Ex: CHAMP FLO, DECIS, KART, 8200052"
                          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-505 dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none"
                        />
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Utilise les connaissances agro-réglementaires de Gemini pour interpoler toutes les données homologuées ephy.anses.fr.
                      </p>
                    </div>
                  )}

                  {importMethod === 'url' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        URL complète du produit EPHY
                      </label>
                      <div className="relative">
                        <input
                          id="phyto-url-input"
                          type="url"
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          placeholder="https://ephy.anses.fr/ppp/champ-flo"
                          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-505 dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none"
                        />
                        <Globe className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Rentrez l'URL exacte du site de l'Anses. Notre serveur en extraira le code HTML pour structurer les données.
                      </p>
                    </div>
                  )}

                  {importMethod === 'text' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        Coller le contenu de la page
                      </label>
                      <textarea
                        id="phyto-text-input"
                        rows={7}
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Sélectionnez et copiez tout le texte depuis ephy.anses.fr pour ce produit et collez-le ici..."
                        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-505 dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none font-mono"
                      />
                      <p className="text-xs text-slate-400">
                        Idéal si votre pare-feu ou le site de l'Anses bloque les requêtes de serveurs automatiques.
                      </p>
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-start gap-x-2 border border-rose-100 dark:border-rose-900">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}

                  <button
                    id="phyto-submit-button"
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-x-2 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Extraction IA en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4.5 h-4.5" />
                        Importer l'homologation
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Exemples Rapides (Démo EPHY)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_EPHY_SEARCHES.map(samp => (
                      <button
                        key={samp.ammac}
                        onClick={() => triggerPresetSearch(samp.name)}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-105 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-slate-800 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition-all text-slate-600 dark:text-slate-400 flex items-center gap-x-1 border border-slate-200/40 dark:border-slate-700/40"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{samp.name} ({samp.type})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Response/Preview Column */}
            <div className="lg:col-span-2">
              <div className="h-full">
                {importSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 border rounded-2xl h-full flex flex-col justify-between ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Success header */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-850">
                        <div>
                          <span className="p-1 px-2.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Importé avec succès via {importSuccess.source}
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {importSuccess.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Numéro AMM Anses</p>
                          <p className="text-sm font-bold text-slate-80o dark:text-slate-200">{importSuccess.amm}</p>
                        </div>
                      </div>

                      {/* Substances Detail */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Substance(s) Active(s)</p>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-sm font-medium">
                            {importSuccess.substances.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Informations Générales</p>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                            <div>
                              <span className="text-slate-400 block">Usage :</span>
                              <span className="font-semibold text-emerald-500">{importSuccess.type}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Formulation :</span>
                              <span className="font-semibold">{importSuccess.formulation || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Titulaire :</span>
                              <span className="font-semibold truncate block">{importSuccess.holder || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Date d'import :</span>
                              <span className="font-semibold">{importSuccess.dateImport}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Usages Section */}
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">
                        Principaux Usages Homologués Répertoriés ephy
                      </h4>
                      <div className="space-y-3">
                        {importSuccess.usages.map((use, idx) => (
                          <div 
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-120 dark:border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row justify-between md:items-center gap-3 bg-slate-50/40 dark:bg-slate-905"
                          >
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-md text-xs font-bold">
                                {use.culture}
                              </span>
                              <p className="text-sm font-semibold">{use.target}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                                <span className="flex items-center gap-x-1">
                                  <Clock className="w-3 h-3 text-slate-400" /> DRE: <strong>{use.dre}</strong>
                                </span>
                                <span className="flex items-center gap-x-1">
                                  <Calendar className="w-3 h-3 text-slate-400" /> DAR: <strong>{use.dar}</strong>
                                </span>
                              </div>
                            </div>
                            <div className="md:text-right shrink-0">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Dose Maximale</p>
                              <p className="text-base font-black text-emerald-500">
                                {use.maxDose} <span className="text-xs font-normal">L/ha ou kg/ha</span>
                              </p>
                              <div className="flex gap-x-2 text-[10px] text-slate-400 uppercase mt-0.5">
                                <span>ZNT Eau: <strong className="text-sky-500">{use.zntEau}</strong></span>
                                <span>ZNT Riverains: <strong className="text-amber-500">{use.zntSante}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setSelectedProductId(importSuccess.id);
                          setSelectedUsageIndex(0);
                          setCurrentTab('calculate');
                        }}
                        className="flex-1 py-3 px-4 bg-emerald-605 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium text-sm flex items-center justify-center gap-x-2 cursor-pointer transition-all"
                      >
                        <Droplet className="w-4 h-4" />
                        Préparer un traitement avec ce produit
                      </button>
                      <button
                        onClick={() => {
                          setImportSuccess(null);
                          setCurrentTab('catalog');
                        }}
                        className="py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 rounded-xl text-sm font-medium cursor-pointer"
                      >
                        Voir le catalogue
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className={`p-8 border rounded-2xl h-full flex flex-col items-center justify-center text-center opacity-70 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="p-4 bg-slate-105 dark:bg-slate-800 rounded-2xl text-slate-400 mb-4">
                      <FileText className="w-12 h-12" />
                    </div>
                    <h3 className="text-lg font-bold">Aucune homologation chargée</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Sélectionnez un exemple ou recherchez un produit phytosanitaire ci-contre pour extraire instantanément sa fiche réglementaire complète.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PRODUCT CATALOGUE */}
        {currentTab === 'catalog' && (
          <motion.div
            key="catalog-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {products.length === 0 ? (
              <div className="p-12 border border-dashed rounded-2xl text-center">
                <p className="text-slate-500">Aucun produit dans votre catalogue local.</p>
                <button
                  onClick={() => setCurrentTab('import')}
                  className="mt-3 py-2 px-4 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Importer un premier produit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map(item => (
                  <div 
                    key={item.id}
                    className={`border rounded-2xl p-6 relative flex flex-col justify-between hover:shadow-md transition-all ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'Herbicide' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            item.type === 'Fongicide' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}>
                            {item.type}
                          </span>
                          <h4 className="text-xl font-black mt-1.5">{item.name}</h4>
                          <p className="text-xs text-slate-450 text-slate-400">AMM: <strong className="text-slate-600 dark:text-slate-300">{item.amm}</strong></p>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="Supprimer le produit"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      {/* Info Sub */}
                      <div className="text-xs space-y-1 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl font-medium">
                        <div><span className="text-slate-450 text-slate-400">Substances:</span> {item.substances.join(', ')}</div>
                        <div><span className="text-slate-450 text-slate-400">Formulation:</span> {item.formulation || 'NC'}</div>
                        <div><span className="text-slate-450 text-slate-400">Détenteur:</span> {item.holder || 'Anonyme'}</div>
                      </div>

                      {/* Usages bullet */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usages de traitement</p>
                        {item.usages.map((use, uIdx) => (
                          <div key={uIdx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-850">
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200">{use.culture}</strong>
                              <span className="text-slate-400"> - {use.target}</span>
                            </div>
                            <span className="font-bold text-emerald-500">{use.maxDose} L/ha</span>
                          </div>
                        ))}
                      </div>

                      {/* Danger Statements */}
                      {item.mentionDanger && item.mentionDanger.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-orange-50/40 dark:bg-amber-950/20 text-[10px] text-orange-600 dark:text-amber-400 flex items-start gap-1.5 border border-orange-100/30">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            {item.mentionDanger.map((phrase, pIdx) => (
                              <p key={pIdx} className="line-clamp-1">{phrase}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedProductId(item.id);
                          setSelectedUsageIndex(0);
                          setCurrentTab('calculate');
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-x-1 cursor-pointer transition-all"
                      >
                        <Droplet className="w-3.5 h-3.5" />
                        Initier une préparation de traitement
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: TREATMENT PREPARER */}
        {currentTab === 'calculate' && selectedProduct && selectedUsage && (
          <motion.div
            key="calculate-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Treatment Inputs & Parameters */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Product and Usage selections */}
              <div className={`p-6 border rounded-2xl space-y-4 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-x-2">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  Sélection du Produit & Usage
                </h3>

                {/* Alternate product selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Produit Homologué</label>
                  <select
                    id="target-product-selector"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none dark:bg-slate-800 dark:border-slate-700 font-semibold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (AMM {p.amm})</option>
                    ))}
                  </select>
                </div>

                {/* Crop Usage selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Usage autorisé pour le calcul</label>
                  <select
                    id="target-usage-selector"
                    value={selectedUsageIndex}
                    onChange={(e) => setSelectedUsageIndex(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border focus:outline-none dark:bg-slate-800 dark:border-slate-700 font-medium"
                  >
                    {selectedProduct.usages.map((u, index) => (
                      <option key={index} value={index}>
                        {u.culture} - Cible : {u.target} (Max : {u.maxDose} L/ha)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Parcel selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Parcelle à traiter</label>
                  <select
                    id="target-parcel-selector"
                    value={selectedParcelId}
                    onChange={(e) => setSelectedParcelId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                  >
                    {exploitationData.parcelles.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.surface} ha — Cepage : {p.cepage})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic physical formula inputs */}
              <div className={`p-6 border rounded-2xl space-y-4 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-x-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  Dose & Volume de Bouillie
                </h3>

                {/* Applied Dose (L/ha) slider and numeric input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 block">Dose appliquée (L/ha ou kg/ha)</label>
                    <span className="text-xs font-bold text-emerald-500">Maximum légal: {selectedUsage.maxDose}</span>
                  </div>
                  <div className="flex items-center gap-x-3">
                    <input
                      id="applied-dose-slider"
                      type="range"
                      min={0.1}
                      max={selectedUsage.maxDose * 1.5}
                      step={0.05}
                      value={appliedDose}
                      onChange={(e) => setAppliedDose(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <input
                      id="applied-dose-num"
                      type="number"
                      step={0.1}
                      value={appliedDose}
                      onChange={(e) => setAppliedDose(Number(e.target.value))}
                      className="w-20 p-2 border rounded-xl text-center font-bold focus:outline-none dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                  
                  {calculatedOutputs && !calculatedOutputs.isCompliant && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-[10px] rounded-lg flex items-center gap-x-1.5 border border-rose-100/30 font-semibold animation-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Attention : La dose d'application choisie dépasse la dose légale homologuée !</span>
                    </div>
                  )}
                </div>

                {/* Bouillie volume (L/ha) */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-400">Volume de Bouillie par hectare (L/ha)</label>
                    <span className="text-xs font-bold">{volumeBouillie} L/ha</span>
                  </div>
                  <input
                    id="volume-bouillie-num"
                    type="range"
                    min={40}
                    max={400}
                    step={10}
                    value={volumeBouillie}
                    onChange={(e) => setVolumeBouillie(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block pt-1">
                    Généralement autour de 100 à 150 L pour tracteur, ou 200 à 300 L pour une application feuillue dense.
                  </span>
                </div>

                {/* Tank Capacity (L) */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-400">Capacité de la Cuve du Pulvérisateur (Litres)</label>
                    <span className="text-xs font-bold">{tankCapacity} L</span>
                  </div>
                  <input
                    id="tank-capacity-num"
                    type="range"
                    min={100}
                    max={2500}
                    step={50}
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Administrative Inputs */}
              <div className={`p-6 border rounded-2xl space-y-4 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-x-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  Traçabilité du Chantier
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Date prévue</label>
                    <input
                      id="treatment-date-input"
                      type="date"
                      value={treatmentDate}
                      onChange={(e) => setTreatmentDate(e.target.value)}
                      className="w-full p-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 block">Applicateur</label>
                    <select
                      id="applicator-input-box"
                      value={applicatorName}
                      onChange={(e) => setApplicatorName(e.target.value)}
                      className="w-full p-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                    >
                      {exploitationData.applicators.map(app => (
                        <option key={app.id} value={app.name}>{app.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 block">Notes additionnelles</label>
                  <textarea
                    id="notes-input"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Température basse le matin, vitesse d'avancement du tracteur réglée à 8km/h..."
                    className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Calculations and Output Recipe */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Dynamic Recipe Card */}
              {calculatedOutputs && (
                <div className={`p-6 border rounded-2xl shadow-sm relative overflow-hidden ${
                  isDarkMode ? 'bg-slate-905 border-emerald-500/20' : 'bg-emerald-50/20 border-emerald-100'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl" />
                  
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Calculateur de Bouillie & Dosage
                  </span>
                  
                  <h3 className="text-2xl font-black mt-2 mb-1">Fiche de Préparation : {selectedProduct.name}</h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Mélange pour la parcelle <strong className="text-slate-800 dark:text-slate-200">"{selectedParcel.name}"</strong> ({calculatedOutputs.surfaceHa} Hectares)
                  </p>

                  {/* Summary Totals */}
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/20">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Dose appliquée</p>
                      <p className="text-xl md:text-2xl font-black text-slate-80o text-emerald-500 mt-1">{appliedDose}</p>
                      <p className="text-[9px] text-slate-400">L/ha ou kg/ha</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/20">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Volume de produit</p>
                      <p className="text-xl md:text-2xl font-black text-slate-80o text-emerald-500 mt-1">{calculatedOutputs.totalProductNeeded}</p>
                      <p className="text-[9px] text-slate-400">Litres totaux</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/20">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Volume de bouillie</p>
                      <p className="text-xl md:text-2xl font-black text-slate-8oo text-sky-500 mt-1">{calculatedOutputs.totalBouillieNeeded}</p>
                      <p className="text-[9px] text-slate-400">Litres de mélange</p>
                    </div>
                  </div>

                  {/* Tanks Instructions */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest flex items-center gap-x-1">
                      <span>Mélange dans la cuve :</span>
                      <strong className="text-emerald-500 font-extrabold">
                        {calculatedOutputs.numTanksFull > 0 ? `${calculatedOutputs.numTanksFull} cuve(s) de ${tankCapacity} L` : ''}
                        {calculatedOutputs.hasRemainderTank ? (calculatedOutputs.numTanksFull > 0 ? ` + 1 cuve de ${calculatedOutputs.remainderVolume} L` : `1 cuve de ${calculatedOutputs.remainderVolume} L`) : ''}
                      </strong>
                    </h4>

                    {/* Full Tanks Recipe */}
                    {calculatedOutputs.numTanksFull > 0 && (
                      <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-105/40 dark:bg-slate-900">
                        <div className="flex justify-between font-bold text-xs uppercase tracking-wide border-b border-slate-200/30 dark:border-slate-800 pb-2 mb-3">
                          <span className="text-slate-800 dark:text-slate-200">Pour chaque cuve de {tankCapacity} L complète</span>
                          <span className="text-emerald-500">({calculatedOutputs.numTanksFull} cuve(s))</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg">
                            <span className="text-slate-450 text-[10px] block text-slate-400 uppercase">PRODUIT :</span>
                            <span className="text-base text-emerald-505 font-black text-emerald-400">{calculatedOutputs.productPerFullTank} Litres (ou kg)</span>
                          </div>
                          <div className="p-3 bg-sky-50/30 dark:bg-sky-950/20 rounded-lg">
                            <span className="text-slate-450 text-[10px] block text-slate-400 uppercase">EAU :</span>
                            <span className="text-base text-sky-555 font-black text-sky-400">{calculatedOutputs.waterPerFullTank} Litres</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Remaining/Partial Tank Recipe */}
                    {calculatedOutputs.hasRemainderTank && (
                      <div className="p-4 rounded-xl border border-dashed border-sky-450 dark:border-sky-800 bg-sky-50/10 dark:bg-sky-950/10">
                        <div className="flex justify-between font-bold text-xs uppercase tracking-wide border-b border-sky-200/20 pb-2 mb-3">
                          <span className="text-sky-800 dark:text-sky-300">Dernière cuve partielle (Ajustement de fin de chantier)</span>
                          <span className="text-sky-555 text-sky-400">Cuve de {calculatedOutputs.remainderVolume} L</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg">
                            <span className="text-slate-450 text-[10px] block text-slate-400 uppercase">PRODUIT :</span>
                            <span className="text-base text-emerald-505 font-black text-emerald-400">{calculatedOutputs.remainderProduct} Litres (ou kg)</span>
                          </div>
                          <div className="p-3 bg-sky-50/30 dark:bg-sky-950/20 rounded-lg">
                            <span className="text-slate-450 text-[10px] block text-slate-400 uppercase">EAU :</span>
                            <span className="text-base text-sky-555 font-black text-sky-400">{calculatedOutputs.remainderWater} Litres</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Regulatory Suitability and PPE list */}
              <div className={`p-6 border rounded-2xl space-y-4 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Contrôle de Conformité Réglementaire
                </h3>

                {/* Wind and Weather Suitability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wind controller status */}
                  <div className={`p-4 rounded-xl border flex gap-3 ${
                    isWeatherForbidden 
                      ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400' 
                      : 'bg-emerald-50/40 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                  }`}>
                    <Wind className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black uppercase">Force du Vent ({currentWindSpeed} km/h)</p>
                      <p className="text-xs mt-0.5 font-medium leading-relaxed">
                        {isWeatherForbidden 
                          ? "INTERDICTION DE TRAITER : Le vent dépasse la limite légale française de 19 km/h (risque grave de dérive)." 
                          : "Conforme : Le vent respecte la limite légale de 19 km/h. Pulvérisation autorisée."}
                      </p>
                    </div>
                  </div>

                  {/* Delay/Warning status */}
                  <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-905">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      <p className="font-black text-slate-800 dark:text-slate-200 uppercase">Délais d'Usage Phyto</p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Délai de rentrée (DRE) : <strong>{selectedUsage.dre}</strong></li>
                        <li>Délai avant récolte (DAR) : <strong>{selectedUsage.dar}</strong></li>
                        <li>Pour les points d'eau : ZNT de <strong>{selectedUsage.zntEau}</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Mandatory PPE section */}
                {selectedProduct.epiRequis && selectedProduct.epiRequis.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-820">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-black uppercase text-slate-400">Équipements de Protection Individuelle (EPI) Obligatoires</h4>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${epiPercentage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {epiPercentage}% validés
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {selectedProduct.epiRequis.map((epi, index) => (
                        <label 
                          key={index}
                          className={`p-2.5 rounded-xl border flex items-center gap-x-2.5 text-xs font-medium cursor-pointer transition-all ${
                            checkedEpis[epi]
                              ? 'bg-emerald-50/20 border-emerald-500/30'
                              : 'bg-slate-50 dark:bg-slate-905 border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedEpis[epi]}
                            onChange={(e) => {
                              setCheckedEpis(prev => ({ ...prev, [epi]: e.target.checked }));
                            }}
                            className="accent-emerald-500 cursor-pointer h-4 w-4 rounded"
                          />
                          <span className={checkedEpis[epi] ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
                            {epi}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons to save */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-save-to-calendar"
                  onClick={handleSaveToCalendar}
                  disabled={isWeatherForbidden || !calculatedOutputs?.isCompliant}
                  className={`flex-1 py-3 px-4 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all font-semibold text-sm flex items-center justify-center gap-x-2 cursor-pointer ${
                    (isWeatherForbidden || !calculatedOutputs?.isCompliant) ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Planifier au Calendrier
                </button>
                
                <button
                  id="btn-register-ift"
                  onClick={handleAddToIft}
                  disabled={isWeatherForbidden || !calculatedOutputs?.isCompliant}
                  className={`flex-1 py-3 px-4 rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition-all font-semibold text-sm flex items-center justify-center gap-x-2 cursor-pointer ${
                    (isWeatherForbidden || !calculatedOutputs?.isCompliant) ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Ajouter au Registre d'Exploitation (IFT)
                </button>

                {/* Print button */}
                <button
                  id="btn-print-phytos"
                  onClick={() => window.print()}
                  className="py-3 px-4 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center justify-center gap-x-1.5 cursor-pointer transition-all"
                  title="Imprimer ou enregistrer en PDF de chantier"
                >
                  <FileDown className="w-4.5 h-4.5" />
                  Imprimer
                </button>
              </div>

              {/* Status/Banner alerts */}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-100 text-emerald-805 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-x-2 border border-emerald-200"
                  >
                    <Check className="w-4 h-4 rounded-full bg-emerald-500 text-white p-0.5 shrink-0" />
                    <span>
                      {saveSuccess.type === 'calendar' 
                        ? "Traitement phytosanitaire planifié avec succès dans votre calendrier !" 
                        : "Le traitement a été consigné au registre officiel de l'exploitation pour le suivi de l'IFT."}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

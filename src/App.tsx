import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { EPHY_PRODUCTS, EPhyProduct } from './data/ephyProducts';
import { getInputItem, saveInputItem } from './utils/indexedDB';
import { 
  Leaf, 
  Droplets, 
  Sparkles, 
  AlertTriangle, 
  Wind, 
  Thermometer, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  Layers, 
  Info, 
  Compass, 
  ChevronRight, 
  ArrowRight,
  Droplet,
  Heart,
  BookOpen,
  Calendar,
  Scale,
  Sun,
  Moon,
  Laptop,
  Printer,
  FileText,
  Bot,
  Upload,
  Trash2,
  Loader2,
  Search,
  Building2,
  MapPin,
  Clock,
  HelpCircle,
  Share2,
  Bell,
  BellRing,
  Download,
  X,
  Eye,
  EyeOff,
  Filter,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { shareFichePDF } from './utils/pdfGenerator';
import ZntCalculator from './components/ZntCalculator';
import TreatmentCalendar from './components/TreatmentCalendar';
import HveIftDashboard from './components/HveIftDashboard';
import HelpTutorials from './components/HelpTutorials';
import { AppMode, AgriInputs, JardinInputs, ExploitationData, Applicator, Parcelle, ParcelleGroup, HistoricalFiche, ManualIftTreatment } from './types';
import { 
  calculateAgri, 
  calculateJardin, 
  getWeatherAdvisory, 
  WEED_PRESETS, 
  CONCENTRATION_OPTIONS 
} from './utils/calculations';

export default function App() {
  const [mode, setMode] = useState<AppMode>('agri');

  // Tracking online status for PWA/IndexedDB synchronization indicator
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Deferred Installation prompt tracking
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hide_pwa_install_banner') !== 'true';
    }
    return true;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Choix de l'utilisateur : ${outcome}`);
    if (outcome === 'accepted') {
      localStorage.setItem('hide_pwa_install_banner', 'true');
      setShowPwaBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleClosePwaBanner = () => {
    localStorage.setItem('hide_pwa_install_banner', 'true');
    setShowPwaBanner(false);
  };

  // Theme preference setting: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('theme_preference');
      if (savedPref === 'light' || savedPref === 'dark' || savedPref === 'system') {
        return savedPref;
      }
      const legacyTheme = localStorage.getItem('theme');
      if (legacyTheme === 'dark') return 'dark';
      if (legacyTheme === 'light') return 'light';
    }
    return 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Synchronize isDarkMode with themeMode & media queries
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let activeDark = false;
      if (themeMode === 'system') {
        activeDark = mediaQuery.matches;
      } else {
        activeDark = (themeMode === 'dark');
      }
      setIsDarkMode(activeDark);
      
      // Update class on HTML/Document element for Tailwind support
      document.documentElement.classList.toggle('dark', activeDark);
      localStorage.setItem('theme', activeDark ? 'dark' : 'light');
    };

    applyTheme();

    const handleChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setIsDarkMode(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
        localStorage.setItem('theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Regulatory treatment sheet inputs
  const [ficheInputs, setFicheInputs] = useState({
    date: new Date().toISOString().split('T')[0],
    applicateur: 'L. Autreau',
    parcelle: 'Parcelle Nord - Vignes',
    produitNom: 'Substitut Biocontrôle / Glyphosate',
    zntRespect: true,
    epiComplet: true,
    tripleRincage: true,
    isScheduled: false
  });

  // Mode Pro State
  const [isProMode, setIsProMode] = useState<boolean>(false);

  // Default Exploitation Data
  const DEFAULT_EXPLOITATION_DATA: ExploitationData = {
    id: 'exp-1',
    nom: 'Domaine de Bel Air',
    agrement: 'AG-12345-6789',
    applicators: [
      { id: '1', name: 'Jean Dupont', certiphyto: 'CP-9876-001' },
      { id: '2', name: 'L. Autreau', certiphyto: 'CP-4321-002' }
    ],
    parcelles: [
      { id: 'p1', name: "Les Côtes d'Or", village: 'Gevrey', cru: 'Premier Cru', surface: 3.5, cepage: 'Pinot Noir' },
      { id: 'p2', name: 'Sous la Roche', village: 'Chablis', cru: 'Grand Cru', surface: 1.8, cepage: 'Chardonnay' },
      { id: 'p3', name: 'Le Closeau', village: 'Nuits-Saint-Georges', cru: 'Village', surface: 5.2, cepage: 'Pinot Noir' }
    ],
    groupements: [
      { id: 'g1', name: 'Vignes Rouges', parcelleIds: ['p1', 'p3'] }
    ],
    hveCropType: 'viticulture',
    manualIftTreatments: []
  };

  // Exploitations list state
  const [exploitations, setExploitations] = useState<ExploitationData[]>([DEFAULT_EXPLOITATION_DATA]);
  const [activeExploitationId, setActiveExploitationId] = useState<string>('exp-1');

  // Computed current exploitation data
  const exploitationData = useMemo(() => {
    return exploitations.find(e => e.id === activeExploitationId) || exploitations[0] || DEFAULT_EXPLOITATION_DATA;
  }, [exploitations, activeExploitationId]);

  // Helper to update fields in current exploitation data
  const updateActiveExploitation = (updater: (prev: ExploitationData) => ExploitationData) => {
    setExploitations(prevList => {
      return prevList.map(item => {
        if (item.id === activeExploitationId) {
          return updater(item);
        }
        return item;
      });
    });
  };

  // Historical fiches generated by user
  const [historicalFiches, setHistoricalFiches] = useState<HistoricalFiche[]>([]);
  const [ficheSearchQuery, setFicheSearchQuery] = useState('');
  const [ficheFilterMode, setFicheFilterMode] = useState<'all' | 'agri' | 'jardin'>('all');
  const [expandedFicheId, setExpandedFicheId] = useState<string | null>(null);
  const [ficheToDeleteId, setFicheToDeleteId] = useState<string | null>(null);

  // Form states for Mon Exploitation
  const [newExploitationName, setNewExploitationName] = useState('');
  const [newApplicatorName, setNewApplicatorName] = useState('');
  const [newApplicatorCertiphyto, setNewApplicatorCertiphyto] = useState('');

  const [newParcelName, setNewParcelName] = useState('');
  const [newParcelVillage, setNewParcelVillage] = useState('');
  const [newParcelCru, setNewParcelCru] = useState('');
  const [newParcelSurface, setNewParcelSurface] = useState('');
  const [newParcelCepage, setNewParcelCepage] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSelectedParcelles, setNewGroupSelectedParcelles] = useState<string[]>([]);

  // State trackers for displaying custom numeric input fields when "Autre" option is chosen
  const [isAgriTankCustom, setIsAgriTankCustom] = useState(false);
  const [isAgriConcCustom, setIsAgriConcCustom] = useState(false);
  const [isJardinTankCustom, setIsJardinTankCustom] = useState(false);
  const [isJardinBuseCustom, setIsJardinBuseCustom] = useState(false);
  const [isJardinConcCustom, setIsJardinConcCustom] = useState(false);

  // State for sharing feedback
  const [shareStatus, setShareStatus] = useState<{
    type: 'success' | 'info' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (shareStatus.type) {
      const timer = setTimeout(() => {
        setShareStatus({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [shareStatus.type]);

  // Interactive help toggle state
  const [interactiveHelp, setInteractiveHelp] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedHelp = localStorage.getItem('interactive_help');
      return savedHelp === 'true';
    }
    return false;
  });

  // Agriculture state
  const [agriInputs, setAgriInputs] = useState<AgriInputs>({
    surface: 5,               // hectares
    doseProduct: 3,           // L/ha
    volumeWater: 120,         // L/ha
    tankCapacity: 800,        // Liters
    productConcentration: 360, // g/L
    ephyProductId: 'roundup-360',
    isDry: false,
    productName: 'Roundup Power 360',
    activeIngredient: 'Glyphosate',
    ammNumber: '2170327',
    unit: 'g/L',
    reentryDelay: '6 heures',
    harvestDelay: 'Exempt'
  });

  const [agriCropType, setAgriCropType] = useState<'grandes_cultures' | 'viticulture' | 'arboriculture'>('grandes_cultures');

  // Jardin state
  const [jardinInputs, setJardinInputs] = useState<JardinInputs>({
    surface: 200,             // m²
    tankCapacity: 8,          // Liters
    weedType: 'annual',       // preset id
    dilutionPercent: 1.5,     // default for annual weeding
    coverageRate: 10,         // 10 m² treated per 1L mix
    productConcentration: 360, // g/L
    ephyProductId: 'roundup-360',
    isDry: false,
    productName: 'Roundup Power 360',
    activeIngredient: 'Glyphosate',
    ammNumber: '2170327',
    unit: 'g/L',
    reentryDelay: '6 heures',
    harvestDelay: 'Exempt'
  });

  // Weather station simulation state and presets
  const [weatherPreset, setWeatherPreset] = useState<string>('custom');

  const [weatherInput, setWeatherInput] = useState({
    temp: 18,
    wind: 8,
    humidity: 65
  });

  // GPS Weather synchronization states
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Weather sub-tabs and views
  const [weatherSubTab, setWeatherSubTab] = useState<'current' | 'history' | 'forecast'>('current');
  const [historyViewType, setHistoryViewType] = useState<'daily' | 'hourly'>('daily');
  const [fetchedWeather, setFetchedWeather] = useState<{
    historyDaily: any[];
    historyHourly: any[];
    forecastDaily: any[];
    forecastHourly: any[];
  } | null>(null);

  // AI Feature States
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiModelUsed, setAiModelUsed] = useState<string>('');
  const [aiGroundingChunks, setAiGroundingChunks] = useState<any[] | null>(null);
  const [isAiHighThinking, setIsAiHighThinking] = useState<boolean>(false);
  const [isAiMapsGrounding, setIsAiMapsGrounding] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // File upload reader
  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setAiImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setAiImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearAiImage = () => {
    setAiImageBase64(null);
    if (aiImagePreview) {
      URL.revokeObjectURL(aiImagePreview);
    }
    setAiImagePreview(null);
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt && !aiImageBase64) return;

    setIsAiLoading(true);
    setAiError(null);
    setAiResponse('');
    setAiGroundingChunks(null);
    setAiModelUsed('');

    let latitude: number | undefined;
    let longitude: number | undefined;

    // Retrieve GPS coordinates if Maps Grounding is checked
    if (isAiMapsGrounding) {
      if (gpsCoords) {
        latitude = gpsCoords.lat;
        longitude = gpsCoords.lon;
      } else if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4050 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (err) {
          console.warn("Could not get GPS for AI Maps Grounding:", err);
        }
      }
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          image: aiImageBase64,
          isHighThinking: isAiHighThinking,
          isMapsGrounding: isAiMapsGrounding,
          lat: latitude,
          lon: longitude
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de l'assistant IA.");
      }

      setAiResponse(data.text);
      setAiGroundingChunks(data.groundingChunks);
      setAiModelUsed(data.modelUsed);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Impossible d'obtenir une réponse de l'assistant IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Utility to simulate localized weather based on current system hour
  const getRealTimeWeather = (date: Date) => {
    const hour = date.getHours();
    // June temperatures typical range is 12°C to 28°C
    const tempOffset = Math.sin((hour - 9) * Math.PI / 12); // -1 to +1
    const temp = Math.round(18 + tempOffset * 8); // 10°C to 26°C
    
    // Relative Humidity is higher at dawn/night, lower in mid-afternoon
    const humidity = Math.round(65 - tempOffset * 25); // 40% to 90%
    
    // Wind speeds are also usually variable, lower at night, higher around 2-4 PM
    const windOffset = Math.sin((hour - 8) * Math.PI / 12);
    const wind = Math.max(2, Math.round(8 + windOffset * 6)); // 2 to 14 km/h
    
    return { temp, wind, humidity };
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      setIsGpsLoading(true);
      setGpsError(null);
      // Query current, hourly + daily forecasts, and past 7 days from open-meteo
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&past_days=7&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max,weather_code&timezone=auto`
      );
      if (!response.ok) {
        throw new Error("Impossible d'accéder au serveur météo open-meteo.com");
      }
      const data = await response.json();
      if (data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const wind = Math.round(data.current.wind_speed_10m);
        const humidity = Math.round(data.current.relative_humidity_2m);
        
        setWeatherInput({ temp, wind, humidity });
        setGpsCoords({ lat, lon });

        // Parse past & future lists
        try {
          const processed = processOpenMeteoData(data);
          if (processed) {
            setFetchedWeather(processed);
          }
        } catch (parseErr) {
          console.warn("Failed to parse detailed Open-Meteo data:", parseErr);
        }
      } else {
        throw new Error("Format de réponse météo incorrect.");
      }
    } catch (err: any) {
      console.error(err);
      setGpsError(err.message || "Erreur lors de la récupération des données météo.");
      // Fallback to offline/mock real-time weather
      const live = getRealTimeWeather(new Date());
      setWeatherInput(live);
    } finally {
      setIsGpsLoading(false);
    }
  };

  const processOpenMeteoData = (data: any) => {
    if (!data || !data.daily || !data.hourly) return null;
    
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    
    // 1. History Daily (7 past days: indices 0 to 6)
    const historyDaily = [];
    for (let i = 0; i < 7; i++) {
      if (data.daily.time && data.daily.time[i]) {
        const dateVal = new Date(data.daily.time[i]);
        const maxT = Math.round(data.daily.temperature_2m_max[i] || 15);
        const minT = Math.round(data.daily.temperature_2m_min[i] || 8);
        const windSpeed = Math.round(data.daily.wind_speed_10m_max[i] || 10);
        const code = data.daily.weather_code ? data.daily.weather_code[i] : 0;
        const avgT = Math.round((minT + maxT) / 2);
        
        historyDaily.push({
          timestamp: dateVal.getTime(),
          date: `${daysOfWeek[dateVal.getDay()]} ${dateVal.getDate()} ${months[dateVal.getMonth()]}`,
          tempMin: minT,
          tempMax: maxT,
          wind: windSpeed,
          humidity: 65,
          rainProb: data.daily.precipitation_probability_max ? Math.round(data.daily.precipitation_probability_max[i] || 0) : 0,
          code: code,
          verdict: getWeatherAdvisory(avgT, windSpeed, 65)
        });
      }
    }

    // 2. History Hourly (last 24 hours of the past segment: hours 144 to 167)
    const historyHourly = [];
    for (let i = 144; i < 168; i++) {
      if (data.hourly.time && data.hourly.time[i]) {
        const dateVal = new Date(data.hourly.time[i]);
        const temp = Math.round(data.hourly.temperature_2m[i] || 15);
        const wind = Math.round(data.hourly.wind_speed_10m[i] || 10);
        const humidity = Math.round(data.hourly.relative_humidity_2m[i] || 60);
        const code = data.hourly.weather_code ? data.hourly.weather_code[i] : 0;
        
        historyHourly.push({
          time: dateVal.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temp,
          wind,
          humidity,
          code,
          verdict: getWeatherAdvisory(temp, wind, humidity)
        });
      }
    }

    // 3. Forecast Daily (next 7 days: indices 7 to 13)
    const forecastDaily = [];
    for (let i = 7; i < 14; i++) {
      if (data.daily.time && data.daily.time[i]) {
        const dateVal = new Date(data.daily.time[i]);
        const maxT = Math.round(data.daily.temperature_2m_max[i] || 15);
        const minT = Math.round(data.daily.temperature_2m_min[i] || 8);
        const windSpeed = Math.round(data.daily.wind_speed_10m_max[i] || 10);
        const rainProb = data.daily.precipitation_probability_max ? Math.round(data.daily.precipitation_probability_max[i] || 15) : 15;
        const code = data.daily.weather_code ? data.daily.weather_code[i] : 0;
        const avgT = Math.round((minT + maxT) / 2);
        
        forecastDaily.push({
          date: `${daysOfWeek[dateVal.getDay()]} ${dateVal.getDate()} ${months[dateVal.getMonth()]}`,
          tempMin: minT,
          tempMax: maxT,
          wind: windSpeed,
          humidity: 60,
          rainProb,
          code,
          verdict: getWeatherAdvisory(avgT, windSpeed, 60)
        });
      }
    }

    // 4. Forecast Hourly (next 24 hours: indices 168 to 191)
    const forecastHourly = [];
    for (let i = 168; i < 192; i++) {
      if (data.hourly.time && data.hourly.time[i]) {
        const dateVal = new Date(data.hourly.time[i]);
        const temp = Math.round(data.hourly.temperature_2m[i] || 15);
        const wind = Math.round(data.hourly.wind_speed_10m[i] || 10);
        const humidity = Math.round(data.hourly.relative_humidity_2m[i] || 60);
        const rainProb = data.hourly.precipitation_probability ? Math.round(data.hourly.precipitation_probability[i] || 10) : 10;
        const code = data.hourly.weather_code ? data.hourly.weather_code[i] : 0;
        
        forecastHourly.push({
          time: dateVal.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          temp,
          wind,
          humidity,
          rainProb,
          code,
          verdict: getWeatherAdvisory(temp, wind, humidity)
        });
      }
    }

    return { historyDaily, historyHourly, forecastDaily, forecastHourly };
  };

  const handleGpsSync = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas prise en charge par votre navigateur ou appareil.");
      const live = getRealTimeWeather(new Date());
      setWeatherInput(live);
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);
    setGpsCoords(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation warning:", err);
        let msg = "Accès GPS refusé ou indisponible.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Autorisation d'accès à la position GPS refusée par l'appareil.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Position indisponible (signal GPS trop faible ou désactivé).";
        } else if (err.code === err.TIMEOUT) {
          msg = "Délai de connexion GPS dépassé.";
        }
        setGpsError(msg);
        // Fallback to offline time calculation
        const live = getRealTimeWeather(new Date());
        setWeatherInput(live);
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const applyWeatherPreset = (presetKey: string) => {
    setWeatherPreset(presetKey);
    let temp = weatherInput.temp;
    let wind = weatherInput.wind;
    let humidity = weatherInput.humidity;

    if (presetKey === 'realtime') {
      const live = getRealTimeWeather(new Date());
      temp = live.temp;
      wind = live.wind;
      humidity = live.humidity;
      setWeatherInput({ temp, wind, humidity });
    } else if (presetKey === 'gps-realtime') {
      handleGpsSync();
      // Executed asynchronously inside handleGpsSync()
    } else if (presetKey === 'optimal') {
      temp = 16;
      wind = 6;
      humidity = 72;
      setWeatherInput({ temp, wind, humidity });
    } else if (presetKey === 'windy') {
      temp = 20;
      wind = 22;
      humidity = 50;
      setWeatherInput({ temp, wind, humidity });
    } else if (presetKey === 'hot') {
      temp = 32;
      wind = 12;
      humidity = 32;
      setWeatherInput({ temp, wind, humidity });
    } else if (presetKey === 'cold') {
      temp = 6;
      wind = 4;
      humidity = 92;
      setWeatherInput({ temp, wind, humidity });
    } else if (presetKey === 'wet') {
      temp = 12;
      wind = 2;
      humidity = 97;
      setWeatherInput({ temp, wind, humidity });
    }
  };

  // State for automatic dilution calculator (Calculateur de dilution automatique)
  const [dilutionInputs, setDilutionInputs] = useState({
    targetVolume: 5,        // L
    dilutionType: 'percent', // 'percent' | 'ratio' | 'conc'
    percentValue: 2,        // %
    ratioValue: 50,         // 1:50
    motherConc: 360,        // g/L
    targetConc: 7.2         // g/L
  });
  const [isDilutionCustomMother, setIsDilutionCustomMother] = useState(false);
  const [isDilutionCustomTarget, setIsDilutionCustomTarget] = useState(false);

  // Load and auto-save via IndexedDB
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      try {
        const savedMode = await getInputItem('mode');
        if (savedMode) setMode(savedMode);

        const savedFiche = await getInputItem('ficheInputs');
        if (savedFiche) setFicheInputs((prev) => ({ ...prev, ...savedFiche }));

        const savedAgri = await getInputItem('agriInputs');
        if (savedAgri) setAgriInputs((prev) => ({ ...prev, ...savedAgri }));

        const savedJardin = await getInputItem('jardinInputs');
        if (savedJardin) setJardinInputs((prev) => ({ ...prev, ...savedJardin }));

        const savedWeather = await getInputItem('weatherInput');
        if (savedWeather) setWeatherInput((prev) => ({ ...prev, ...savedWeather }));

        const savedDilution = await getInputItem('dilutionInputs');
        if (savedDilution) setDilutionInputs((prev) => ({ ...prev, ...savedDilution }));

        const savedHelp = await getInputItem('interactiveHelp');
        if (savedHelp !== null) setInteractiveHelp(savedHelp);

        const savedProMode = await getInputItem('isProMode');
        if (savedProMode !== null) setIsProMode(savedProMode);

        const savedExploitations = await getInputItem<ExploitationData[]>('exploitations');
        const savedActiveId = await getInputItem<string>('activeExploitationId');
        
        let loadedExploitations = savedExploitations;
        let loadedActiveId = savedActiveId;

        if (loadedExploitations && Array.isArray(loadedExploitations)) {
          loadedExploitations = loadedExploitations.map(exp => ({
            ...exp,
            hveCropType: exp.hveCropType || 'viticulture',
            manualIftTreatments: exp.manualIftTreatments || []
          }));
        }

        if (!loadedExploitations || loadedExploitations.length === 0) {
          const savedExploitationData = await getInputItem<any>('exploitationData');
          if (savedExploitationData) {
            const legacyData: ExploitationData = {
              id: savedExploitationData.id || 'exp-legacy',
              nom: savedExploitationData.nom || 'Domaine de Bel Air',
              agrement: savedExploitationData.agrement || '',
              applicators: savedExploitationData.applicators || [],
              parcelles: savedExploitationData.parcelles || [],
              groupements: savedExploitationData.groupements || [],
              hveCropType: savedExploitationData.hveCropType || 'viticulture',
              manualIftTreatments: savedExploitationData.manualIftTreatments || []
            };
            loadedExploitations = [legacyData];
            loadedActiveId = legacyData.id;
          } else {
            loadedExploitations = [DEFAULT_EXPLOITATION_DATA];
            loadedActiveId = DEFAULT_EXPLOITATION_DATA.id;
          }
        }

        setExploitations(loadedExploitations);
        if (loadedActiveId) {
          setActiveExploitationId(loadedActiveId);
        } else if (loadedExploitations.length > 0) {
          setActiveExploitationId(loadedExploitations[0].id);
        }

        const savedFiches = await getInputItem<HistoricalFiche[]>('fiches_historique');
        if (savedFiches) setHistoricalFiches(savedFiches);

        // Load custom field toggles
        const activeAgriTank = await getInputItem('isAgriTankCustom');
        if (activeAgriTank !== null) setIsAgriTankCustom(activeAgriTank);

        const activeAgriConc = await getInputItem('isAgriConcCustom');
        if (activeAgriConc !== null) setIsAgriConcCustom(activeAgriConc);

        const activeJardinTank = await getInputItem('isJardinTankCustom');
        if (activeJardinTank !== null) setIsJardinTankCustom(activeJardinTank);

        const activeJardinBuse = await getInputItem('isJardinBuseCustom');
        if (activeJardinBuse !== null) setIsJardinBuseCustom(activeJardinBuse);

        const activeJardinConc = await getInputItem('isJardinConcCustom');
        if (activeJardinConc !== null) setIsJardinConcCustom(activeJardinConc);

        const activeDilModule = await getInputItem('isDilutionCustomMother');
        if (activeDilModule !== null) setIsDilutionCustomMother(activeDilModule);

        const activeDilTarget = await getInputItem('isDilutionCustomTarget');
        if (activeDilTarget !== null) setIsDilutionCustomTarget(activeDilTarget);

      } catch (err) {
        console.error('[IndexedDB] Erreur lors du chargement des données initiales:', err);
      } finally {
        setDbLoaded(true);
      }
    }
    loadSavedData();
  }, []);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('mode', mode);
    }
  }, [mode, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('ficheInputs', ficheInputs);
    }
  }, [ficheInputs, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('agriInputs', agriInputs);
    }
  }, [agriInputs, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('jardinInputs', jardinInputs);
    }
  }, [jardinInputs, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('weatherInput', weatherInput);
    }
  }, [weatherInput, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('dilutionInputs', dilutionInputs);
    }
  }, [dilutionInputs, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) {
      saveInputItem('interactiveHelp', interactiveHelp);
    }
  }, [interactiveHelp, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isAgriTankCustom', isAgriTankCustom);
  }, [isAgriTankCustom, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isAgriConcCustom', isAgriConcCustom);
  }, [isAgriConcCustom, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isJardinTankCustom', isJardinTankCustom);
  }, [isJardinTankCustom, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isJardinBuseCustom', isJardinBuseCustom);
  }, [isJardinBuseCustom, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isJardinConcCustom', isJardinConcCustom);
  }, [isJardinConcCustom, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isDilutionCustomMother', isDilutionCustomMother);
  }, [isDilutionCustomMother, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isDilutionCustomTarget', isDilutionCustomTarget);
  }, [isDilutionCustomTarget, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('isProMode', isProMode);
  }, [isProMode, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('exploitations', exploitations);
  }, [exploitations, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('activeExploitationId', activeExploitationId);
  }, [activeExploitationId, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('exploitationData', exploitationData);
  }, [exploitationData, dbLoaded]);

  useEffect(() => {
    if (dbLoaded) saveInputItem('fiches_historique', historicalFiches);
  }, [historicalFiches, dbLoaded]);

  // Exploitations Management Handlers
  const handleAddNewExploitation = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = 'exp-' + Date.now().toString();
    const newExp: ExploitationData = {
      id: newId,
      nom: trimmed,
      agrement: '',
      applicators: [],
      parcelles: [],
      groupements: []
    };
    setExploitations(prev => [...prev, newExp]);
    setActiveExploitationId(newId);
  };

  const handleDeleteExploitation = (idDeleted: string) => {
    if (exploitations.length <= 1) return;
    setExploitations(prev => prev.filter(e => e.id !== idDeleted));
    if (activeExploitationId === idDeleted) {
      const remaining = exploitations.filter(e => e.id !== idDeleted);
      setActiveExploitationId(remaining[0].id);
    }
  };

  // Exploitation Handlers
  const handleUpdateExploitationInfo = (field: 'nom' | 'agrement', value: string) => {
    updateActiveExploitation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddApplicator = (name: string, certiphyto: string) => {
    if (!name.trim()) return;
    const newApp: Applicator = {
      id: Date.now().toString(),
      name: name.trim(),
      certiphyto: certiphyto.trim() || 'Non renseigné'
    };
    updateActiveExploitation(prev => ({
      ...prev,
      applicators: [...prev.applicators, newApp]
    }));
  };

  const handleDeleteApplicator = (id: string) => {
    updateActiveExploitation(prev => ({
      ...prev,
      applicators: prev.applicators.filter(item => item.id !== id)
    }));
  };

  const handleAddParcelle = (parcel: { name: string; village: string; cru: string; surface: number; cepage: string }) => {
    if (!parcel.name.trim()) return;
    const newParcel: Parcelle = {
      id: 'p-' + Date.now().toString(),
      name: parcel.name.trim(),
      village: parcel.village.trim() || 'Non renseigné',
      cru: parcel.cru.trim() || 'N/A',
      surface: Number(parcel.surface) || 0,
      cepage: parcel.cepage.trim() || 'Non spécifié'
    };
    updateActiveExploitation(prev => ({
      ...prev,
      parcelles: [...prev.parcelles, newParcel]
    }));
  };

  const handleDeleteParcelle = (id: string) => {
    updateActiveExploitation(prev => ({
      ...prev,
      parcelles: prev.parcelles.filter(p => p.id !== id),
      groupements: prev.groupements.map(g => ({
        ...g,
        parcelleIds: g.parcelleIds.filter(pid => pid !== id)
      })).filter(g => g.parcelleIds.length > 0)
    }));
  };

  const handleAddGroupement = (name: string, pIds: string[]) => {
    if (!name.trim() || pIds.length === 0) return;
    const newGroup: ParcelleGroup = {
      id: 'g-' + Date.now().toString(),
      name: name.trim(),
      parcelleIds: pIds
    };
    updateActiveExploitation(prev => ({
      ...prev,
      groupements: [...prev.groupements, newGroup]
    }));
  };

  const handleDeleteGroupement = (id: string) => {
    updateActiveExploitation(prev => ({
      ...prev,
      groupements: prev.groupements.filter(g => g.id !== id)
    }));
  };

  // IFT and HVE Handlers
  const handleUpdateHveCropType = (type: 'grandes_cultures' | 'viticulture' | 'arboriculture') => {
    updateActiveExploitation(prev => ({
      ...prev,
      hveCropType: type
    }));
  };

  const handleAddManualIft = (date: string, parcelle: string, appliedDose: number, productConcentration: number, notes?: string) => {
    const newTr: ManualIftTreatment = {
      id: 'mit-' + Date.now().toString(),
      date,
      parcelle,
      appliedDose,
      productConcentration,
      notes
    };
    updateActiveExploitation(prev => ({
      ...prev,
      manualIftTreatments: [...(prev.manualIftTreatments || []), newTr]
    }));
  };

  const handleDeleteManualIft = (id: string) => {
    updateActiveExploitation(prev => ({
      ...prev,
      manualIftTreatments: (prev.manualIftTreatments || []).filter(t => t.id !== id)
    }));
  };

  // Historical Fiches Actions
  const handleDownloadHistoricalPDF = (fiche: HistoricalFiche) => {
    try {
      const link = document.createElement('a');
      link.href = fiche.pdfBase64;
      link.download = fiche.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur lors du téléchargement de la fiche historique :', err);
    }
  };

  const handleShareHistoricalPDF = async (fiche: HistoricalFiche) => {
    try {
      const resBase64 = fiche.pdfBase64;
      if (!resBase64) {
        handleDownloadHistoricalPDF(fiche);
        return;
      }
      const arr = resBase64.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], fiche.fileName, { type: mime });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Fiche de Traitement - ${fiche.ficheInputs.parcelle || 'Parcelle'}`,
          text: `Retrouvez la fiche de traitement réglementaire pour la parcelle "${fiche.ficheInputs.parcelle || 'N/A'}" émise le ${fiche.ficheInputs.date}.`
        });
      } else {
        handleDownloadHistoricalPDF(fiche);
      }
    } catch (err) {
      console.warn('[Web Share] Echec du partage, repli vers téléchargement:', err);
      handleDownloadHistoricalPDF(fiche);
    }
  };

  const handleDeleteHistoricalFiche = (id: string) => {
    setHistoricalFiches(prev => prev.filter(f => f.id !== id));
    if (expandedFicheId === id) setExpandedFicheId(null);
    if (ficheToDeleteId === id) setFicheToDeleteId(null);
  };

  // Compute dilution outputs
  const dilutionOutputs = useMemo(() => {
    const totalVolumeL = dilutionInputs.targetVolume || 0;
    let productVolumeMl = 0;
    
    if (dilutionInputs.dilutionType === 'percent') {
      const pct = dilutionInputs.percentValue || 0;
      productVolumeMl = totalVolumeL * (pct / 100) * 1000;
    } else if (dilutionInputs.dilutionType === 'ratio') {
      const ratio = dilutionInputs.ratioValue || 1;
      const factor = 1 / (ratio + 1);
      productVolumeMl = totalVolumeL * factor * 1000;
    } else if (dilutionInputs.dilutionType === 'conc') {
      const c1 = dilutionInputs.motherConc || 360;
      const c2 = dilutionInputs.targetConc || 0;
      if (c1 > 0) {
        const factor = c2 / c1;
        productVolumeMl = totalVolumeL * factor * 1000;
      }
    }
    
    const productVolumeL = productVolumeMl / 1000;
    const waterVolumeL = Math.max(0, totalVolumeL - productVolumeL);
    
    return {
      productMl: Number(productVolumeMl.toFixed(1)),
      productL: Number(productVolumeL.toFixed(3)),
      waterL: Number(waterVolumeL.toFixed(3))
    };
  }, [dilutionInputs]);

  // Compute Agri outputs
  const agriOutputs = useMemo(() => calculateAgri(agriInputs), [agriInputs]);

  // Compute Jardin outputs
  const currentPreset = useMemo(() => {
    return WEED_PRESETS.find(p => p.id === jardinInputs.weedType);
  }, [jardinInputs.weedType]);

  const jardinOutputs = useMemo(() => {
    const activePercent = jardinInputs.weedType === 'custom' 
      ? jardinInputs.dilutionPercent 
      : (currentPreset?.dilutionPercent || 1.5);
    return calculateJardin({
      ...jardinInputs,
      dilutionPercent: activePercent
    });
  }, [jardinInputs, currentPreset]);

  // Compute current weather advisory
  const weatherAdvisory = useMemo(() => {
    return getWeatherAdvisory(weatherInput.temp, weatherInput.wind, weatherInput.humidity);
  }, [weatherInput]);

  // Generate weather history and forecast collections
  const weatherCollections = useMemo(() => {
    if (fetchedWeather) {
      return fetchedWeather;
    }
    
    // Fallback: generate high-fidelity, interactive simulated weather lists
    const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const tempBase = weatherInput.temp;
    const windBase = weatherInput.wind;
    const humidityBase = weatherInput.humidity;
    
    const historyDaily = [];
    const historyHourly = [];
    const forecastDaily = [];
    const forecastHourly = [];

    // Generate 7 past days (History Daily)
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = `${daysOfWeek[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
      
      const tShift = Math.sin(i * 1.7) * 4;
      const tempMin = Math.round(Math.max(2, tempBase - 6 + tShift));
      const tempMax = Math.round(Math.max(tempMin + 3, tempBase + 2 + tShift));
      const wind = Math.round(Math.max(1, windBase + Math.cos(i * 1.3) * 5));
      const humidity = Math.round(Math.min(100, Math.max(25, humidityBase + Math.sin(i * 0.9) * 12)));
      const rainProb = Math.round(Math.max(0, 30 + Math.sin(i * 2.2) * 30));
      
      historyDaily.push({
        timestamp: d.getTime(),
        date: dayLabel,
        tempMin,
        tempMax,
        wind,
        humidity,
        rainProb,
        verdict: getWeatherAdvisory(Math.round((tempMin + tempMax) / 2), wind, humidity)
      });
    }

    // Generate 24 past hours (History Hourly)
    const currentHour = new Date().getHours();
    for (let i = 24; i >= 1; i--) {
      const h = (currentHour - i + 24) % 24;
      const hLabel = `${String(h).padStart(2, '0')}:00`;
      
      const tShift = Math.sin((h - 6) * Math.PI / 12) * 5;
      const temp = Math.round(Math.max(2, tempBase + tShift));
      const wind = Math.round(Math.max(0, windBase + Math.cos(h * Math.PI / 12) * 3));
      const humidity = Math.round(Math.min(100, Math.max(20, humidityBase - tShift * 2.5)));
      
      historyHourly.push({
        time: hLabel,
        temp,
        wind,
        humidity,
        verdict: getWeatherAdvisory(temp, wind, humidity)
      });
    }

    // Generate 7 next days (Forecast Daily)
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayLabel = `${daysOfWeek[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
      
      const tShift = Math.sin(i * 2.1) * 3;
      const tempMin = Math.round(Math.max(2, tempBase - 5 + tShift));
      const tempMax = Math.round(Math.max(tempMin + 4, tempBase + 3 + tShift));
      const wind = Math.round(Math.max(1, windBase + Math.sin(i * 1.1) * 6));
      const humidity = Math.round(Math.min(100, Math.max(25, humidityBase + Math.cos(i * 1.5) * 10)));
      const rainProb = Math.round(Math.max(0, 25 + Math.sin(i * 1.8) * 25));
      
      forecastDaily.push({
        date: dayLabel,
        tempMin,
        tempMax,
        wind,
        humidity,
        rainProb,
        verdict: getWeatherAdvisory(Math.round((tempMin + tempMax) / 2), wind, humidity)
      });
    }

    // Generate 24 next hours (Forecast Hourly)
    for (let i = 1; i <= 24; i++) {
      const h = (currentHour + i) % 24;
      const hLabel = `${String(h).padStart(2, '0')}:00`;
      
      const tShift = Math.sin((h - 6) * Math.PI / 12) * 5.5;
      const temp = Math.round(Math.max(2, tempBase + tShift));
      const wind = Math.round(Math.max(0, windBase + Math.sin(h * Math.PI / 12) * 4));
      const humidity = Math.round(Math.min(100, Math.max(20, humidityBase - tShift * 2.2)));
      const rainProb = Math.round(Math.max(0, 15 + Math.cos(h * Math.PI / 12) * 15));
      
      forecastHourly.push({
        time: hLabel,
        temp,
        wind,
        humidity,
        rainProb,
        verdict: getWeatherAdvisory(temp, wind, humidity)
      });
    }

    return { historyDaily, historyHourly, forecastDaily, forecastHourly };
  }, [fetchedWeather, weatherInput]);

  const reversedHistoryData = useMemo(() => {
    if (!weatherCollections?.historyDaily) return [];
    return [...weatherCollections.historyDaily]
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(item => ({
        ...item,
        shortDate: item.date ? item.date.split(' ').slice(0, 2).join(' ') : '',
      }));
  }, [weatherCollections]);

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isWindAlertTriggered, setIsWindAlertTriggered] = useState<boolean>(false);

  // Auto-request notifications when scheduling a treatment
  useEffect(() => {
    if (ficheInputs.isScheduled && notificationPermission === 'default') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            setShareStatus({
              type: 'success',
              message: 'Notifications activées pour la surveillance météo en arrière-plan !'
            });
          } else {
            setShareStatus({
              type: 'error',
              message: 'Permissions de notification refusées. Veuillez les activer manuellement dans les réglages.'
            });
          }
        });
      }
    }
  }, [ficheInputs.isScheduled, notificationPermission]);

  // Background weather monitoring triggers a push notification if wind becomes critical (> 19 km/h)
  useEffect(() => {
    if (!ficheInputs.isScheduled) {
      setIsWindAlertTriggered(false);
      return;
    }

    const currentWind = weatherInput.wind;

    if (currentWind > 19) {
      if (!isWindAlertTriggered) {
        // Send a native system notification through service worker or fallback natively
        if (notificationPermission === 'granted') {
          const title = "⚠️ Alerte Dérive Météo Critique !";
          const body = `Conditions critiques pour le traitement planifié sur la "${ficheInputs.parcelle || 'zone'}". Vent à ${currentWind} km/h (limite légale 19 km/h pour la dérive).`;

          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: '/icon.svg',
                badge: '/icon.svg',
                vibrate: [200, 100, 200],
                tag: 'wind-warning-alert',
                renotify: true
              } as any);
            });
          } else if ('Notification' in window) {
            new Notification(title, {
              body,
              icon: '/icon.svg'
            });
          }
          setIsWindAlertTriggered(true);
        }
      }
    } else {
      // Wind speed went below critical threshold, reset trigger flag so it can alert again
      setIsWindAlertTriggered(false);
    }
  }, [weatherInput.wind, ficheInputs.isScheduled, notificationPermission, isWindAlertTriggered, ficheInputs.parcelle]);

  // Manual Trigger Simulation option for easy evaluation
  const handleSimulateCriticalAlert = () => {
    if (typeof window === 'undefined') return;
    
    if (notificationPermission !== 'granted') {
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            triggerMockNotification();
          } else {
            setShareStatus({
              type: 'error',
              message: "Notifications bloquées. Veuillez les autoriser pour tester cette simulation."
            });
          }
        });
      } else {
        setShareStatus({
          type: 'error',
          message: "Notifications système non supportées sur ce périphérique."
        });
      }
    } else {
      triggerMockNotification();
    }
  };

  const triggerMockNotification = () => {
    const title = "🚨 [SIMULATION] Alerte Dérive Météo Critique !";
    const body = `Surveillance active en arrière-plan : Vent détecté de 23 km/h sur la "${ficheInputs.parcelle || 'Parcelle Nord'}". Limite légale de 19 km/h dépassée. Traitement à suspendre !`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/icon.svg',
          vibrate: [300, 150, 300],
          tag: 'wind-warning-alert-sim',
          renotify: true
        } as any);
      }).catch(() => {
        if ('Notification' in window) {
          new Notification(title, { body, icon: '/icon.svg' });
        }
      });
    } else if ('Notification' in window) {
      new Notification(title, { body, icon: '/icon.svg' });
    }
    
    setShareStatus({
      type: 'success',
      message: 'Notification push native de simulation envoyée !'
    });
  };

  const handleApplyZntToFiche = (zntVal: number) => {
    setFicheInputs(prev => ({
      ...prev,
      zntRespect: true
    }));
    setShareStatus({
      type: 'success',
      message: `Distance de Sécurité (ZNT) de ${zntVal}m appliquée & validée pour votre registre !`
    });
  };

  const handleLoadTaskIntoFiche = (task: any) => {
    setFicheInputs({
      date: task.date,
      applicateur: task.applicator,
      parcelle: task.parcelle,
      produitNom: task.produitNom,
      zntRespect: true,
      epiComplet: true,
      tripleRincage: true,
      isScheduled: true
    });
    setMode('agri');
    setShareStatus({
      type: 'success',
      message: `La planification pour la parcelle "${task.parcelle}" (${task.produitNom}) a bien prérempli votre Fiche de Traçabilité active !`
    });
  };

  const [isSharing, setIsSharing] = useState(false);

  const handleShareFiche = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareStatus({ type: 'info', message: 'Génération du document PDF en cours...' });

    const res = await shareFichePDF(
      mode,
      {
        ...ficheInputs,
        ...(isProMode ? {
          exploitationNom: exploitationData.nom,
          exploitationAgrement: exploitationData.agrement
        } : {})
      },
      agriInputs,
      agriOutputs,
      jardinInputs,
      jardinOutputs,
      weatherInput
    );

    setIsSharing(false);

    if (res.success) {
      // Save to history
      const safeParcelleName = (ficheInputs.parcelle || 'parcelle').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `fiche-traitement-${safeParcelleName}-${ficheInputs.date || 'date'}.pdf`;

      const id = Date.now().toString();
      const now = new Date();
      const dateGen = now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newFiche: HistoricalFiche = {
        id,
        dateGen,
        mode,
        fileName,
        pdfBase64: res.pdfBase64 || '',
        ficheInputs: {
          ...ficheInputs,
          exploitationNom: isProMode ? exploitationData.nom : undefined,
          exploitationAgrement: isProMode ? exploitationData.agrement : undefined,
        },
        weatherInput: { ...weatherInput },
        details: {
          surface: mode === 'agri' ? `${agriInputs.surface} ha` : `${jardinInputs.surface} m²`,
          totalProduct: mode === 'agri' ? `${agriOutputs.totalProduct} L` : `${jardinOutputs.totalProduct} ml`,
          totalWater: mode === 'agri' ? `${agriOutputs.totalWater} L` : `${jardinOutputs.totalWater} L`,
          totalBouillie: mode === 'agri' ? `${agriOutputs.totalBouillie} L` : `${jardinOutputs.totalBouillie} L`,
          rawSurface: mode === 'agri' ? agriInputs.surface : jardinInputs.surface,
          rawTotalProduct: mode === 'agri' ? agriOutputs.totalProduct : jardinOutputs.totalProduct,
          rawDoseProduct: mode === 'agri' ? agriInputs.doseProduct : jardinInputs.dilutionPercent,
          productConcentration: mode === 'agri' ? agriInputs.productConcentration : jardinInputs.productConcentration
        }
      };

      setHistoricalFiches(prev => [newFiche, ...prev]);

      if (res.method === 'share') {
        setShareStatus({ type: 'success', message: 'Fiche de traitement partagée et enregistrée dans votre historique !' });
      } else {
        setShareStatus({ type: 'success', message: 'Fiche PDF téléchargée et enregistrée dans votre historique !' });
      }
    } else {
      if (res.error === 'partage_annule') {
        setShareStatus({ type: 'info', message: 'Partage annulé par l\'utilisateur.' });
      } else {
        setShareStatus({ type: 'error', message: `Échec du partage: ${res.error}` });
      }
    }
  };

  // Handlers for Agri
  const handleAgriChange = (field: keyof AgriInputs, value: number) => {
    setAgriInputs(prev => ({
      ...prev,
      [field]: Math.max(0, value)
    }));
  };

  const handleAgriProductChange = (productId: string) => {
    if (productId === 'custom') {
      setAgriInputs(prev => ({
        ...prev,
        ephyProductId: 'custom',
        productName: prev.productName === 'Roundup Power 360' ? 'Produit Personnalisé' : prev.productName,
        activeIngredient: prev.activeIngredient === 'Glyphosate' ? 'Substance Active' : prev.activeIngredient,
        ammNumber: prev.ammNumber === '2170327' ? '0000000' : prev.ammNumber,
        isDry: prev.isDry ?? false,
        unit: prev.unit || 'g/L',
        reentryDelay: prev.reentryDelay || '6 heures',
        harvestDelay: prev.harvestDelay || '3 jours',
      }));
      return;
    }

    const product = EPHY_PRODUCTS.find(p => p.id === productId);
    if (product) {
      setAgriInputs(prev => ({
        ...prev,
        ephyProductId: product.id,
        productName: product.name,
        activeIngredient: product.substanceName,
        ammNumber: product.ammNumber,
        isDry: product.isDry,
        productConcentration: product.concentration,
        unit: product.unit,
        reentryDelay: product.reentryDelay,
        harvestDelay: product.harvestDelay,
        doseProduct: product.defaultDose,
        volumeWater: product.defaultWaterVolume
      }));
      setFicheInputs(prev => ({
        ...prev,
        produitNom: product.name
      }));
    }
  };

  // Handlers for Jardin
  const handleJardinChange = (field: keyof JardinInputs, value: any) => {
    setJardinInputs(prev => {
      const updated = { ...prev, [field]: value };
      // If weed type changes, auto-update the preset dilution percent
      if (field === 'weedType' && value !== 'custom') {
        const preset = WEED_PRESETS.find(p => p.id === value);
        if (preset) {
          updated.dilutionPercent = preset.dilutionPercent;
        }
      }
      return updated;
    });
  };

  const handleJardinProductChange = (productId: string) => {
    if (productId === 'custom') {
      setJardinInputs(prev => ({
        ...prev,
        ephyProductId: 'custom',
        productName: prev.productName === 'Roundup Power 360' ? 'Produit Personnalisé' : prev.productName,
        activeIngredient: prev.activeIngredient === 'Glyphosate' ? 'Substance Active' : prev.activeIngredient,
        ammNumber: prev.ammNumber === '2170327' ? '0000000' : prev.ammNumber,
        isDry: prev.isDry ?? false,
        unit: prev.unit || 'g/L',
        reentryDelay: prev.reentryDelay || '6 heures',
        harvestDelay: prev.harvestDelay || '3 jours',
      }));
      return;
    }

    const product = EPHY_PRODUCTS.find(p => p.id === productId);
    if (product) {
      setJardinInputs(prev => ({
        ...prev,
        ephyProductId: product.id,
        productName: product.name,
        activeIngredient: product.substanceName,
        ammNumber: product.ammNumber,
        isDry: product.isDry,
        productConcentration: product.concentration,
        unit: product.unit,
        reentryDelay: product.reentryDelay,
        harvestDelay: product.harvestDelay
      }));
      setFicheInputs(prev => ({
        ...prev,
        produitNom: product.name
      }));
    }
  };

  const resetAgri = () => {
    setAgriInputs({
      surface: 5,
      doseProduct: 3,
      volumeWater: 120,
      tankCapacity: 800,
      productConcentration: 360,
      ephyProductId: 'roundup-360',
      isDry: false,
      productName: 'Roundup Power 360',
      activeIngredient: 'Glyphosate',
      ammNumber: '2170327',
      unit: 'g/L',
      reentryDelay: '6 heures',
      harvestDelay: 'Exempt'
    });
    setIsAgriTankCustom(false);
    setIsAgriConcCustom(false);
    setFicheInputs(prev => ({
      ...prev,
      produitNom: 'Roundup Power 360'
    }));
  };

  const resetJardin = () => {
    setJardinInputs({
      surface: 200,
      tankCapacity: 8,
      weedType: 'annual',
      dilutionPercent: 1.5,
      coverageRate: 10,
      productConcentration: 360,
      ephyProductId: 'roundup-360',
      isDry: false,
      productName: 'Roundup Power 360',
      activeIngredient: 'Glyphosate',
      ammNumber: '2170327',
      unit: 'g/L',
      reentryDelay: '6 heures',
      harvestDelay: 'Exempt'
    });
    setIsJardinTankCustom(false);
    setIsJardinBuseCustom(false);
    setIsJardinConcCustom(false);
    setFicheInputs(prev => ({
      ...prev,
      produitNom: 'Roundup Power 360'
    }));
  };

  return (
    <div className={`transition-all duration-350 min-h-screen ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-[#f8fafc] text-slate-800'} font-sans selection:bg-emerald-600 selection:text-white pb-10 flex flex-col justify-start items-center w-full`}>
      
      {/* 1. LAYER VISIBLE SCREEN (Caché à l'impression) */}
      <div className="print:hidden w-full flex flex-col items-center">
        {/* Background ambience blur - extremely subtle and clean */}
        <div className={`absolute top-0 left-1/4 w-96 h-96 ${isDarkMode ? 'bg-emerald-500/2' : 'bg-emerald-500/5'} rounded-full filter blur-[100px] pointer-events-none`} />

        {/* Main Container mimicking a premium, modern tablet/smartphone layout or a bento-grid panel */}
        <div className="w-full max-w-5xl px-4 mt-6 z-10">
          
          {/* Top Header Panel */}
          <header className={`flex flex-col md:flex-row md:items-center justify-between gap-y-4 pb-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} mb-6`}>
            <div className="flex items-center gap-x-3.5">
              <div className={`w-12 h-12 ${isDarkMode ? 'bg-emerald-950/40 border-emerald-900/40' : 'bg-emerald-50 border border-emerald-100'} rounded-2xl flex items-center justify-center shadow-sm`}>
                <Droplets className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${isDarkMode ? 'bg-emerald-950/60 text-emerald-300 border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'} text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono border`}>
                    v2.8 Android PWA
                  </span>
                  {isOnline ? (
                    <span className="flex items-center gap-x-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Synchronisé IndexedDB</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-x-1 bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-505 bg-amber-500 animate-bounce" />
                      <span>Mode Hors-ligne (Actif)</span>
                    </span>
                  )}
                </div>
                <h1 className={`text-2xl font-bold font-display tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-0.5`}>
                  Calculateur d'application de Glyphosate
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Outil professionnel de calcul agronomique, remplissage de cuve & dosage de précision
                </p>
              </div>
            </div>

            {/* Controls panel: Interactive Help Toggle + Dark Mode Toggle + Weather advisory info */}
            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              {/* Mode Pro Toggle */}
              <button
                type="button"
                onClick={() => setIsProMode(!isProMode)}
                className={`p-2.5 rounded-2xl border transition-all duration-200 flex items-center gap-x-2 text-xs font-bold cursor-pointer ${
                  isProMode
                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-350 hover:text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-900 shadow-xs'
                }`}
                title={isProMode ? "Désactiver le Mode Pro" : "Activer le Mode Pro (Automatise l'application avec les données de votre exploitation)"}
              >
                <Building2 className={`w-4 h-4 shrink-0 ${isProMode ? 'text-white' : 'text-amber-500'}`} />
                <span className="hidden sm:inline">Mode Pro</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono leading-none tracking-wider ${
                  isProMode ? 'bg-amber-800 text-amber-100 text-white font-bold' : 'bg-slate-100 text-slate-500 dark:bg-slate-900'
                }`}>
                  {isProMode ? 'PRO' : 'OFF'}
                </span>
              </button>

              {/* Interactive Help Toggle */}
              <button
                onClick={() => {
                  const nextVal = !interactiveHelp;
                  setInteractiveHelp(nextVal);
                  localStorage.setItem('interactive_help', nextVal ? 'true' : 'false');
                }}
                className={`p-2.5 rounded-2xl border transition-all duration-200 flex items-center gap-x-2 text-xs font-bold cursor-pointer ${
                  interactiveHelp
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-350 hover:text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650 text-slate-600 hover:text-slate-900 shadow-xs'
                }`}
                title={interactiveHelp ? "Désactiver l'aide interactive au remplissage" : "Activer l'aide interactive au remplissage"}
              >
                <HelpCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Aide au Remplissage</span>
                <span className={`w-1.5 h-1.5 rounded-full ${interactiveHelp ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
              </button>

              {/* Theme Mode Segmented Controller */}
              <div className={`p-1 rounded-2xl border flex items-center gap-x-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('light');
                    localStorage.setItem('theme_preference', 'light');
                  }}
                  className={`p-1.5 rounded-xl transition-all duration-200 flex items-center gap-x-1 text-xs cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Thème Clair"
                >
                  <Sun className="w-4 h-4" />
                  <span className="hidden lg:inline text-[10px] px-0.5">Clair</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('dark');
                    localStorage.setItem('theme_preference', 'dark');
                  }}
                  className={`p-1.5 rounded-xl transition-all duration-200 flex items-center gap-x-1 text-xs cursor-pointer ${
                    themeMode === 'dark'
                      ? (isDarkMode ? 'bg-slate-800 text-amber-400 shadow-sm' : 'bg-white text-slate-800 shadow-sm') + ' font-semibold'
                      : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-100'
                  }`}
                  title="Thème Sombre"
                >
                  <Moon className="w-4 h-4" />
                  <span className="hidden lg:inline text-[10px] px-0.5">Sombre</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('system');
                    localStorage.setItem('theme_preference', 'system');
                  }}
                  className={`p-1.5 rounded-xl transition-all duration-200 flex items-center gap-x-1 text-xs cursor-pointer ${
                    themeMode === 'system'
                      ? (isDarkMode ? 'bg-slate-800 text-teal-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') + ' font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Synchroniser avec le système"
                >
                  <Laptop className="w-4 h-4" />
                  <span className="hidden lg:inline text-[10px] px-0.5 font-sans">Système</span>
                </button>
              </div>

              {/* Quick weather warning pill header */}
              <div 
                onClick={() => setMode('weather')} 
                className={`cursor-pointer flex items-center gap-x-3 border transition-all rounded-2xl p-3 max-w-xs md:max-w-none text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-850/50' 
                    : 'bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  weatherAdvisory.status === 'optimal' ? (isDarkMode ? 'bg-emerald-950 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-600') :
                  weatherAdvisory.status === 'warning' ? (isDarkMode ? 'bg-amber-950 text-amber-400 font-bold' : 'bg-amber-50 text-amber-600') : 
                  (isDarkMode ? 'bg-red-950 text-red-400 font-bold' : 'bg-red-50 text-red-650')
                }`}>
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Alerte Pulvérisation</div>
                  <div className={`text-xs font-semibold line-clamp-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{weatherAdvisory.verdict}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Banner PWA d'accueil interactif */}
          {showPwaBanner && (
            <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-slate-305 shadow-md' 
                : 'bg-emerald-50/60 border-emerald-100/90 text-slate-650 shadow-xs'
            }`}>
              <div className="flex items-start gap-3 text-left">
                <div className="p-2 bg-emerald-500/15 text-emerald-500 rounded-xl mt-0.5 sm:mt-0 shrink-0">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Installez l'application mobile (PWA)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    {deferredPrompt 
                      ? "Votre appareil est prêt ! Installez l'application en un clic pour l'ajouter sur votre écran d'accueil et l'utiliser hors-ligne."
                      : "Accédez instantanément à l'application sans réseau au champ. Ajoutez-la directement sur votre écran d'accueil avec notre tutoriel."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                {deferredPrompt ? (
                  <button
                    onClick={handlePwaInstall}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    Installer maintenant
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMode('help');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] rounded-xl cursor-pointer transition-all shrink-0"
                  >
                    Voir le Guide PWA
                  </button>
                )}
                <button
                  onClick={handleClosePwaBanner}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Primary Screen Tabs */}
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-10 gap-2 mb-6">
            <button
              id="tab-exploitation"
              onClick={() => setMode('exploitation')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'exploitation'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-505 text-amber-400" />
              <span>Mon Exploitation</span>
            </button>

            <button
              id="tab-agri"
              onClick={() => setMode('agri')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'agri'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Agricole (Tracteur)</span>
            </button>

            <button
              id="tab-jardin"
              onClick={() => setMode('jardin')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'jardin'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Leaf className="w-4 h-4" />
              <span>Jardinier (Pulvérisateur à main)</span>
            </button>

            <button
              id="tab-dilution"
              onClick={() => setMode('dilution')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'dilution'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Droplets className="w-4 h-4 text-sky-505 text-teal-400" />
              <span>Calculateur automatique de dilution</span>
            </button>

            <button
              id="tab-weather"
              onClick={() => setMode('weather')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'weather'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Station Météo</span>
            </button>

            <button
              id="tab-safety"
              onClick={() => setMode('safety')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'safety'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sécurité & Guides</span>
            </button>
 
            <button
              id="tab-calendar"
              onClick={() => setMode('calendar')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'calendar'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendrier prévisionnel de traitements</span>
            </button>

            <button
              id="tab-drift"
              onClick={() => setMode('drift')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'drift'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Wind className="w-4 h-4" />
              <span>Calculateur de Dérive & ZNT</span>
            </button>

            <button
              id="tab-ai"
              onClick={() => setMode('ai')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'ai'
                  ? 'bg-teal-600 border-teal-600 text-white shadow-sm font-semibold shadow-teal-555/40'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:border-teal-500/40 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span>Conseils & Diagnostic IA</span>
            </button>

            <button
              id="tab-help"
              onClick={() => setMode('help')}
              className={`flex items-center justify-center gap-x-2 py-3.5 px-3 rounded-2xl font-medium text-sm transition-all duration-200 border cursor-pointer ${
                mode === 'help'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                  : (isDarkMode 
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900')
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Aide & Tutos</span>
            </button>
          </nav>

        {/* Main Workspace Frame */}
        <main className={`border rounded-3xl p-4 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200/80 text-slate-800'
        }`}>
          
          <AnimatePresence mode="wait">
            {/* ====== 0. EXPLOITATION MODE ====== */}
            {mode === 'exploitation' && (
              <motion.div
                key="mode-exploitation"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Banner mode Pro Status info */}
                <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isProMode 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400' 
                    : 'bg-blue-500/5 border-blue-500/10 text-slate-755 dark:text-slate-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isProMode ? 'bg-amber-500/20 text-amber-600' : 'bg-blue-500/10 text-blue-500'}`}>
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {isProMode ? "Le Mode Pro est ACTIF (Données Connectées)" : "Le Mode Pro est DÉSACTIF"}
                      </h3>
                      <p className="text-xs mt-0.5 opacity-90 max-w-2xl">
                        {isProMode 
                          ? "Les informations renseignées sur cette page alimentent dynamiquement les menus déroulants d'Agricole, Jardinier, Dilution, Drift, et la Fiche réglementaire pour des calculs ultra-rapides sans saisie manuelle."
                          : "Activez le bouton 'Mode Pro' en haut de l'écran pour connecter les parcelles, groupements et applicateurs de cette page aux différents calculateurs de l'application."
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsProMode(!isProMode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm cursor-pointer shrink-0 ${
                        isProMode
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isProMode ? "Désactiver le Mode Pro" : "Activer le Mode Pro"}
                    </button>
                  </div>
                </div>

                {/* ====== DYNAMIC MULTI-EXPLOITATION SELECTOR BANNER ====== */}
                <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/85 shadow-xs'} flex flex-col xl:flex-row xl:items-center justify-between gap-4`}>
                  <div className="flex items-center gap-x-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Gestion de vos Domaines & Exploitations</h3>
                      <p className="text-xs text-slate-400 mt-0.5">La base multi-exploitations est active. Basculez d'un domaine à l'autre en un clic.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Select active domain */}
                    <div className="flex items-center gap-2">
                      <select
                        value={activeExploitationId}
                        onChange={(e) => setActiveExploitationId(e.target.value)}
                        className={`min-w-[180px] pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden cursor-pointer ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        {exploitations.map(exp => (
                          <option key={exp.id} value={exp.id}>
                            {exp.nom || 'Sans nom'} {exp.agrement ? `(${exp.agrement})` : ''}
                          </option>
                        ))}
                      </select>

                      {/* Delete active domain if > 1 */}
                      {exploitations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'exploitation "${exploitationData.nom}" ? Cette action est irréversible et supprimera l'ensemble de ses parcelles, applicateurs et groupements.`)) {
                              handleDeleteExploitation(activeExploitationId);
                            }
                          }}
                          className="p-2.5 rounded-xl border border-red-500/10 hover:border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold text-xs transition-all flex items-center justify-center gap-x-1 cursor-pointer"
                          title="Supprimer cette exploitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inline Form to Create New Domain */}
                    <div className="hidden sm:block h-8 w-px bg-slate-200/60 dark:bg-slate-800/80" />

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nouveau nom..."
                        value={newExploitationName}
                        onChange={(e) => setNewExploitationName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNewExploitation(newExploitationName);
                            setNewExploitationName('');
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden w-full sm:w-[150px] ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleAddNewExploitation(newExploitationName);
                          setNewExploitationName('');
                        }}
                        disabled={!newExploitationName.trim()}
                        className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center whitespace-nowrap cursor-pointer ${
                          newExploitationName.trim()
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        + Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT COLUMN: Identity & Applicators */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Identity Card */}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <div className="flex items-center gap-x-2.5 mb-4">
                        <Building2 className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-sm">Fiche Signalétique de l'Exploitation</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Nom de l'exploitation</label>
                          <input
                            type="text"
                            value={exploitationData.nom}
                            onChange={(e) => handleUpdateExploitationInfo('nom', e.target.value)}
                            className={`w-full p-2.5 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                            }`}
                            placeholder="Ex : Domaine de Bel Air"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">Numéro d'agrément d'entreprise</label>
                          <input
                            type="text"
                            value={exploitationData.agrement}
                            onChange={(e) => handleUpdateExploitationInfo('agrement', e.target.value)}
                            className={`w-full p-2.5 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                            }`}
                            placeholder="Ex : AG-12345-6789"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Applicateurs */}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-x-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-bold text-sm">Applicateurs Certiphyto</h3>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-emerald-500 font-mono">
                          {exploitationData.applicators.length}
                        </span>
                      </div>

                      {/* Display List */}
                      {exploitationData.applicators.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">Aucun applicateur enregistré.</p>
                      ) : (
                        <div className="space-y-2 mb-4 max-h-[180px] overflow-y-auto pr-1">
                          {exploitationData.applicators.map((item) => (
                            <div 
                              key={item.id} 
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                                isDarkMode ? 'bg-slate-950 border-slate-800/85' : 'bg-white border-slate-150'
                              }`}
                            >
                              <div>
                                <p className="font-bold">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Certiphyto : {item.certiphyto}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteApplicator(item.id)}
                                className="p-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                title="Supprimer cet applicateur"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Form */}
                      <div className={`mt-4 p-3 rounded-xl border border-dashed ${isDarkMode ? 'border-slate-805 bg-slate-950/40' : 'border-slate-300 bg-white/50'}`}>
                        <h4 className="text-xs font-bold mb-3">Nouvel Applicateur</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newApplicatorName}
                            onChange={(e) => setNewApplicatorName(e.target.value)}
                            placeholder="Nom complet"
                            className={`w-full p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input
                            type="text"
                            value={newApplicatorCertiphyto}
                            onChange={(e) => setNewApplicatorCertiphyto(e.target.value)}
                            placeholder="N° Certiphyto (ex: CP-9876)"
                            className={`w-full p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleAddApplicator(newApplicatorName, newApplicatorCertiphyto);
                              setNewApplicatorName('');
                              setNewApplicatorCertiphyto('');
                            }}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                          >
                            Ajouter l'applicateur
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Parcelles & Groupements */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Parcelles List */}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-x-2.5">
                          <MapPin className="w-5 h-5 text-amber-500" />
                          <h3 className="font-bold text-sm">Fiches Parcelles</h3>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold text-amber-500 font-mono">
                          {exploitationData.parcelles.length} Parcelles
                        </span>
                      </div>

                      {/* Plots Table */}
                      {exploitationData.parcelles.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">Aucune parcelle enregistrée.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} text-slate-400 uppercase tracking-wider text-[10px] font-mono font-bold`}>
                                <th className="py-2.5 px-2">Nom de la parcelle</th>
                                <th className="py-2.5 px-2">Commune / Village</th>
                                <th className="py-2.5 px-2">Cru / Appellation</th>
                                <th className="py-2.5 px-2 text-right">Surface (ha)</th>
                                <th className="py-2.5 px-2">Cépage</th>
                                <th className="py-2.5 px-2 text-center w-10">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exploitationData.parcelles.map((p) => (
                                <tr 
                                  key={p.id} 
                                  className={`border-b last:border-0 hover:bg-emerald-500/5 transition-colors ${
                                    isDarkMode ? 'border-slate-800/65' : 'border-slate-150'
                                  }`}
                                >
                                  <td className="py-3 px-2 font-bold">{p.name}</td>
                                  <td className="py-3 px-2">{p.village}</td>
                                  <td className="py-3 px-2">{p.cru}</td>
                                  <td className="py-3 px-2 text-right font-mono font-bold text-emerald-500 dark:text-emerald-400">{p.surface} ha</td>
                                  <td className="py-3 px-2"><span className="px-1.5 py-0.5 rounded bg-slate-500/10 text-[10px] font-bold">{p.cepage}</span></td>
                                  <td className="py-3 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteParcelle(p.id)}
                                      className="p-1 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-505 text-red-500 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                      title="Supprimer cette parcelle"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Add Plot Form */}
                      <div className={`mt-5 p-4 rounded-xl border border-dashed ${isDarkMode ? 'border-slate-805 bg-slate-950/40' : 'border-slate-300 bg-white/50'}`}>
                        <h4 className="text-xs font-bold mb-3">Nouvelle Parcelle</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <input
                            type="text"
                            value={newParcelName}
                            onChange={(e) => setNewParcelName(e.target.value)}
                            placeholder="Nom (ex: Les Clos)"
                            className={`p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input
                            type="text"
                            value={newParcelVillage}
                            onChange={(e) => setNewParcelVillage(e.target.value)}
                            placeholder="Village"
                            className={`p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input
                            type="text"
                            value={newParcelCru}
                            onChange={(e) => setNewParcelCru(e.target.value)}
                            placeholder="Cru"
                            className={`p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={newParcelSurface}
                            onChange={(e) => setNewParcelSurface(e.target.value)}
                            placeholder="Surface (ha)"
                            className={`p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-355' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <input
                            type="text"
                            value={newParcelCepage}
                            onChange={(e) => setNewParcelCepage(e.target.value)}
                            placeholder="Cépage"
                            className={`p-2 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-350' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              handleAddParcelle({
                                name: newParcelName,
                                village: newParcelVillage,
                                cru: newParcelCru,
                                surface: Number(newParcelSurface) || 0,
                                cepage: newParcelCepage
                              });
                              setNewParcelName('');
                              setNewParcelVillage('');
                              setNewParcelCru('');
                              setNewParcelSurface('');
                              setNewParcelCepage('');
                            }}
                            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                          >
                            Ajouter la parcelle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Groupements */}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-x-2.5">
                          <Layers className="w-5 h-5 text-amber-500" />
                          <h3 className="font-bold text-sm">Groupements de Parcelles (Secteurs)</h3>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold text-amber-500 font-mono">
                          {exploitationData.groupements.length} Groupements
                        </span>
                      </div>

                      {/* Display Groups */}
                      {exploitationData.groupements.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">Aucun groupement enregistré.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {exploitationData.groupements.map((g) => {
                            const matchedParcelles = exploitationData.parcelles.filter(p => g.parcelleIds.includes(p.id));
                            const groupSurface = matchedParcelles.reduce((sum, p) => sum + p.surface, 0);
                            return (
                              <div 
                                key={g.id} 
                                className={`p-3.5 rounded-xl border text-xs relative ${
                                  isDarkMode ? 'bg-slate-950 border-slate-805' : 'bg-white border-slate-150'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-4 mb-2">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-150">{g.name}</p>
                                    <p className="text-[10px] text-emerald-650 dark:text-emerald-400 font-bold font-mono mt-0.5">
                                      Surface totale : {groupSurface.toFixed(2)} ha
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGroupement(g.id)}
                                    className="p-1 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                    title="Supprimer ce groupement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {matchedParcelles.map(p => (
                                    <span key={p.id} className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                                      {p.name} ({p.surface} ha)
                                    </span>
                                  ))}
                                  {matchedParcelles.length === 0 && (
                                    <span className="text-[9px] text-slate-400 italic">Aucune parcelle liée</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Group Form */}
                      <div className={`mt-4 p-4 rounded-xl border border-dashed ${isDarkMode ? 'border-slate-805 bg-slate-950/40' : 'border-slate-300 bg-white/50'}`}>
                        <h4 className="text-xs font-bold mb-3">Nouveau Groupement de Parcelles</h4>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Nom du groupement (ex: Îlot Côtes Rôties)"
                            className={`w-full p-2.5 rounded-lg text-xs border outline-hidden ${
                              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-250 text-slate-850'
                            }`}
                          />
                          <div>
                            <p className="text-[10px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider font-bold">Sélectionnez les parcelles à associer :</p>
                            {exploitationData.parcelles.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Créez d'abord des parcelles ci-dessus.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1.5 bg-slate-500/5 rounded-lg">
                                {exploitationData.parcelles.map((p) => {
                                  const isSelected = newGroupSelectedParcelles.includes(p.id);
                                  return (
                                    <button
                                      type="button"
                                      key={p.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setNewGroupSelectedParcelles(prev => prev.filter(id => id !== p.id));
                                        } else {
                                          setNewGroupSelectedParcelles(prev => [...prev, p.id]);
                                        }
                                      }}
                                      className={`px-2 py-1 rounded-md border text-[11px] cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'bg-amber-500/10 border-amber-505 text-amber-500 dark:bg-amber-505/20 font-bold' 
                                          : 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}
                                    >
                                      {p.name} ({p.surface} ha)
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleAddGroupement(newGroupName, newGroupSelectedParcelles);
                                setNewGroupName('');
                                setNewGroupSelectedParcelles([]);
                              }}
                              disabled={!newGroupName.trim() || newGroupSelectedParcelles.length === 0}
                              className={`px-5 py-2 rounded-lg font-bold text-xs shadow-sm cursor-pointer transition-colors ${
                                (!newGroupName.trim() || newGroupSelectedParcelles.length === 0)
                                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              Créer le groupement
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ====== SECTION DIAGNOSTIC HVE IFT ====== */}
                {isProMode ? (
                  <HveIftDashboard
                    isDarkMode={isDarkMode}
                    exploitationData={exploitationData}
                    historicalFiches={historicalFiches}
                    onUpdateCropType={handleUpdateHveCropType}
                    onAddManualIft={handleAddManualIft}
                    onDeleteManualIft={handleDeleteManualIft}
                  />
                ) : (
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'} opacity-85`}>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-400 shrink-0">
                        <Leaf className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Calculateur d'IFT & Diagnostic HVE (Mode Pro requis)</h3>
                          <span className="text-[9px] bg-slate-500/10 text-slate-500 font-bold px-2.5 py-0.5 rounded-full border border-slate-500/20 max-w-fit mx-auto md:mx-0">
                            Activable
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                          La certification <strong>Haute Valeur Environnementale (HVE-3)</strong> impose des objectifs de réduction de l'Indicateur de Fréquence de Traitement (IFT). L'activation du <strong>Mode Pro</strong> débloque le diagnostic en temps réel, calculant automatiquement les points HVE d'après vos surfaces réelles, parcelles, et la base de traitements saisis dans l'application.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ====== SECTION HISTORIQUE DES FICHES ====== */}
                <div id="historique-fiches-section" className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-4 mb-4">
                    <div className="flex items-center gap-x-3">
                      <div className="p-2 rounded-xl bg-teal-500/10 text-teal-605">
                        <FileText className="w-5 h-5 text-teal-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Historique réglementaire des Fiches de Traçabilité</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Retrouvez et re-téléchargez toutes les fiches PDF générées par l'application</p>
                      </div>
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold gap-1 self-start">
                      <span className="text-slate-500 px-2 py-1 flex items-center font-mono text-[10px] uppercase">Rapport : {historicalFiches.length}</span>
                    </div>
                  </div>

                  {/* Filters and search of fiches */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    <div className="md:col-span-6 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ficheSearchQuery}
                        onChange={(e) => setFicheSearchQuery(e.target.value)}
                        placeholder="Rechercher une parcelle, un applicateur, un produit..."
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all outline-hidden ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-203' : 'bg-white border-slate-200 text-slate-850'
                        }`}
                      />
                    </div>
                    
                    <div className="md:col-span-4 flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold w-full">
                        <button
                          type="button"
                          onClick={() => setFicheFilterMode('all')}
                          className={`flex-1 py-1 px-2.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                            ficheFilterMode === 'all' 
                              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-extrabold' 
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          Toutes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFicheFilterMode('agri')}
                          className={`flex-1 py-1 px-2.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                            ficheFilterMode === 'agri' 
                              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-extrabold' 
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          Agricole
                        </button>
                        <button
                          type="button"
                          onClick={() => setFicheFilterMode('jardin')}
                          className={`flex-1 py-1 px-2.5 rounded-lg transition-all text-[11px] cursor-pointer ${
                            ficheFilterMode === 'jardin' 
                              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold' 
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          Jardinier
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      {historicalFiches.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer la totalité de votre historique de fiches ? Cette action est irréversible.")) {
                              setHistoricalFiches([]);
                              setExpandedFicheId(null);
                              setFicheToDeleteId(null);
                            }
                          }}
                          className="w-full py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-bold text-xs transition-all flex items-center justify-center gap-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Effacer tout
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fiches rows list */}
                  {(() => {
                    const filtered = historicalFiches.filter(fiche => {
                      // mode filter
                      if (ficheFilterMode !== 'all' && fiche.mode !== ficheFilterMode) return false;
                      
                      // search filter
                      if (ficheSearchQuery.trim()) {
                        const query = ficheSearchQuery.toLowerCase();
                        const parcStr = (fiche.ficheInputs.parcelle || '').toLowerCase();
                        const appStr = (fiche.ficheInputs.applicateur || '').toLowerCase();
                        const prodStr = (fiche.ficheInputs.produitNom || '').toLowerCase();
                        const dateStr = (fiche.ficheInputs.date || '').toLowerCase();
                        const genStr = (fiche.dateGen || '').toLowerCase();
                        const explStr = (fiche.ficheInputs.exploitationNom || '').toLowerCase();
                        
                        return parcStr.includes(query) || 
                               appStr.includes(query) || 
                               prodStr.includes(query) || 
                               dateStr.includes(query) ||
                               genStr.includes(query) ||
                               explStr.includes(query);
                      }
                      
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-705 mx-auto mb-2" />
                          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400">Aucune fiche de traçabilité trouvée</h4>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                            {historicalFiches.length === 0 
                              ? "Utilisez le bouton 'Partager & de Téléchargement de Fiche' dans l'onglet des calculateurs Agricole ou Jardinier pour enregistrer automatiquement vos rapports réglementaires."
                              : "Aucune fiche ne correspond à vos critères de recherche ou de filtrage."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {filtered.map(fiche => {
                          const isExpanded = expandedFicheId === fiche.id;
                          const isAgri = fiche.mode === 'agri';
                          const isDeleting = ficheToDeleteId === fiche.id;

                          return (
                            <div 
                              key={fiche.id} 
                              className={`rounded-2xl border transition-all duration-200 text-left overflow-hidden ${
                                isDarkMode ? 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/70' : 'border-slate-200 bg-white hover:bg-slate-50/50 shadow-2xs'
                              } ${isExpanded ? 'ring-1 ring-teal-500/30' : ''}`}
                            >
                              {/* Row Header */}
                              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedFicheId(isExpanded ? null : fiche.id)}>
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl shrink-0 ${
                                    isAgri 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-x-2 flex-wrap gap-y-1">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase font-mono ${
                                        isAgri 
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      }`}>
                                        {isAgri ? 'Agricole' : 'Jardinier'}
                                      </span>
                                      
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                        Fiche du {fiche.ficheInputs.date || 'N/A'}
                                      </span>
                                    </div>
                                    
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">
                                      {fiche.ficheInputs.parcelle || 'Parcelle non spécifiée'}
                                    </h4>
                                    
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Applicateur: <strong className="text-slate-700 dark:text-slate-300">{fiche.ficheInputs.applicateur || 'Inconnu'}</strong> | Produit: <span className="font-medium">{fiche.ficheInputs.produitNom || 'Glyphosate'}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                  {/* Stats pills */}
                                  <div className="hidden sm:flex items-center gap-x-3 text-right">
                                    <div className="font-mono">
                                      <div className="text-[9px] uppercase font-bold text-slate-400">Surface</div>
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{fiche.details.surface}</div>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                                    <div className="font-mono">
                                      <div className="text-[9px] uppercase font-bold text-slate-400">Herbicide</div>
                                      <div className="text-xs font-bold text-teal-600 dark:text-teal-400">{fiche.details.totalProduct}</div>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                                    <div className="font-mono">
                                      <div className="text-[9px] uppercase font-bold text-slate-400">Bouillie</div>
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{fiche.details.totalBouillie}</div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-x-1.5 ml-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedFicheId(isExpanded ? null : fiche.id)}
                                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                                        isExpanded 
                                          ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' 
                                          : 'bg-slate-100 border-slate-205 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                      }`}
                                      title="Visualiser les détails de la fiche"
                                    >
                                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownloadHistoricalPDF(fiche)}
                                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-slate-660 dark:text-slate-400 transition-colors cursor-pointer"
                                      title="Télécharger le fichier PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleShareHistoricalPDF(fiche)}
                                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-205 dark:border-slate-800 text-slate-660 dark:text-slate-400 transition-colors cursor-pointer"
                                      title="Partager le fichier PDF"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>

                                    {isDeleting ? (
                                      <div className="flex items-center gap-x-1">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteHistoricalFiche(fiche.id)}
                                          className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-red-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                        >
                                          Confirmer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setFicheToDeleteId(null)}
                                          className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs transition-colors cursor-pointer"
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setFicheToDeleteId(fiche.id)}
                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/10 hover:border-red-500/25 transition-all cursor-pointer"
                                        title="Supprimer cette fiche historique"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded details review area */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden"
                                  >
                                    <div className="p-4 space-y-4 text-xs">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Coordinates Card */}
                                        <div className={`p-3 rounded-xl border text-slate-700 dark:text-slate-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="font-bold text-slate-700 dark:text-slate-350 border-b border-slate-200/50 dark:border-slate-800 pb-1.5 mb-2 flex items-center gap-x-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Informations générales</span>
                                          </div>
                                          <div className="space-y-1 text-[11px]">
                                            {fiche.ficheInputs.exploitationNom && (
                                              <div>Exploitation : <strong className="text-slate-805 dark:text-slate-200">{fiche.ficheInputs.exploitationNom}</strong> {fiche.ficheInputs.exploitationAgrement && <span className="text-slate-400 font-mono text-[9px]">({fiche.ficheInputs.exploitationAgrement})</span>}</div>
                                            )}
                                            <div>Applicateur : <strong>{fiche.ficheInputs.applicateur || 'Non spécifié'}</strong></div>
                                            <div>Parcelle/Zone : <strong>{fiche.ficheInputs.parcelle || 'Non spécifiée'}</strong></div>
                                            <div>Produit commercial : <strong>{fiche.ficheInputs.produitNom || 'Glyphosate'}</strong></div>
                                            <div>Date saisie : <strong>{fiche.ficheInputs.date || 'N/A'}</strong></div>
                                            <div className="text-[10px] text-slate-400 mt-2 italic font-mono">Généré le {fiche.dateGen}</div>
                                          </div>
                                        </div>

                                        {/* Technical quantities Card */}
                                        <div className={`p-3 rounded-xl border text-slate-700 dark:text-slate-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="font-bold text-teal-655 border-b border-slate-200/50 dark:border-slate-800 pb-1.5 mb-2 flex items-center gap-x-1.5">
                                            <Leaf className="w-3.5 h-3.5 text-teal-550 text-teal-500" />
                                            <span>Dosages & Mélange</span>
                                          </div>
                                          <div className="space-y-1 text-[11px]">
                                            <div>Surface globale : <strong>{fiche.details.surface}</strong></div>
                                            <div>Eau claire requise : <strong>{fiche.details.totalWater}</strong></div>
                                            <div>Herbicide pur requis : <strong className="text-teal-600 dark:text-teal-400">{fiche.details.totalProduct}</strong></div>
                                            <div>Volume final de Bouillie : <strong>{fiche.details.totalBouillie}</strong></div>
                                            {fiche.ficheInputs.exploitationNom && <div className="text-[10px] text-emerald-500 font-semibold font-mono mt-2">✓ Conforme ÉcoPhyto II</div>}
                                          </div>
                                        </div>

                                        {/* Weather summary card */}
                                        <div className={`p-3 rounded-xl border text-slate-700 dark:text-slate-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="font-bold text-blue-655 border-b border-slate-200/50 dark:border-slate-800 pb-1.5 mb-2 flex items-center gap-x-1.5">
                                            <Wind className="w-3.5 h-3.5 text-blue-400" />
                                            <span>Météo lors de la saisie</span>
                                          </div>
                                          <div className="space-y-1 text-[11px]">
                                            <div>Vent moyen : <strong className={fiche.weatherInput.wind > 19 ? 'text-red-550 text-red-500' : 'text-slate-800 dark:text-slate-200'}>{fiche.weatherInput.wind} km/h</strong> {fiche.weatherInput.wind > 19 ? '< 19km/h limite légale' : '✓ Conforme (<19km/h)'}</div>
                                            <div>Température : <strong>{fiche.weatherInput.temp} °C</strong></div>
                                            <div>Taux d'humidité : <strong>{fiche.weatherInput.humidity} %</strong></div>
                                            <div className="border-t border-slate-200/40 dark:border-slate-800 pt-2 mt-2 flex gap-2 flex-wrap text-[10px] font-bold text-slate-500">
                                              <span className={fiche.ficheInputs.zntRespect ? 'text-emerald-500 font-bold' : 'text-red-550 border-red-500/10'}>{fiche.ficheInputs.zntRespect ? '✓ ZNT 5m':'✗ Sans ZNT'}</span>
                                              <span className={fiche.ficheInputs.epiComplet ? 'text-emerald-500 font-bold' : 'text-red-550 border-red-500/10'}>{fiche.ficheInputs.epiComplet ? '✓ EPI Porté':'✗ Sans EPI'}</span>
                                              <span className={fiche.ficheInputs.tripleRincage ? 'text-emerald-500 font-bold' : 'text-red-550 border-red-500/10'}>{fiche.ficheInputs.tripleRincage ? '✓ Triple rincé':'✗ Non rincé'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-end gap-x-2 pt-2 border-t border-slate-200/40 dark:border-slate-800">
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadHistoricalPDF(fiche)}
                                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] cursor-pointer transition-colors flex items-center gap-x-1.5 shadow-sm"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          Télécharger de nouveau (PDF)
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* ====== 1. AGRICULTURAL MODE ====== */}
            {mode === 'agri' && (
              <motion.div
                key="mode-agri"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Inputs area */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold font-display text-slate-900 flex items-center justify-between">
                      <span>Paramètres Pulvérisateur</span>
                      <button 
                        onClick={resetAgri}
                        className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-x-1 font-mono transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Réinitialiser
                      </button>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Ajustez les curseurs ou tapez directement l'échelle de votre parcelle.
                    </p>
                  </div>

                  {/* Comprehensive Step Checklist or Overview of Saisie */}
                  {interactiveHelp && (
                    <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-2xl text-left animate-fade-in">
                      <div className="flex items-center gap-x-2 mb-2.5">
                        <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Assistant de Remplissage Agricole</h4>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">VALIDEZ LES ÉTAPES CLÉS</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${agriInputs.surface > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                            {agriInputs.surface > 0 ? '✓' : '1'}
                          </div>
                          <span className="text-black dark:text-slate-350">Rentrer la surface globale à traiter ({agriInputs.surface} ha Rempli/Vérifié)</span>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${agriInputs.doseProduct > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                            {agriInputs.doseProduct > 0 ? '✓' : '2'}
                          </div>
                          <span className="text-black dark:text-slate-350">Indiquer la dose de produit par hectare ({agriInputs.doseProduct} L/ha Rempli/Vérifié)</span>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${agriInputs.volumeWater > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                            {agriInputs.volumeWater > 0 ? '✓' : '3'}
                          </div>
                          <span className="text-black dark:text-slate-350">Indiquer le volume d'eau par hectare ({agriInputs.volumeWater} L/ha Rempli/Vérifié)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 0: Product Selection connected to e-Phy ANSES */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-x-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Étape 0 : Produit de Protection (Base e-Phy ANSES)</span>
                      </label>
                      <a 
                        href="https://ephy.anses.fr/" 
                        target="_blank" 
                        rel="referrer"
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline flex items-center gap-x-0.5"
                      >
                        ephy.anses.fr
                      </a>
                    </div>

                    <select
                      value={agriInputs.ephyProductId}
                      onChange={(e) => handleAgriProductChange(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border font-medium cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                      }`}
                    >
                      {EPHY_PRODUCTS.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (AMM N°{prod.ammNumber}) — {prod.substanceName}
                        </option>
                      ))}
                      <option value="custom">🧪 Autre / Produit Personnalisé...</option>
                    </select>

                    {/* Custom Product Inputs when chosen */}
                    {agriInputs.ephyProductId === 'custom' && (
                      <div className="mt-3.5 p-3 bg-slate-100/40 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paramètres personnalisés</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Nom du Produit</label>
                            <input
                              type="text"
                              value={agriInputs.productName}
                              onChange={(e) => setAgriInputs(prev => ({ ...prev, productName: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5 font-medium">Substance active</label>
                            <input
                              type="text"
                              value={agriInputs.activeIngredient}
                              onChange={(e) => setAgriInputs(prev => ({ ...prev, activeIngredient: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Concentration (g/L ou g/kg)</label>
                            <input
                              type="number"
                              value={agriInputs.productConcentration}
                              onChange={(e) => setAgriInputs(prev => ({ ...prev, productConcentration: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Formulation physique</label>
                            <select
                              value={agriInputs.isDry ? 'dry' : 'liquid'}
                              onChange={(e) => setAgriInputs(prev => ({ ...prev, isDry: e.target.value === 'dry', unit: e.target.value === 'dry' ? 'g/kg' : 'g/L' }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            >
                              <option value="liquid">Formule Liquide (g/L)</option>
                              <option value="dry">Poudre Sèche (g/kg)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Compact Product Delays overview */}
                    <div className="mt-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Matière Active :</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{agriInputs.activeIngredient}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Concentration :</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium">{agriInputs.productConcentration} {agriInputs.unit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai de rentrée (DRE) :</span>
                        <strong className="text-amber-600 font-semibold font-mono">{agriInputs.reentryDelay}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai récolte (DAR) :</span>
                        <strong className="text-blue-600 font-semibold font-mono">{agriInputs.harvestDelay}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Input 1: Surface area (ha) */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-x-2">
                        <span>Surface Globale à Traiter</span>
                        <span className="text-xs font-normal text-slate-400">(ha)</span>
                      </label>
                      <input 
                        type="number"
                        value={agriInputs.surface}
                        onChange={(e) => handleAgriChange('surface', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 font-mono text-right text-xs rounded-lg px-2 py-1 w-20 max-w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <input 
                      type="range"
                      min="0.1"
                      max="100"
                      step="0.5"
                      value={agriInputs.surface}
                      onChange={(e) => handleAgriChange('surface', parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.1 ha</span>
                      <span>50 ha</span>
                      <span>100 ha</span>
                    </div>

                    {/* Mode Pro integration for Surface autofill */}
                    {isProMode && (
                      <div className="mt-3 pt-3 border-t border-slate-205 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-x-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-405 dark:text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span className="font-bold">Sélection Rapide (Mode Pro) :</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <select
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                if (value.startsWith('p-')) {
                                  const id = value.replace('p-', '');
                                  const p = exploitationData.parcelles.find(item => item.id === id);
                                  if (p) {
                                    handleAgriChange('surface', p.surface);
                                    setFicheInputs(prev => ({ ...prev, parcelle: p.name }));
                                  }
                                }
                              }}
                              className={`w-full p-2 rounded-xl text-xs border ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                              }`}
                              defaultValue=""
                            >
                              <option value="">-- Parcelles --</option>
                              {exploitationData.parcelles.map(p => (
                                <option key={p.id} value={`p-${p.id}`}>{p.name} ({p.surface} ha)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                if (value.startsWith('g-')) {
                                  const id = value.replace('g-', '');
                                  const g = exploitationData.groupements.find(item => item.id === id);
                                  if (g) {
                                    const matched = exploitationData.parcelles.filter(p => g.parcelleIds.includes(p.id));
                                    const sum = matched.reduce((sumStep, p) => sumStep + p.surface, 0);
                                    handleAgriChange('surface', parseFloat(sum.toFixed(3)));
                                    setFicheInputs(prev => ({ ...prev, parcelle: g.name }));
                                  }
                                }
                              }}
                              className={`w-full p-2 rounded-xl text-xs border ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                              }`}
                              defaultValue=""
                            >
                              <option value="">-- Groupements --</option>
                              {exploitationData.groupements.map(g => {
                                const matched = exploitationData.parcelles.filter(p => g.parcelleIds.includes(p.id));
                                const sum = matched.reduce((sumStep, p) => sumStep + p.surface, 0);
                                return (
                                  <option key={g.id} value={`g-${g.id}`}>{g.name} ({sum.toFixed(1)} ha)</option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Assist: Surface */}
                    {interactiveHelp && (
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-605 text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-x-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Conseil de saisie (Hectares) :</p>
                            <p className="mt-0.5 text-black dark:text-slate-400">Indiquez la surface totale en Hectares (1 ha = 10 000 m²). Valeurs recommandées (cliquez pour appliquer) :</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => handleAgriChange('surface', 2)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                2 ha (Vignes/Petits lots)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgriChange('surface', 15)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                15 ha (Grandes cultures standards)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgriChange('surface', 60)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                60 ha (Exploitation céréalière)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input 2: Dose (L/ha) */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-x-2">
                        <span>Dose de Produit (Dose Homologuée)</span>
                        <span className="text-xs font-normal text-slate-400">(L/ha)</span>
                      </label>
                      <input 
                        type="number"
                        value={agriInputs.doseProduct}
                        onChange={(e) => handleAgriChange('doseProduct', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 font-mono text-right text-xs rounded-lg px-2 py-1 w-20 max-w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.1"
                      value={agriInputs.doseProduct}
                      onChange={(e) => handleAgriChange('doseProduct', parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.5 L/ha</span>
                      <span>Dose type : 3 L/ha (Chiendent)</span>
                      <span>8 L/ha</span>
                    </div>

                    {/* Interactive Assist: Dose */}
                    {interactiveHelp && (
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-x-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Type de mauvaises herbes ciblées (Dose) :</p>
                            <p className="mt-0.5 text-black dark:text-slate-400">La dose d'application autorisée dépend de la cible. Choisissez une dose type (cliquez pour appliquer) :</p>
                            <div className="flex flex-col gap-y-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => handleAgriChange('doseProduct', 1.5)}
                                className="w-full text-left px-2-5 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🌱 <span className="font-bold text-emerald-600">1.5 L/ha</span> - Annuelles légères (Coquelicots, Séneçons jeunes)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgriChange('doseProduct', 3.0)}
                                className="w-full text-left px-2-5 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🌿 <span className="font-bold text-emerald-600">3.0 L/ha</span> - Vivaces tenaces (Chiendent, Liserondes parcelles)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgriChange('doseProduct', 5.0)}
                                className="w-full text-left px-2-5 py-1.5 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🪵 <span className="font-bold text-emerald-600">5.0 L/ha</span> - Herbes ligneuses & ronces difficiles
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input 3: Volume d'eau par hectare (L/ha) */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-x-2">
                        <span>Volume de Bouillie par Hectare (Eau)</span>
                        <span className="text-xs font-normal text-slate-400">(L/ha)</span>
                      </label>
                      <input 
                        type="number"
                        value={agriInputs.volumeWater}
                        onChange={(e) => handleAgriChange('volumeWater', parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 font-mono text-right text-xs rounded-lg px-2 py-1 w-20 max-w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                        min="0"
                        step="5"
                      />
                    </div>
                    <input 
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={agriInputs.volumeWater}
                      onChange={(e) => handleAgriChange('volumeWater', parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Bas-vol (50 L/ha)</span>
                      <span>Normal (120 - 150 L/ha)</span>
                      <span>300 L/ha</span>
                    </div>

                    {/* Interactive Assist: Volume de Bouillie */}
                    {interactiveHelp && (
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-x-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Quel volume de bouillie choisir ?</p>
                            <p className="mt-0.5 text-black dark:text-slate-400">La quantité de liquide pulvérisée par hectare dépend du type de buses employées :</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => handleAgriChange('volumeWater', 80)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                80 L/ha (Buses anti-dérive / Bas volume)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgriChange('volumeWater', 150)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                150 L/ha (Fentes classiques / Standard)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input 4: Tank capacity (L) & Product concentration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Capacité Cuve (L)
                      </label>
                      <select
                        value={isAgriTankCustom ? 'custom' : agriInputs.tankCapacity}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsAgriTankCustom(true);
                          } else {
                            setIsAgriTankCustom(false);
                            handleAgriChange('tankCapacity', parseInt(e.target.value));
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        <option value="400">400 L (Compact)</option>
                        <option value="600">600 L</option>
                        <option value="800">800 L (Standard)</option>
                        <option value="1000">1000 L</option>
                        <option value="1200">1200 L</option>
                        <option value="1500">1500 L</option>
                        <option value="2000">2000 L (Grand)</option>
                        <option value="3000">3000 L (Automoteur)</option>
                        <option value="custom">Autre / Perso...</option>
                      </select>
                      {isAgriTankCustom && (
                        <div className="mt-2 text-slate-700">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Capacité libre (L)</label>
                          <input
                            type="number"
                            value={agriInputs.tankCapacity}
                            onChange={(e) => handleAgriChange('tankCapacity', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Concentration Produit
                      </label>
                      <select
                        value={isAgriConcCustom ? 'custom' : agriInputs.productConcentration}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsAgriConcCustom(true);
                          } else {
                            setIsAgriConcCustom(false);
                            handleAgriChange('productConcentration', parseInt(e.target.value));
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono cursor-pointer"
                      >
                        {CONCENTRATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value} g/L
                          </option>
                        ))}
                        <option value="custom">Autre...</option>
                      </select>
                      {isAgriConcCustom && (
                        <div className="mt-2 text-slate-700">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Concentration libre (g/L)</label>
                          <input
                            type="number"
                            value={agriInputs.productConcentration}
                            onChange={(e) => handleAgriChange('productConcentration', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Assist: Cuve et Concentration */}
                  {interactiveHelp && (
                    <div className="mt-1.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-655 text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">Cuve & Concentration :</p>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-black dark:text-slate-400">
                            <li className="text-black dark:text-slate-400">La <span className="font-medium text-black dark:text-slate-300">Capacité de Cuve</span> sert à planifier le nombre exact de trajets. Une capacité supérieure réduit le temps de ravitaillement.</li>
                            <li className="text-black dark:text-slate-400">La <span className="font-medium text-black dark:text-slate-300">Concentration</span> (standard en France : 360 g/L de glyphosate actif) calibre la quantité brute de produit d'après la dose de matière active exigée.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Computational outputs area */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Total overall metrics banner */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="text-xs uppercase font-bold tracking-widest text-emerald-700 mb-3 flex items-center justify-between">
                      <span>Bilan global de la préparation</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {agriInputs.activeIngredient} {agriInputs.productConcentration} {agriInputs.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative">
                        <div className="text-[10px] text-slate-500 font-medium truncate">Total Produit à doser</div>
                        <div className="text-2xl font-black text-rose-600 font-display mt-1">
                          {agriOutputs.totalProduct} <span className="text-sm font-medium text-black dark:text-neutral-300">L</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                          {Math.round(agriInputs.doseProduct * 360 / agriInputs.productConcentration * 10) / 10} L/ha net
                        </div>
                      </div>

                      <div className="relative border-l border-slate-150 pl-4">
                        <div className="text-[10px] text-slate-500 font-medium truncate">Volume d'eau total</div>
                        <div className="text-2xl font-black text-blue-600 font-display mt-1">
                          {agriOutputs.totalWater} <span className="text-sm font-medium">L</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {agriInputs.volumeWater} L d'eau/ha
                        </div>
                      </div>

                      <div className="relative border-l border-slate-150 pl-4">
                        <div className="text-[10px] text-slate-500 font-medium truncate">Bouillie totale</div>
                        <div className="text-2xl font-black text-slate-800 font-display mt-1 font-sans">
                          {agriOutputs.totalBouillie} <span className="text-sm font-medium">L</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {agriInputs.surface} Hectares
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EU Regulatory Compliance Alert Module */}
                  <div className={`border p-5 rounded-2xl transition-all shadow-sm ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-100' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    {(() => {
                      const doseMatiereActive = Math.round(agriInputs.doseProduct * agriInputs.productConcentration);
                      
                      // Find matching regulatory limits for the current product
                      const productInfo = EPHY_PRODUCTS.find(p => p.id === agriInputs.ephyProductId);
                      const productLimits = agriInputs.ephyProductId === 'custom'
                        ? { grandes_cultures: 1080, viticulture: 450, arboriculture: 900 } // Default fallback limits
                        : productInfo?.limitsByCrop || {};

                      const currentLimit = productLimits[agriCropType];
                      const isExceeded = currentLimit !== undefined && doseMatiereActive > currentLimit;
                      const percentOfLimit = currentLimit !== undefined ? Math.round((doseMatiereActive / currentLimit) * 100) : 0;

                      return (
                        <>
                          <div className="flex items-center justify-between mb-3 border-b pb-2.5 border-dashed border-slate-200 dark:border-slate-850">
                            <div className="flex items-center gap-x-2">
                              <Scale className={`w-5 h-5 ${
                                isExceeded ? 'text-rose-500 animate-pulse' : 'text-emerald-500'
                              }`} />
                              <h4 className="text-xs font-bold uppercase tracking-wider">
                                Vérificateur de Dose (Normes Européenne & ANSES)
                              </h4>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              currentLimit === undefined
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : isExceeded
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {currentLimit === undefined
                                ? 'Sans limite spécifique'
                                : isExceeded
                                  ? 'Non conforme'
                                  : 'Dose Conforme'
                              }
                            </span>
                          </div>

                          <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                            La dose de matière active de <strong>{agriInputs.activeIngredient || 'la substance active'}</strong> est soumise à des doses limites homologuées selon la culture cible. Sélectionnez votre culture :
                          </p>

                          {/* Culture selector tabs */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                              { id: 'grandes_cultures', label: 'Grandes Cultures', limit: productLimits?.grandes_cultures, desc: 'Céréales, Colza, Betteraves...' },
                              { id: 'viticulture', label: 'Viticulture', limit: productLimits?.viticulture, desc: 'Vignes (inter-rang de vigne)' },
                              { id: 'arboriculture', label: 'Arboriculture', limit: productLimits?.arboriculture, desc: 'Vergers et arbres fruitiers' }
                            ].map((item) => {
                              const isSupported = item.limit !== undefined;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  disabled={!isSupported}
                                  onClick={() => setAgriCropType(item.id as any)}
                                  className={`p-2 rounded-xl text-center border transition-all text-[11px] font-medium flex flex-col justify-center items-center shadow-xs cursor-pointer ${
                                    !isSupported ? 'opacity-30 cursor-not-allowed' : ''
                                  } ${
                                    agriCropType === item.id && isSupported
                                      ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/15'
                                      : isDarkMode
                                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-755'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="font-bold text-[11px]">{item.label}</span>
                                  <span className={`text-[9px] font-mono mt-0.5 ${agriCropType === item.id && isSupported ? 'text-emerald-100' : 'text-slate-405'}`}>
                                    {isSupported ? `${item.limit} g s.a./ha` : 'S/O'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="space-y-3.5 pt-2">
                            {/* Progress/gauge bar */}
                            {currentLimit !== undefined ? (
                              <div>
                                <div className="flex justify-between text-[11px] mb-1 font-mono">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                                    Dose appliquée : <strong className={isExceeded ? 'text-rose-600 dark:text-rose-455 font-bold' : 'text-emerald-600 dark:text-emerald-405 font-bold'}>{doseMatiereActive} g s.a./ha</strong>
                                  </span>
                                  <span className="text-slate-450">
                                    Seuil légal : <strong>{currentLimit} g s.a./ha</strong>
                                  </span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                  <motion.div
                                    className={`h-full rounded-full ${isExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentOfLimit, 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] mt-1 text-slate-400 font-mono">
                                  <span>0 g s.a. ({agriInputs.activeIngredient || 'matière active'})</span>
                                  <span className={isExceeded ? 'text-rose-500 font-bold animate-pulse' : 'text-emerald-500 font-bold'}>
                                    {percentOfLimit}% du seuil maximal
                                  </span>
                                  <span>{currentLimit} g s.a./ha (Max)</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-855 font-medium text-slate-600 dark:text-slate-400">
                                ✅ Aucun seuil restrictif de dose annuelle de matière active n'est listé sous e-Phy pour <strong>"{agriInputs.activeIngredient || 'cette matière active'}"</strong> sur la culture sélectionnée. Veillez néanmoins à appliquer la dose AMM conseillée par le fabricant.
                              </div>
                            )}

                            {/* Dynamic Feedback Box */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`${agriCropType}-${doseMatiereActive}-${agriInputs.ephyProductId}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                                  isExceeded
                                    ? isDarkMode
                                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                                      : 'bg-rose-50 border-rose-200 text-rose-800'
                                    : currentLimit === undefined
                                      ? isDarkMode
                                        ? 'bg-slate-850/50 border-slate-805 text-slate-300'
                                        : 'bg-slate-50 border-slate-150 text-slate-700'
                                      : isDarkMode
                                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-200'
                                        : 'bg-emerald-55/70 border-emerald-202 text-emerald-800'
                                }`}
                              >
                                <div className="flex items-start gap-x-2.5">
                                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isExceeded ? 'text-rose-500 animate-bounce' : 'text-emerald-500'}`} />
                                  <div className="space-y-1">
                                    <p className="font-bold text-[12px]">
                                      {currentLimit === undefined
                                        ? 'Usage réglementé par l\'étiquette AMM'
                                        : isExceeded 
                                          ? `Attention : Dépassement légal de ${doseMatiereActive - currentLimit} g s.a./ha !`
                                          : 'Dose conforme aux réglementations'
                                      }
                                    </p>
                                    <p className="text-[11px] opacity-90 leading-relaxed">
                                      {currentLimit === undefined
                                        ? `Le produit "${agriInputs.productName}" ne présente pas de limitation d'épandage spécifique de matière active annuelle sous e-Phy pour la culture sélectionnée.`
                                        : isExceeded
                                          ? `Votre traitement projette d'appliquer ${doseMatiereActive} g de substance active (${agriInputs.activeIngredient || 'substance active'}) par hectare. Cela dépasse la limite maximale réglementée par l'ANSES de ${currentLimit} g/ha (soit un taux de ${percentOfLimit}% de la dose réglementaire autorisée).`
                                          : `Votre traitement appliquera ${doseMatiereActive} g de substance active (${agriInputs.activeIngredient || 'substance active'}) par hectare, soit ${percentOfLimit}% de la limite réglementaire maximale d'usage de ${currentLimit} g/ha.`
                                      }
                                    </p>
                                    {isExceeded && currentLimit !== undefined && (
                                      <div className={`mt-2 p-2.5 rounded-lg border text-[10.5px] ${
                                        isDarkMode ? 'bg-rose-950/40 border-rose-800/20 text-rose-300' : 'bg-white border-rose-100 text-rose-900 shadow-xs'
                                      }`}>
                                        <span className="font-bold">💡 Solutions de conformité :</span>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5 opacity-90 font-medium">
                                          <li>Diminuez la dose de produit par hectare à maximum <strong className="font-bold font-mono text-rose-500">{(currentLimit / (agriInputs.productConcentration || 1)).toFixed(2)} {agriInputs.isDry ? 'kg/ha' : 'L/ha'}</strong> pour rester conforme.</li>
                                          <li>Envisagez d'utiliser une formulation plus concentrée ou d'ajuster l'espacement d'intervention.</li>
                                          <li>Associez un désherbage mécanique complémentaire (travail du sol localisé) pour limiter les intrants chimiques.</li>
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Tank split plan & Graphical visualization side-by-side */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-x-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Plan de remplissage de la cuve</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                           {/* Interactive dynamic visual tank component */}
                      <div className="md:col-span-5 flex flex-col items-center">
                        <div className="relative w-40 h-44 bg-slate-50 border-4 border-slate-200 rounded-t-[50px] rounded-b-xl overflow-hidden flex flex-col justify-end shadow-sm">
                          
                          {/* Tank markers */}
                          <div className="absolute top-10 right-2 text-[9px] font-mono text-slate-400 flex flex-col items-end gap-y-7 pointer-events-none">
                            <span>100% —</span>
                            <span>75% —</span>
                            <span>50% —</span>
                            <span>25% —</span>
                          </div>

                          {/* Sprayer mixture coloring */}
                          <div className="w-full bg-blue-500/10 flex flex-col" style={{ height: '70%' }}>
                            <div className="w-full bg-emerald-500/10 py-2 flex-grow transition-all">
                              {/* Glowing chemical content representation */}
                              <div className="text-[10px] text-center font-bold text-emerald-700 tracking-wider font-sans truncate px-1">
                                {agriInputs.productName} + Eau
                              </div>
                            </div>
                          </div>

                          {/* Core volumetric scale overlays */}
                          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">Capacité</span>
                            <span className="text-lg font-bold text-slate-800">{agriInputs.tankCapacity} L</span>
                            <span className="text-[9px] text-emerald-600 font-mono font-medium">
                              Autonomie: {agriOutputs.autonomieCuve} ha
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 font-mono text-center max-w-[160px]">
                          1 Cuve traite {agriOutputs.autonomieCuve} ha
                        </div>
                      </div>

                      {/* Explicit dosage steps */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <div className="text-xs text-slate-600 font-medium flex items-center gap-x-1.5 mb-2 text-emerald-600">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {agriOutputs.fullTanksCount === 0 
                                ? 'Aucune cuve entièrement pleine de nécessaire' 
                                : `${agriOutputs.fullTanksCount} Cuve${agriOutputs.fullTanksCount > 1 ? 's' : ''} Pleine${agriOutputs.fullTanksCount > 1 ? 's' : ''}`}
                            </span>
                          </div>
                          
                          {agriOutputs.fullTanksCount > 0 && (
                            <div className="space-y-1 font-mono text-xs text-slate-600">
                              <div className="flex justify-between">
                                <span>Eau claire :</span>
                                <span className="font-bold text-blue-600">{agriOutputs.waterPerFullTank} L</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-100 pt-1">
                                <span>Dose de Produit (Pur) :</span>
                                <span className="font-bold text-rose-600">+{agriOutputs.productPerFullTank} L</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Partial remaining tank guide */}
                        {agriOutputs.hasPartialTank && (
                          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                            <div className="text-xs text-amber-800 font-medium flex items-center gap-x-1.5 mb-1.5">
                              <Info className="w-3.5 h-3.5 text-amber-600" />
                              <span>1 Cuve Complémentaire Partielle</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                              Pour ne pas gaspiller de bouillie sur la surface restante, préparez uniquement :
                            </p>
                            <div className="space-y-1 font-mono text-xs text-slate-600">
                              <div className="flex justify-between">
                                <span>Eau claire :</span>
                                <span className="font-bold text-blue-600">{agriOutputs.partialTankWater} L</span>
                              </div>
                              <div className="flex justify-between border-t border-amber-100/50 pt-1">
                                <span>Dose de Produit (Pur) :</span>
                                <span className="font-bold text-rose-600">+{agriOutputs.partialTankProduct} L</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sum of trips info */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-x-2">
                          <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            Total de <strong>{agriOutputs.numTanks}</strong> cycle(s) de cuves pour faire {agriInputs.surface} ha.
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Professional Pro tip / mixing alert */}
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-x-3 items-start">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                      <div className="font-bold text-blue-900">Ordre d'introduction en cuve (C.E.P.A):</div>
                      <p className="mt-0.5 leading-relaxed text-slate-500">
                        1. Remplir la cuve à 50% d'eau. 2. Lancer l'agitation mécanique. 3. Verser la dose de {agriInputs.productName} ({agriOutputs.productPerFullTank} L par cuve pleine). 4. Remplir les 50% d'eau restants tout en conservant l'agitation.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== 2. GARDENING MODE ====== */}
            {mode === 'jardin' && (
              <motion.div
                key="mode-jardin"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Inputs area */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold font-display text-slate-905 text-slate-900 flex items-center justify-between">
                      <span>Mon Jardin / Allée</span>
                      <button 
                        onClick={resetJardin}
                        className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-x-1 font-mono transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Réinitialiser
                      </button>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Calculez précisément les millilitres de désherbant pour vos pulvérisateurs à main.
                    </p>
                  </div>

                  {/* Jardin Step Checklist */}
                  {interactiveHelp && (
                    <div className="bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-2xl text-left animate-fade-in">
                      <div className="flex items-center gap-x-2 mb-2.5">
                        <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Assistant de Remplissage Jardin</h4>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">VOS PARAMÈTRES EN TEMPS RÉEL</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${jardinInputs.weedType !== 'custom' || jardinInputs.dilutionPercent > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                            ✓
                          </div>
                          <span>Type de cible : <strong>{jardinInputs.weedType === 'annual' ? 'Feuilles annuelles' : jardinInputs.weedType === 'perennial' ? 'Vivaces dures' : jardinInputs.weedType === 'brush' ? 'Broussailles' : jardinInputs.weedType === 'total' ? 'Désherbage complet' : 'Concentration Perso'}</strong> ({jardinInputs.dilutionPercent}% de dilution)</span>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${jardinInputs.surface > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                            {jardinInputs.surface > 0 ? '✓' : '2'}
                          </div>
                          <span>Surface à traiter : <strong>{jardinInputs.surface} m²</strong></span>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-emerald-500 text-white`}>
                            ✓
                          </div>
                          <span>Matériel : Pulvérisateur de <strong>{jardinInputs.tankCapacity} Litres</strong> (buse: {jardinInputs.coverageRate} m²/L)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 0: Product Selection connected to e-Phy ANSES for Gardening */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-x-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Étape 0 : Choisir le produit (Base e-Phy ANSES)</span>
                      </label>
                      <a 
                        href="https://ephy.anses.fr/" 
                        target="_blank" 
                        rel="referrer"
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline flex items-center gap-x-0.5"
                      >
                        ephy.anses.fr
                      </a>
                    </div>

                    <select
                      value={jardinInputs.ephyProductId}
                      onChange={(e) => handleJardinProductChange(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border font-medium cursor-pointer ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850 shadow-xs'
                      }`}
                    >
                      {EPHY_PRODUCTS.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (AMM N°{prod.ammNumber}) — {prod.substanceName}
                        </option>
                      ))}
                      <option value="custom">🧪 Autre / Produit Personnalisé...</option>
                    </select>

                    {/* Custom Product Inputs when chosen */}
                    {jardinInputs.ephyProductId === 'custom' && (
                      <div className="mt-3.5 p-3 bg-slate-100/40 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paramètres personnalisés</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Nom du Produit</label>
                            <input
                              type="text"
                              value={jardinInputs.productName}
                              onChange={(e) => setJardinInputs(prev => ({ ...prev, productName: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5 font-medium">Substance active</label>
                            <input
                              type="text"
                              value={jardinInputs.activeIngredient}
                              onChange={(e) => setJardinInputs(prev => ({ ...prev, activeIngredient: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Concentration (g/L ou g/kg)</label>
                            <input
                              type="number"
                              value={jardinInputs.productConcentration}
                              onChange={(e) => setJardinInputs(prev => ({ ...prev, productConcentration: parseFloat(e.target.value) || 0 }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 mb-0.5">Formulation physique</label>
                            <select
                              value={jardinInputs.isDry ? 'dry' : 'liquid'}
                              onChange={(e) => setJardinInputs(prev => ({ ...prev, isDry: e.target.value === 'dry', unit: e.target.value === 'dry' ? 'g/kg' : 'g/L' }))}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs focus:outline-none"
                            >
                              <option value="liquid">Formule Liquide (g/L)</option>
                              <option value="dry">Poudre Sèche (g/kg)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Compact Product Delays overview */}
                    <div className="mt-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Matière Active :</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">{jardinInputs.activeIngredient}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Concentration :</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-mono font-medium">{jardinInputs.productConcentration} {jardinInputs.unit}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai de rentrée (DRE) :</span>
                        <strong className="text-amber-600 font-semibold font-mono">{jardinInputs.reentryDelay}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai récolte (DAR) :</span>
                        <strong className="text-blue-600 font-semibold font-mono">{jardinInputs.harvestDelay}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Preset weed selector cards */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-550 text-slate-500 block">
                      Étape 1 : Choisir le type de feuillage / cible
                    </label>

                    {/* Interactive Assist: Preset Weed Targets */}
                    {interactiveHelp && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-x-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Quel type de mauvaises herbes traiter ?</p>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400">Le type de plante dicte la dilution nécessaire : ronces ou lierre requièrent une dilution plus concentrée (3% à 5%) pour vaincre la barrière cuticulaire.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {WEED_PRESETS.map((preset) => {
                        const isSelected = jardinInputs.weedType === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleJardinChange('weedType', preset.id)}
                            className={`cursor-pointer border-2 rounded-2xl p-3.5 text-left transition-all ${
                              isSelected 
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-x-2 mb-1">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {preset.id === 'annual' && <Leaf className="w-4 h-4" />}
                                {preset.id === 'perennial' && <Sparkles className="w-4 h-4" />}
                                {preset.id === 'brush' && <Layers className="w-4 h-4" />}
                                {preset.id === 'total' && <Check className="w-4 h-4" />}
                              </div>
                              <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{preset.name}</span>
                            </div>
                            <p className={`text-[10px] line-clamp-2 leading-tight ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {preset.description}
                            </p>
                            <div className="mt-2 text-right">
                              <span className="text-[10px] font-mono font-black text-emerald-600">
                                {preset.dilutionPercent}% de dilution
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Custom selection */}
                      <div
                        onClick={() => handleJardinChange('weedType', 'custom')}
                        className={`cursor-pointer border-2 rounded-2xl p-3.5 text-left transition-all sm:col-span-2 ${
                          jardinInputs.weedType === 'custom'
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold flex items-center gap-x-2 ${jardinInputs.weedType === 'custom' ? 'text-emerald-900' : 'text-slate-800'}`}>
                            <span className={`w-2 h-2 rounded-full ${jardinInputs.weedType === 'custom' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>Concentration Spécifique Personnalisée</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600">
                            {jardinInputs.dilutionPercent}%
                          </span>
                        </div>
                        {jardinInputs.weedType === 'custom' && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-x-4">
                            <input 
                              type="range"
                              min="0.5"
                              max="10"
                              step="0.1"
                              value={jardinInputs.dilutionPercent}
                              onChange={(e) => handleJardinChange('dilutionPercent', parseFloat(e.target.value))}
                              className="w-full h-1 cursor-pointer"
                            />
                            <input 
                              type="number"
                              min="0.5"
                              max="10"
                              step="0.1"
                              value={jardinInputs.dilutionPercent}
                              onChange={(e) => handleJardinChange('dilutionPercent', parseFloat(e.target.value) || 0)}
                              className="w-16 text-center bg-white border border-slate-250 text-xs text-slate-800 rounded-lg py-1 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input Jardin: Surface Area (m²) */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Étape 2 : Surface de traitement (m²)
                      </label>
                      <input 
                        type="number"
                        value={jardinInputs.surface}
                        onChange={(e) => handleJardinChange('surface', parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-200 text-slate-800 font-mono text-right text-xs rounded-lg px-2 py-1 w-20 max-w-full focus:outline-none focus:border-emerald-500"
                        min="1"
                      />
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="1500"
                      step="10"
                      value={jardinInputs.surface}
                      onChange={(e) => handleJardinChange('surface', parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>10 m²</span>
                      <span>500 m²</span>
                      <span>1500 m² (Grand Jardin)</span>
                    </div>

                    {/* Mode Pro integration for Surface autofill (Jardinier) */}
                    {isProMode && (
                      <div className="mt-3 pt-3 border-t border-slate-205 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-x-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-405 dark:text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span className="font-bold">Sélection parcelles d'exploitation (converti en m²) :</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <select
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                if (value.startsWith('p-')) {
                                  const id = value.replace('p-', '');
                                  const p = exploitationData.parcelles.find(item => item.id === id);
                                  if (p) {
                                    handleJardinChange('surface', Math.round(p.surface * 10000));
                                    setFicheInputs(prev => ({ ...prev, parcelle: p.name }));
                                  }
                                }
                              }}
                              className={`w-full p-2 rounded-xl text-xs border ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                              }`}
                              defaultValue=""
                            >
                              <option value="">-- Parcelles --</option>
                              {exploitationData.parcelles.map(p => (
                                <option key={p.id} value={`p-${p.id}`}>{p.name} ({p.surface} ha → {Math.round(p.surface * 10000)} m²)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                if (value.startsWith('g-')) {
                                  const id = value.replace('g-', '');
                                  const g = exploitationData.groupements.find(item => item.id === id);
                                  if (g) {
                                    const matched = exploitationData.parcelles.filter(p => g.parcelleIds.includes(p.id));
                                    const sumHa = matched.reduce((sumStep, p) => sumStep + p.surface, 0);
                                    handleJardinChange('surface', Math.round(sumHa * 10000));
                                    setFicheInputs(prev => ({ ...prev, parcelle: g.name }));
                                  }
                                }
                              }}
                              className={`w-full p-2 rounded-xl text-xs border ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                              }`}
                              defaultValue=""
                            >
                              <option value="">-- Groupements --</option>
                              {exploitationData.groupements.map(g => {
                                const matched = exploitationData.parcelles.filter(p => g.parcelleIds.includes(p.id));
                                const sumHa = matched.reduce((sumStep, p) => sumStep + p.surface, 0);
                                return (
                                  <option key={g.id} value={`g-${g.id}`}>{g.name} ({Math.round(sumHa * 10000)} m²)</option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Assist: Gardening Surface */}
                    {interactiveHelp && (
                      <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300 animate-fadeIn">
                        <div className="flex items-start gap-x-2">
                          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">Quel espace allez-vous désherber ?</p>
                            <p className="mt-0.5 text-slate-500 dark:text-slate-400">Choisissez une surface de référence pour configurer directement l'outil (cliquez pour appliquer) :</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <button
                                type="button"
                                onClick={() => handleJardinChange('surface', 30)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🏡 30 m² (Allée de garage ou terrasse)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleJardinChange('surface', 150)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🌸 150 m² (Grand Jardin de pavillon)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleJardinChange('surface', 800)}
                                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-205 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 font-mono text-[10px] cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                🌳 800 m² (Propriété arborée ou prairie)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Jardin: Tank capacity / Sprayer size Select */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Taille Pulvérisateur
                      </label>
                      <select
                        value={isJardinTankCustom ? 'custom' : jardinInputs.tankCapacity}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsJardinTankCustom(true);
                          } else {
                            setIsJardinTankCustom(false);
                            handleJardinChange('tankCapacity', parseInt(e.target.value));
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono cursor-pointer"
                      >
                        <option value="1">1 Litre (À gâchette)</option>
                        <option value="2">2 Litres (À pression préalable)</option>
                        <option value="5">5 Litres (Moyen)</option>
                        <option value="8">8 Litres (Standard jardin)</option>
                        <option value="10">10 Litres</option>
                        <option value="12">12 Litres</option>
                        <option value="15">15 Litres (À dos)</option>
                        <option value="20">20 Litres (Grand dos)</option>
                        <option value="custom">Autre / Perso...</option>
                      </select>
                      {isJardinTankCustom && (
                        <div className="mt-2 text-slate-700 animate-fadeIn">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Taille libre (L)</label>
                          <input
                            type="number"
                            value={jardinInputs.tankCapacity}
                            onChange={(e) => handleJardinChange('tankCapacity', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Rendement de Buse
                      </label>
                      <select
                        value={isJardinBuseCustom ? 'custom' : jardinInputs.coverageRate}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsJardinBuseCustom(true);
                          } else {
                            setIsJardinBuseCustom(false);
                            handleJardinChange('coverageRate', parseInt(e.target.value));
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                      >
                        <option value="15">Faible (1L pour 15 m²)</option>
                        <option value="10">Classique (1L pour 10 m²)</option>
                        <option value="5">Abondant (1L pour 5 m²)</option>
                        <option value="custom">Autre / Perso...</option>
                      </select>
                      {isJardinBuseCustom && (
                        <div className="mt-2 text-slate-700 animate-fadeIn">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Rendement libre (m²/L)</label>
                          <input
                            type="number"
                            value={jardinInputs.coverageRate}
                            onChange={(e) => handleJardinChange('coverageRate', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 animate-pulse-once">
                        Concentration Produit
                      </label>
                      <select
                        value={isJardinConcCustom ? 'custom' : jardinInputs.productConcentration}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsJardinConcCustom(true);
                          } else {
                            setIsJardinConcCustom(false);
                            handleJardinChange('productConcentration', parseInt(e.target.value));
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono cursor-pointer"
                      >
                        {CONCENTRATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value} {jardinInputs.unit || 'g/L'}
                          </option>
                        ))}
                        <option value="custom">Autre...</option>
                      </select>
                      {isJardinConcCustom && (
                        <div className="mt-2 text-slate-700 animate-fadeIn">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Concentration libre</label>
                          <input
                            type="number"
                            value={jardinInputs.productConcentration}
                            onChange={(e) => handleJardinChange('productConcentration', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Assist: Gardening Material */}
                  {interactiveHelp && (
                    <div className="mt-1.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300 animate-fadeIn">
                      <div className="flex items-start gap-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">Conseils d'Équipement (Jardin) :</p>
                          <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <li>Le <span className="font-semibold text-slate-700 dark:text-slate-300">Rendement de Buse</span> exprime la vitesse et densité de vaporisation (classiquement 1 Litre pulvérisé couvre 10 m²).</li>
                            <li>Ajustez la <span className="font-semibold text-slate-700 dark:text-slate-300">Taille du Pulvérisateur</span> selon votre réservoir physique pour calculer automatiquement le nombre de rechargements nécessaires.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Computation outputs area */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Digital precise prescription panel */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative">
                    <div className="absolute top-4 right-4 text-emerald-500/5 pointer-events-none">
                      <Droplet className="w-16 h-16" />
                    </div>

                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#22c55e] text-emerald-700 mb-4">
                      Prescription de Dosage de Précision
                    </h3>

                    <div className="space-y-4">
                      {/* Visual recommendation note */}
                      {currentPreset && (
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex gap-x-2 items-center">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{currentPreset.recommendation}</span>
                        </div>
                      )}

                      {jardinInputs.productConcentration !== 360 && (
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex gap-x-2 items-center">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Dosage automatiquement ajusté pour la concentration de <strong>{jardinInputs.productConcentration} {jardinInputs.unit}</strong> (Facteur {(360 / jardinInputs.productConcentration).toFixed(2)}x appliqué sur la dose de référence).
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          <span className="block text-[10px] text-slate-500 font-medium">Nom du Produit Sélectionné</span>
                          <span className="text-xs font-bold font-sans text-slate-800 block truncate mt-1">
                            {jardinInputs.productName}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            AMM N° {jardinInputs.ammNumber}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                          <span className="block text-[10px] text-slate-500 font-medium">Produit pur à doser</span>
                          <span className="text-xl font-bold font-mono text-rose-600 mt-1 block">
                            {jardinOutputs.totalProduct} <span className="text-xs font-medium">{jardinInputs.isDry ? 'g' : 'ml'}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Soit {jardinInputs.isDry ? `${(jardinOutputs.totalProduct / 1000).toFixed(3)} kg` : `${(jardinOutputs.totalProduct / 1000).toFixed(3)} Litre(s)`}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl col-span-2 md:col-span-1">
                          <span className="block text-[10px] text-slate-500 font-medium">Eau & Bouillie totale</span>
                          <span className="text-xl font-bold font-mono text-blue-600 mt-1 block">
                            {jardinOutputs.totalWater} <span className="text-xs font-medium">L</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Pour {jardinInputs.surface} m² de terrain
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backpack Sprayer filling steps */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-x-2">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Guide de Remplissage (Par Pulvérisation)</span>
                      </div>
                      <span className="text-xs bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-medium">
                        Capacité {jardinInputs.tankCapacity}L
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Visual measuring jar */}
                      <div className="md:col-span-4 flex flex-col items-center">
                        <div className="w-24 h-40 relative bg-white border-2 border-slate-200 rounded-b-lg rounded-t shadow-sm flex flex-col justify-end overflow-hidden">
                          {/* Scale lines */}
                          <div className="absolute top-3 right-1 text-[8px] font-mono text-slate-400 flex flex-col gap-y-5">
                            <span>{jardinInputs.tankCapacity}L</span>
                            <span>{Math.round(jardinInputs.tankCapacity * 0.75)}L</span>
                            <span>{Math.round(jardinInputs.tankCapacity * 0.5)}L</span>
                            <span>{Math.round(jardinInputs.tankCapacity * 0.25)}L</span>
                          </div>

                          {/* Water content in jar */}
                          <div className="w-full bg-blue-500/10 relative transition-all" style={{ height: '80%' }}>
                            {/* Herbicide float top representation */}
                            <div className="absolute top-0 w-full h-1.5 bg-rose-500/25 border-b border-rose-500/10" />
                          </div>

                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-1 font-sans">
                            <span className="text-[10px] font-mono font-extrabold text-emerald-700 bg-white border border-emerald-100 py-0.5 px-1.5 rounded">
                              {jardinOutputs.productPerFullTank} {jardinInputs.isDry ? 'g' : 'ml'}
                            </span>
                            <span className="text-[8px] text-slate-500 font-semibold mt-1">de produit</span>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-2 text-center leading-tight font-mono">
                          Dosage par pulvérisateur de {jardinInputs.tankCapacity} Litres
                        </div>
                      </div>

                      {/* Explicit instruction list */}
                      <div className="md:col-span-8 space-y-3.5">
                        
                        {jardinOutputs.actualMixRequired ? (
                          <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-sm">
                            <div className="text-xs text-emerald-700 font-bold mb-1.5 flex items-center gap-x-1">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Pas besoin de remplir entièrement le pulvérisateur !</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                              Votre surface est de {jardinInputs.surface} m². Doser une cuve entière gaspillerait du produit. Préparez simplement ce volume de mélange :
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="bg-slate-50 p-2 rounded-lg text-center">
                                <span className="text-[10px] text-slate-400 block truncate">{jardinInputs.productName}</span>
                                <span className="font-bold text-rose-600">{jardinOutputs.totalProduct} {jardinInputs.isDry ? 'g' : 'ml'}</span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg text-center">
                                <span className="text-[10px] text-slate-400 block">Eau claire</span>
                                <span className="font-bold text-blue-600">{jardinOutputs.totalWater} L</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                              <div className="text-xs font-bold text-slate-800 mb-2">
                                Étape de préparation (par pulvérisateur plein) :
                              </div>
                              <ul className="space-y-1.5 text-xs text-slate-600 font-mono">
                                <li className="flex justify-between">
                                  <span>1. Dose de {jardinInputs.productName} :</span>
                                  <span className="font-bold text-rose-600">{jardinOutputs.productPerFullTank} {jardinInputs.isDry ? 'g' : 'ml'}</span>
                                </li>
                                <li className="flex justify-between border-t border-slate-100 pt-1.5">
                                  <span>2. Volume d'eau d'appoint :</span>
                                  <span className="font-bold text-blue-600">{jardinOutputs.waterPerFullTank} L</span>
                                </li>
                              </ul>
                            </div>

                            <p className="text-xs text-slate-500 font-medium">
                              👉 Vous devrez préparer un total de <strong>{jardinOutputs.numTanks}</strong> pulvérisateur{jardinOutputs.numTanks > 1 ? 's' : ''} complet{jardinOutputs.numTanks > 1 ? 's' : ''} de {jardinInputs.tankCapacity}L pour couvrir {jardinInputs.surface} m².
                            </p>
                          </div>
                        )}

                        {/* Measuring tips */}
                        <div className="bg-emerald-50/10 p-3 rounded-xl border border-slate-150 text-[11px] text-slate-600 flex items-start gap-x-2">
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 font-mono font-bold px-1.5 py-0.5 rounded shrink-0">Repère</span>
                          <span>
                            {jardinInputs.isDry ? (
                              `Ce produit est une formulation solide (poudre/granulés). Pesez précisément la quantité nécessaire (${jardinOutputs.productPerFullTank} g) à l'aide d'une balance de ménage ou d'une cuillère doseuse appropriée.`
                            ) : (
                              `Un bouchon de bouteille standard de ${jardinInputs.productName} correspond à environ 20 ml de produit liquide. Pour un pulvérisateur complet de ${jardinInputs.tankCapacity}L, versez l'équivalent de ${Math.round(jardinOutputs.productPerFullTank / 20 * 10) / 10} bouchon(s).`
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Legal environmental reminder */}
                  <div className="bg-amber-50/45 border border-amber-100 p-4 rounded-xl flex gap-x-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                      <div className="font-bold text-amber-900">Avertissement légal France / Loi Labbé :</div>
                      <p className="mt-0.5 leading-relaxed text-slate-500">
                        L'utilisation des herbicides de synthèse classiques (glyphosate) est interdite pour les particuliers en France dans les jardins, allées et espaces privés. Pour les particuliers, privilégiez les produits de biocontrôle (à base d'acide acétique ou d'acide pélargonique). Ce calculateur s'adapte également à ces substances de substitution !
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== 3. WEATHER ASSISTANT ====== */}
            {mode === 'weather' && (
              <motion.div
                key="mode-weather"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
              >
                {/* Station setup panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h2 className={`text-lg font-bold font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Station Météo du Pulvérisateur</h2>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-relaxed`}>
                      La météo influence fortement l'efficacité systémique de l'herbicide et le niveau de dérive réglementaire dans l'environnement. Ajustez les capteurs suivants :
                    </p>
                  </div>

                  {/* Real-time Weather Selector / Sélecteur météo en temps réel */}
                  <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950/45 border-slate-800' : 'bg-white border-slate-205 border-slate-200'} shadow-sm`}>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      🌦️ Option Météo en Temps Réel / Presets
                    </label>
                    <select
                      value={weatherPreset}
                      onChange={(e) => applyWeatherPreset(e.target.value)}
                      className={`w-full text-xs font-semibold rounded-xl px-3 py-2.5 border transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-850 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-205 border-slate-200 text-slate-800 focus:border-emerald-500'
                      } cursor-pointer`}
                    >
                      <option value="custom">⚙️ Curseurs Personnalisés / Manuel</option>
                      <option value="realtime">📡 Synchronisation Temps Réel (Simulation Heure/Saison Live)</option>
                      <option value="gps-realtime">📍 Synchronisation temps réel position exacte (GPS + Météo Live)</option>
                      <option value="optimal">🌤️ Matin Idéal (Tempérée & Humide - Optimal)</option>
                      <option value="windy">💨 Après-midi de Rafales (Venteux - Dérive critique)</option>
                      <option value="hot">☀️ Canicule Intense (Chaud & Sec - Évaporations)</option>
                      <option value="cold">❄️ Fraîcheur Aube (Froid - Blocage végétal)</option>
                      <option value="wet">💧 Humidité Rosée (Saturé - Risque lessivage)</option>
                    </select>

                    {weatherPreset === 'realtime' && (
                      <div className="mt-3 flex items-center gap-x-2 bg-emerald-500/10 text-emerald-500 text-[11px] font-mono p-2.5 rounded-xl border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span>Météo Temps Réel synchronisée sur le fuseau local ({new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}).</span>
                      </div>
                    )}

                    {weatherPreset === 'gps-realtime' && (
                      <div className="mt-3 space-y-2">
                        {isGpsLoading && (
                          <div className="flex items-center gap-x-2 bg-teal-500/10 text-teal-500 text-[11px] font-mono p-2.5 rounded-xl border border-teal-500/20">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0" />
                            <span>Acquisition des coordonnées de l'appareil et requêtage Open-Meteo...</span>
                          </div>
                        )}
                        {gpsError && (
                          <div className="flex items-start gap-x-2 bg-amber-500/10 text-amber-500 text-[11px] font-mono p-2.5 rounded-xl border border-amber-500/20">
                            <span className="mt-0.5 shrink-0">⚠️</span>
                            <div>
                              <strong className="block">Échec de synchronisation GPS :</strong>
                              <span className="text-[10px] opacity-90">{gpsError}</span>
                              <span className="block text-[9px] text-slate-400 mt-1">Utilisation de l'heure locale comme secours hors-ligne.</span>
                            </div>
                          </div>
                        )}
                        {!isGpsLoading && gpsCoords && (
                          <div className="flex flex-col gap-y-1 bg-emerald-500/10 text-emerald-550 text-emerald-500 text-[11px] font-mono p-2.5 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-x-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-bold">Position synchronisée avec succès !</span>
                            </div>
                            <div className="text-[10px] pl-4 text-slate-400">
                              <div>• Coordonnées : <span className="text-emerald-400 font-bold">{gpsCoords.lat.toFixed(4)}° N, {gpsCoords.lon.toFixed(4)}° E</span></div>
                              <div>• Station source : <span className="text-emerald-400 font-bold">Open-Meteo API</span></div>
                              <button 
                                onClick={handleGpsSync} 
                                className="mt-1 text-[9px] underline text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
                              >
                                🔄 Actualiser la position
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slider 1: Temperature */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/25 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-slate-800 flex items-center gap-x-2">
                        <Thermometer className="w-4 h-4 text-rose-550 text-rose-600" />
                        <span className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}>Température Ambiante</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-rose-600">{weatherInput.temp} °C</span>
                    </div>
                    <input 
                      type="range"
                      min="2"
                      max="35"
                      step="1"
                      value={weatherInput.temp}
                      onChange={(e) => {
                        setWeatherPreset('custom');
                        setWeatherInput(prev => ({ ...prev, temp: parseInt(e.target.value) }));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
                      <span>2 °C (Gelée)</span>
                      <span>20 °C (Optimal)</span>
                      <span>35 °C (Canicule)</span>
                    </div>
                  </div>

                  {/* Slider 2: Wind */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/25 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-slate-800 flex items-center gap-x-2">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <span className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}>Vitesse du Vent</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">{weatherInput.wind} km/h</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={weatherInput.wind}
                      onChange={(e) => {
                        setWeatherPreset('custom');
                        setWeatherInput(prev => ({ ...prev, wind: parseInt(e.target.value) }));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
                      <span>0 km/h (Calme)</span>
                      <span>19 km/h (Limite)</span>
                      <span>30 km/h (Alerte)</span>
                    </div>
                  </div>

                  {/* Slider 3: Humidity */}
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/25 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-semibold text-slate-800 flex items-center gap-x-2">
                        <Droplets className="w-4 h-4 text-indigo-600" />
                        <span className={isDarkMode ? 'text-slate-300' : 'text-slate-800'}>Hygrométrie (Humidité relative)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-indigo-600">{weatherInput.humidity} %</span>
                    </div>
                    <input 
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={weatherInput.humidity}
                      onChange={(e) => {
                        setWeatherPreset('custom');
                        setWeatherInput(prev => ({ ...prev, humidity: parseInt(e.target.value) }));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer my-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium">
                      <span>20 % (Aride)</span>
                      <span>65 % (Recommandé)</span>
                      <span>100 % (Brouillard)</span>
                    </div>
                  </div>
                </div>

                {/* Verdict output panel */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Weather Sub-Tabs Switcher */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 gap-x-6 pb-2">
                    <button
                      onClick={() => setWeatherSubTab('current')}
                      className={`text-xs sm:text-sm font-bold tracking-wide pb-2 border-b-2 transition-all cursor-pointer ${
                        weatherSubTab === 'current'
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      📟 Temps Réel & Verdict
                    </button>
                    <button
                      onClick={() => setWeatherSubTab('history')}
                      className={`text-xs sm:text-sm font-bold tracking-wide pb-2 border-b-2 transition-all cursor-pointer ${
                        weatherSubTab === 'history'
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      ⏳ Historique Météo
                    </button>
                    <button
                      onClick={() => setWeatherSubTab('forecast')}
                      className={`text-xs sm:text-sm font-bold tracking-wide pb-2 border-b-2 transition-all cursor-pointer ${
                        weatherSubTab === 'forecast'
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
                      }`}
                    >
                      🔮 Prévisions Météo
                    </button>
                  </div>

                  {/* SUB-TAB 1: CURRENT STATUS & LAWS */}
                  {weatherSubTab === 'current' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Dynamic Weather Rating Screen */}
                      <div className={`border rounded-2xl p-6 ${weatherAdvisory.badgeBg} border-slate-200/60 transition-all duration-300 shadow-sm`}>
                        <div className="flex items-center gap-x-3 mb-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            weatherAdvisory.status === 'optimal' ? 'bg-emerald-100 text-emerald-800' :
                            weatherAdvisory.status === 'warning' ? 'bg-amber-100 text-amber-805' : 'bg-red-100 text-red-800'
                          }`}>
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 block">DÉCISION ANALYTIQUE</span>
                            <h3 className={`text-base font-black ${
                              weatherAdvisory.status === 'optimal' ? 'text-emerald-700' :
                              weatherAdvisory.status === 'warning' ? 'text-amber-800' : 'text-red-700'
                            } tracking-wide`}>
                              {weatherAdvisory.verdict}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-3 mt-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Détail des facteurs d'influence :
                          </h4>
                          <ul className="space-y-2">
                            {weatherAdvisory.details.map((detail, idx) => (
                              <li key={idx} className="flex gap-x-2 text-xs text-slate-600">
                                <span className="text-emerald-600 font-bold shrink-0 font-mono">■</span>
                                <span className="leading-relaxed">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Regulations reminder card */}
                      <div className="bg-slate-50 border border-slate-100 dark:bg-slate-950/40 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-x-2">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          <span>Réglementations environnementales importantes (France)</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
                          <div className="bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 p-3 rounded-xl shadow-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-250 mb-1 flex items-center gap-x-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Période sans pluie</span>
                            </div>
                            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                              Le produit <strong>"{mode === 'agri' ? agriInputs.productName : jardinInputs.productName}"</strong> nécessite généralement au moins <strong>2 à 6 heures sans pluie</strong> après application pour pénétrer correctement les cuticules des feuilles. Une pluie prématurée rincera le principe actif et établira un risque de lessivage vers les nappes phréatiques.
                            </p>
                          </div>

                          <div className="bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-slate-805 dark:border-slate-800 p-3 rounded-xl shadow-xs">
                            <div className="font-bold text-slate-800 dark:text-slate-250 mb-1 flex items-center gap-x-1.5">
                              <Scale className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Règle des 19 km/h</span>
                            </div>
                            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                              L'arrêté ministériel interdit toute application de produits phytopharmaceutiques par un vent supérieur à <strong>19 km/h (Force 3 de Beaufort)</strong> pour éviter la dérive atmosphérique vers les cultures voisines ou les fossés.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: HISTORICAL WEATHER ARCHIVE */}
                  {weatherSubTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* History type selector */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Sélectionner le mode d'historique :
                        </span>
                        <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl gap-x-1">
                          <button
                            onClick={() => setHistoryViewType('daily')}
                            className={`py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              historyViewType === 'daily'
                                ? 'bg-emerald-600 border-transparent text-white shadow-xs'
                                : 'text-slate-505 text-slate-500 hover:text-slate-850 dark:hover:text-white'
                            }`}
                          >
                            📅 Jour par Jour (7j)
                          </button>
                          <button
                            onClick={() => setHistoryViewType('hourly')}
                            className={`py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              historyViewType === 'hourly'
                                ? 'bg-emerald-600 border-transparent text-white shadow-xs'
                                : 'text-slate-550 text-slate-500 hover:text-slate-850 dark:hover:text-white'
                            }`}
                          >
                            🕒 Heure par Heure (24h)
                          </button>
                        </div>
                      </div>

                      {/* 7-Day Interactive Historical Evolution Chart */}
                      <div className={`p-4 border rounded-2xl transition-all ${
                        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div className="mb-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-x-1.5">
                            <Thermometer className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span>Histogramme & Évolution (7 derniers jours)</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Suivi des amplitudes thermiques (Max/Min en °C) et des vitesses maximales du vent (km/h) requis pour la traçabilité.
                          </p>
                        </div>

                        <div className="h-64 w-full text-xs font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={reversedHistoryData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id="tempMinMaxGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                              <XAxis 
                                dataKey="shortDate" 
                                tickLine={false} 
                                axisLine={false}
                                tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                              />
                              <YAxis 
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#10b981' : '#059669', fontSize: 10 }}
                                unit="°C"
                                domain={['auto', 'auto']}
                              />
                              <YAxis 
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#f43f5e' : '#e11d48', fontSize: 10 }}
                                unit=" km/h"
                                domain={[0, 'auto']}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                  borderRadius: '12px',
                                  color: isDarkMode ? '#f8fafc' : '#0f172a',
                                  fontSize: '11px',
                                  fontFamily: 'monospace'
                                }}
                              />
                              <Legend verticalAlign="top" height={36} iconType="circle" />
                              <Area 
                                yAxisId="left"
                                type="monotone" 
                                name="Temp Max (°C)"
                                dataKey="tempMax" 
                                stroke="#10b981" 
                                fill="url(#tempMinMaxGrad)" 
                                strokeWidth={2.5}
                                activeDot={{ r: 6 }}
                              />
                              <Area 
                                yAxisId="left"
                                type="monotone" 
                                name="Temp Min (°C)"
                                dataKey="tempMin" 
                                stroke="#3b82f6" 
                                fill="none"
                                strokeWidth={1.5}
                                strokeDasharray="3 3"
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                name="Vent Max (km/h)"
                                dataKey="wind" 
                                stroke="#f43f5e" 
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Historical Database Table */}
                      <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-200'}`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b font-mono font-bold tracking-wide uppercase ${isDarkMode ? 'bg-slate-900 boder-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                <th className="py-3 px-4">{historyViewType === 'daily' ? 'Date' : 'Heure'}</th>
                                <th className="py-3 px-4 text-center">Température</th>
                                <th className="py-3 px-4 text-center">Vent</th>
                                <th className="py-3 px-4 text-center">Hygrométrie</th>
                                <th className="py-3 px-4 text-right">Pulvérisation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                              {historyViewType === 'daily' ? (
                                weatherCollections.historyDaily.map((item, idx) => {
                                  const s = item.verdict.status;
                                  return (
                                    <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'}`}>
                                      <td className="py-3 px-4 font-semibold">{item.date}</td>
                                      <td className="py-3 px-4 font-mono font-bold text-center">{item.tempMin}°C - {item.tempMax}°C</td>
                                      <td className="py-3 px-4 font-mono text-center">{item.wind} km/h</td>
                                      <td className="py-3 px-4 font-mono text-center">{item.humidity}% HR</td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-x-1.5">
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            s === 'optimal' ? 'bg-emerald-500' :
                                            s === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                          }`} />
                                          <span className={`font-semibold text-[11px] uppercase ${
                                            s === 'optimal' ? 'text-emerald-505 text-emerald-600 font-bold' :
                                            s === 'warning' ? 'text-amber-550 text-amber-600' : 'text-red-500'
                                          }`}>
                                            {s === 'optimal' ? 'Optimal' : s === 'warning' ? 'Vigilance' : 'Interdit'}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                weatherCollections.historyHourly.map((item, idx) => {
                                  const s = item.verdict.status;
                                  return (
                                    <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'}`}>
                                      <td className="py-3 px-4 font-semibold font-mono">{item.time}</td>
                                      <td className="py-3 px-4 font-mono font-bold text-center">{item.temp}°C</td>
                                      <td className="py-3 px-4 font-mono text-center">{item.wind} km/h</td>
                                      <td className="py-3 px-4 font-mono text-center">{item.humidity}% HR</td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-x-1.5">
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            s === 'optimal' ? 'bg-emerald-500' :
                                            s === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                          }`} />
                                          <span className={`font-semibold text-[11px] uppercase ${
                                            s === 'optimal' ? 'text-emerald-505 text-emerald-400 font-bold' :
                                            s === 'warning' ? 'text-amber-550 text-amber-500' : 'text-red-500'
                                          }`}>
                                            {s === 'optimal' ? 'Optimal' : s === 'warning' ? 'Vigilance' : 'Interdit'}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-relaxed text-slate-400 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        * L'historique permet d'attester de la régularité des conditions météo du passé pour le cahier de traçabilité d'épandage réglementaire.
                      </p>
                    </div>
                  )}

                  {/* SUB-TAB 3: FUTURE WEATHER FORECAST */}
                  {weatherSubTab === 'forecast' && (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* Forecast Section 1: Daily forecast (7 prochains jours) */}
                      <div className="space-y-2.5 text-left">
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-x-1.5`}>
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span>Météo Jour par Jour (7 prochains jours)</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {weatherCollections.forecastDaily.map((item, idx) => {
                            const s = item.verdict.status;
                            return (
                              <div
                                key={idx}
                                className={`p-3.5 border rounded-2xl flex flex-col justify-between text-xs transition-all ${
                                  isDarkMode ? 'bg-slate-950/30 border-slate-850 hover:bg-slate-950/50' : 'bg-white border-slate-200 hover:shadow-xs'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2.5">
                                  <span className="font-bold">{item.date}</span>
                                  <div className="flex items-center gap-x-1 shrink-0">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      s === 'optimal' ? 'bg-emerald-500' :
                                      s === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                    }`} />
                                    <span className={`text-[9px] font-bold uppercase ${
                                      s === 'optimal' ? 'text-emerald-500' :
                                      s === 'warning' ? 'text-amber-505 text-amber-500' : 'text-red-500'
                                    }`}>
                                      {s === 'optimal' ? 'Optimal' : s === 'warning' ? 'Vigilance' : 'Interdit'}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1 font-mono text-[11px] mb-2 text-slate-500">
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400">Temp Max</span>
                                    <strong className={`${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.tempMax}°C</strong>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400">Vent</span>
                                    <strong className={`${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.wind}k/h</strong>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400">Pluie</span>
                                    <strong className={`${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.rainProb}%</strong>
                                  </div>
                                </div>
                                <p className={`text-[10px] italic border-t pt-1.5 shrink-0 truncate ${isDarkMode ? 'text-slate-405 border-slate-900/60' : 'text-slate-504 text-slate-505 border-slate-100'}`} title={item.verdict.details[0]}>
                                  {item.verdict.details[0]}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Forecast Section 2: Hourly forecast (24 prochaines heures) */}
                      <div className="space-y-2.5 text-left">
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-x-1.5`}>
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span>Météo Heure par Heure (24 prochaines heures)</span>
                        </h4>

                        <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-white border-slate-200'}`}>
                          <div className="overflow-x-auto max-h-[290px] overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="sticky top-0 z-10 shadow-xs">
                                <tr className={`border-b font-mono font-bold tracking-wide uppercase ${isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                  <th className="py-2.5 px-4">Heure</th>
                                  <th className="py-2.5 px-4 text-center">Température</th>
                                  <th className="py-2.5 px-4 text-center">Vent</th>
                                  <th className="py-2.5 px-4 text-center">Hygrométrie</th>
                                  <th className="py-2.5 px-4 text-center">Prob. Pluie</th>
                                  <th className="py-2.5 px-4 text-right">Statut Spray</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                                {weatherCollections.forecastHourly.map((item, idx) => {
                                  const s = item.verdict.status;
                                  return (
                                    <tr key={idx} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-50'}`}>
                                      <td className="py-2.5 px-4 font-semibold font-mono">{item.time}</td>
                                      <td className="py-2.5 px-4 font-mono font-bold text-center">{item.temp}°C</td>
                                      <td className="py-2.5 px-4 font-mono text-center">{item.wind} km/h</td>
                                      <td className="py-2.5 px-4 font-mono text-center">{item.humidity}% HR</td>
                                      <td className="py-2.5 px-4 font-mono text-center text-blue-500 font-bold">{item.rainProb}%</td>
                                      <td className="py-2.5 px-4">
                                        <div className="flex items-center justify-end gap-x-1.5">
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            s === 'optimal' ? 'bg-emerald-500' :
                                            s === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                          }`} />
                                          <span className={`font-semibold text-[11px] uppercase ${
                                            s === 'optimal' ? 'text-emerald-550 text-emerald-600 font-bold' :
                                            s === 'warning' ? 'text-amber-550 text-amber-600' : 'text-red-500'
                                          }`}>
                                            {s === 'optimal' ? 'Optimal' : s === 'warning' ? 'Vigilance' : 'Interdit'}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ====== 4. HEALTH & SAFETY GUIDE ====== */}
            {mode === 'safety' && (
              <motion.div
                key="mode-safety"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-lg font-bold font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sécurité de l'Opérateur & Bonnes Pratiques</h2>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Les substances chimiques exigent une manipulation prudente pour l'humain et les milieux aquatiques.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Visual protection rules */}
                  <div className={`p-5 rounded-2xl border flex flex-col items-center text-center space-y-3.5 shadow-sm transition-all ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-105' : 'text-slate-800'}`}>Protection Individuelle (EPI)</h3>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                      Équipez-vous obligatoirement de <strong>gants en nitrile</strong> longue manchette, de lunettes de pulvérisation étanches, d'un masque respiratoire de catégorie A2P3 et d'une combinaison étanche avant l'ouverture du bidon.
                    </p>
                  </div>

                  {/* Triple rinsing card */}
                  <div className={`p-5 rounded-2xl border flex flex-col items-center text-center space-y-3.5 shadow-sm transition-all ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-12 h-12 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-105' : 'text-slate-800'}`}>Le Triple Rinçage</h3>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                      Rincez <strong>3 fois</strong> le bidon de produit vide en versant l'eau de rinçage directement dans le bac d'incorporation du pulvérisateur. Égouttez le flacon puis rapportez-le en consigne ADIVALOR.
                    </p>
                  </div>

                  {/* Water Protection */}
                  <div className={`p-5 rounded-2xl border flex flex-col items-center text-center space-y-3.5 shadow-sm transition-all ${
                    isDarkMode ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <Droplets className="w-6 h-6" />
                    </div>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-105' : 'text-slate-800'}`}>Préservation des Eaux</h3>
                    <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                      Respectez une <strong>Zone de Non-Traitement (ZNT)</strong> de 5 mètres minimum de tout cours d'eau, fossé d'écoulement ou point de collecte. Ne lavez jamais le pulvérisateur à proximité d'un puits ou d'une bouche d'égout.
                    </p>
                  </div>
                </div>

                {/* Mixing steps and Emergency help */}
                <div className={`border p-5 rounded-2xl space-y-4 transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-600">
                    Procédures d'Urgences & Premières Précautions :
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-x-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>En cas d'exposition cutanée ou oculaire :</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">
                        Retirez immédiatement les vêtements souillés. Rincez abondamment la peau et les yeux sous l'eau courante et claire pendant 15 minutes. N'utilisez pas de savon abrasif. En cas d'inconfort ou de brûlure, contactez d'urgence le <strong>Centre Antipoison</strong> ou le 15.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-x-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Recommandations d'élimination :</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">
                        Ne jetez jamais les résidus de spray (l'eau de fond de cuve) dans le caniveau. Diluer l'éventuel reliquat par 10 et vaporiser sur une parcelle non traitée. Déposez les bidons vides auprès d'un centre de collecte agrée.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'calendar' && (
              <motion.div
                key="mode-calendar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <TreatmentCalendar
                  isDarkMode={isDarkMode}
                  forecastDaily={weatherCollections.forecastDaily}
                  onLoadIntoDraftFiche={handleLoadTaskIntoFiche}
                  currentWindSpeed={weatherInput.wind}
                />
              </motion.div>
            )}

            {mode === 'drift' && (
              <motion.div
                key="mode-drift"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* DYNAMIC SAFETY DISTANCE (ZNT) & DRIFT CALCULATOR */}
                <ZntCalculator 
                  isDarkMode={isDarkMode} 
                  currentWindSpeed={weatherInput.wind} 
                  onApplyZntToFiche={handleApplyZntToFiche} 
                  isProMode={isProMode}
                  exploitationData={exploitationData}
                />
              </motion.div>
            )}

            {mode === 'ai' && (
              <motion.div
                key="mode-ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                {/* Header view */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-lg font-bold font-display flex items-center gap-x-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <Bot className="w-5.5 h-5.5 text-teal-500 animate-pulse" />
                      <span>Agro-Assistant Expert & Diagnostic IA</span>
                    </h2>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                      Posez des questions agronomiques complexes, analysez des photos de nuisibles et recherchez des points d'intérêts locaux via l'intelligence Gemini.
                    </p>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className={`p-2 px-3 rounded-xl border text-xs flex items-center gap-x-2 ${
                    isDarkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span>Moteur d'inférence sécurisé</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Configuration & Input Col (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Choose AI intelligence level */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                      <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Niveau d'Intelligence requis:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gemini-3.1-flash-lite', label: '⚡ Flash Lite', desc: 'Ultra-Rapide' },
                          { id: 'gemini-3.5-flash', label: '💡 Standard', desc: 'Équilibré' },
                          { id: 'gemini-3.1-pro-preview', label: '🧠 Pro-Preview', desc: 'Raisonnement' }
                        ].map((tier) => {
                          const isSel = (aiImageBase64 ? 'gemini-3.1-pro-preview' : isAiHighThinking ? 'gemini-3.1-pro-preview' : isAiMapsGrounding ? 'gemini-3.5-flash' : aiModelUsed || 'gemini-3.5-flash') === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              disabled={!!aiImageBase64 || isAiHighThinking || isAiMapsGrounding}
                              onClick={() => setAiModelUsed(tier.id)}
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                                  : (isDarkMode 
                                      ? 'bg-slate-900/50 hover:bg-slate-850 border-slate-800 text-slate-400' 
                                      : 'bg-slate-50 hover:bg-slate-100 border-slate-202 text-slate-600')
                              } disabled:opacity-50`}
                            >
                              <span className="text-[11px] font-bold">{tier.label}</span>
                              <span className="text-[9px] font-normal opacity-80 mt-0.5">{tier.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                      
                      {aiImageBase64 ? (
                        <p className="text-[10px] text-amber-500 italic">
                          ℹ️ Photo détectée : le modèle expert <strong>gemini-3.1-pro-preview</strong> est sélectionné d'office.
                        </p>
                      ) : isAiHighThinking ? (
                        <p className="text-[10px] text-amber-505 italic">
                          ℹ️ Haute Réflexion active : bascule sur <strong>gemini-3.1-pro-preview</strong>.
                        </p>
                      ) : isAiMapsGrounding ? (
                        <p className="text-[10px] text-amber-500 italic">
                          ℹ️ Mode Maps activé : le modèle <strong>gemini-3.5-flash</strong> est requis.
                        </p>
                      ) : null}
                    </div>

                    {/* Features options (Deep Thinking & Maps Grounding) */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/20 border-[#1e293b]' : 'bg-white border-[#e2e8f0]'} space-y-4`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Paramètres d'Analyse :
                      </h3>

                      {/* Google Maps Search Grounding */}
                      <label className="flex items-start gap-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isAiMapsGrounding}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsAiMapsGrounding(val);
                            if (val) {
                              setIsAiHighThinking(false);
                            }
                          }}
                          className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <div className={`text-xs font-bold flex items-center gap-x-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-805'}`}>
                            <MapPin className="w-3.5 h-3.5 text-teal-500" />
                            <span>Cartographie Google Maps Live</span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                            Interroge le moteur Maps pour géo-sélectionner les coopératives, distributeurs d'EPI, déchèteries et points de collecte proches de votre position.
                          </p>
                        </div>
                      </label>

                      {/* High Thinking Mode Toggle */}
                      <label className="flex items-start gap-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isAiHighThinking}
                          disabled={isAiMapsGrounding}
                          onChange={(e) => {
                            setIsAiHighThinking(e.target.checked);
                          }}
                          className="mt-1 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-50"
                        />
                        <div className={isAiMapsGrounding ? 'opacity-50' : ''}>
                          <div className={`text-xs font-bold flex items-center gap-x-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Haute Réflexion (Deep Thinking 🧠)</span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                            Indispensable pour résoudre des cas compliqués de résistances, des plans d'épandage alternatifs ou mélanges délicats de produits.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Drag & Drop weed photo analyzer */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/20 border-[#1e293b]' : 'bg-white border-[#e2e8f0]'} space-y-3`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        📸 Analyse d'image de terrain:
                      </h3>
                      
                      {!aiImagePreview ? (
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center text-center justify-center hover:border-teal-500/60 transition-all cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAiImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Upload className="w-7 h-7 text-slate-400 dark:text-slate-655 mb-2" />
                          <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Déposer une photo ou cliquer pour charger
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            (Identifie adventices, mauvaises herbes, maladies)
                          </span>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800">
                          <img
                            src={aiImagePreview}
                            alt="Preview adventice"
                            className="w-full h-40 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={handleClearAiImage}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition-all cursor-pointer"
                            title="Supprimer la photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="p-2 bg-slate-950/80 text-white text-[10px] text-center font-semibold">
                            Photo chargée avec succès !
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dialogue & Results Col (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col space-y-4">
                    {/* Suggested questions container */}
                    <div className="space-y-2">
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-505'} block`}>
                        💡 Exemples de questions / situations types:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { text: "Quels sont les symptômes de résistance du séneçon au glyphosate ?", label: "Résistance Adventices" },
                          { text: `Trouve les déchetteries ou points de collecte d'emballages vides proches de moi (réseau ADIVALOR).`, label: "📍 Déchets & Recyclage" },
                          { text: "Quelles conditions atmosphériques de vent, de pluie et d'hygrométrie rendent une pulvérisation optimale ou illégale ?", label: "Droit & Météo" },
                          { text: `Est-ce conseillé de mélanger du sulfate d'ammonium à l'eau de préparation pour optimiser l'efficacité de l'herbicide ?`, label: "Mélange & Dureté" }
                        ].map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiPrompt(sug.text);
                              if (sug.text.includes("Trouve les déch")) {
                                setIsAiMapsGrounding(true);
                              }
                            }}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              isDarkMode 
                                ? 'bg-slate-900 hover:bg-slate-850 hover:border-teal-500/30 border-slate-800 text-slate-300' 
                                : 'bg-white hover:bg-slate-50 hover:border-teal-500/30 border-slate-205 text-slate-600'
                            }`}
                          >
                            <span className="text-teal-600 dark:text-teal-400 font-bold block mb-0.5 text-[10px]">[{sug.label}]</span>
                            <span className="line-clamp-1 text-[10px] opacity-90">{sug.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Question Input Form */}
                    <form onSubmit={(e) => { e.preventDefault(); handleAiSubmit(); }} className="space-y-3">
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder={
                            aiImageBase64 
                              ? "Décrivez ce que vous observez sur cette photo pour m'aider à poser le bon diagnostic..." 
                              : `Posez votre question agronomique par exemple : "Quelles adventices résistent le plus et quel dosage de ${mode === 'agri' ? agriInputs.productName : jardinInputs.productName} appliquer ?"...`
                          }
                          className={`w-full p-4 pr-12 rounded-2xl border text-xs focus:ring-2 focus:ring-teal-505 focus:outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-teal-500' 
                              : 'bg-white border-slate-201 text-slate-850 placeholder-slate-400 focus:border-teal-600'
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={isAiLoading || (!aiPrompt && !aiImageBase64)}
                          className={`absolute bottom-3.5 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            (!aiPrompt && !aiImageBase64) || isAiLoading
                              ? (isDarkMode ? 'bg-slate-850 text-slate-600' : 'bg-slate-100 text-slate-300')
                              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                          }`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>

                    {/* Loading Screen Indicator */}
                    {isAiLoading && (
                      <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 ${
                        isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        <div>
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-100">Consultation des experts Gemini en cours...</p>
                          <p className="text-[11px] text-slate-450 mt-1 max-w-sm">
                            {isAiHighThinking 
                              ? "🧠 Mode Haute Réflexion Actif. Gemini structure une réponse avec étapes logiques approfondies. Cela peut prendre 5 à 15 secondes."
                              : isAiMapsGrounding
                              ? "📍 Mode Cartographie Actif. Interrogation en direct de l'API Google Maps pour recouper les informations géographiques."
                              : "⚡ Analyse et rédaction des conseils d'utilisation sécurisés..."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error output display */}
                    {aiError && (
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-x-2.5">
                        <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Une erreur est survenue lors de l'appel à l'IA :</span>
                          <p className="mt-1 opacity-90 leading-relaxed font-mono text-[10px]">{aiError}</p>
                        </div>
                      </div>
                    )}

                    {/* Answer results compartment */}
                    {aiResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex-1 p-5 rounded-2xl border border-l-4 text-left ${
                          isDarkMode 
                            ? 'bg-slate-950/45 border-slate-800 border-l-teal-500' 
                            : 'bg-white border-slate-200 border-l-teal-600 shadow-sm'
                        }`}
                      >
                        {/* Meta header labels */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-x-1 uppercase tracking-wider font-extrabold text-teal-600 dark:text-teal-400">
                            <Bot className="w-3.5 h-3.5 animate-pulse" />
                            <span>Conseiller IA : Diagnostic Final</span>
                          </span>
                          <span className="p-1 px-2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                            Modèle : <strong className="text-slate-700 dark:text-slate-300">{aiModelUsed || (aiImageBase64 ? 'gemini-3.1-pro-preview' : isAiMapsGrounding ? 'gemini-3.5-flash' : 'gemini-3.5-flash')}</strong>
                            {isAiHighThinking && <span className="text-amber-500 ml-1 font-bold">🧠 (Deep-Thinking)</span>}
                          </span>
                        </div>

                        {/* Renders formatted text block */}
                        <div className="space-y-1.5 prose prose-invert max-w-none">
                          {renderFormattedText(aiResponse)}
                        </div>

                        {/* Grounding Source references map link outputs */}
                        {aiGroundingChunks && aiGroundingChunks.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 text-left shadow-none">
                            <h4 className="text-[11px] uppercase tracking-widest font-mono font-bold text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-x-1.5 shadow-none">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Résultats & Lieux vérifiés (Google Maps) :</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shadow-none">
                              {aiGroundingChunks.map((chunk: any, i: number) => {
                                const title = chunk.maps?.title || chunk.web?.title || `Lieu vérifié #${i + 1}`;
                                const uri = chunk.maps?.uri || chunk.web?.uri;
                                if (!uri) return null;
                                return (
                                  <a
                                    key={i}
                                    href={uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-start gap-x-2.5 p-3 rounded-xl border transition-all text-xs font-semibold ${
                                      isDarkMode 
                                        ? 'border-slate-800 bg-slate-900/40 hover:bg-slate-850 hover:border-teal-500/30 text-slate-300' 
                                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-teal-500/30 text-slate-700'
                                    }`}
                                  >
                                    <Building2 className="w-4 h-4 shrink-0 text-teal-500 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <span className="block font-bold hover:underline truncate">{title}</span>
                                      <span className="block text-[9px] text-slate-405 dark:text-slate-500 truncate mt-0.5">{uri}</span>
                                      {chunk.maps?.placeAnswerSources?.reviewSnippets && chunk.maps.placeAnswerSources.reviewSnippets.length > 0 && (
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-1 font-normal line-clamp-2 leading-relaxed">
                                          "{chunk.maps.placeAnswerSources.reviewSnippets[0]}"
                                        </p>
                                      )}
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'help' && (
              <motion.div
                key="mode-help"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <HelpTutorials 
                  isDarkMode={isDarkMode} 
                  onSelectTab={setMode}
                  isProMode={isProMode}
                  deferredPrompt={deferredPrompt}
                  onInstallClick={handlePwaInstall}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= DILUTION CALCULATOR WIDGET ================= */}
          {mode === 'dilution' && (
            <div className="text-left">
              <div className="mb-6">
                <h3 className={`text-base font-bold flex items-center gap-x-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Droplets className="w-5 h-5 text-teal-500 animate-pulse" />
                  <span>💧 Calculateur de Dilution Automatique & Universel</span>
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                  Mélangez précisément n'importe quel liquide, purificateur ou herbicide concentré selon vos proportions cibles.
                </p>
              </div>

              {/* Dilution Checklist Helper */}
              {interactiveHelp && (
                <div className="bg-teal-600/10 border border-teal-500/20 p-4 rounded-2xl text-left mb-6 animate-fade-in">
                  <div className="flex items-center gap-x-2 mb-2.5">
                    <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-450 animate-bounce" />
                    <div>
                      <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Assistant de Dilution Universel</h4>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">DILUTION SCIENTIFIQUE CERTIFIÉE</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
                    <div className="flex items-center gap-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${dilutionInputs.targetVolume > 0 ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800'}`}>
                        ✓
                      </div>
                      <span>Volume cible : <strong>{dilutionInputs.targetVolume} Litre(s)</strong> de mélange final préparé</span>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-teal-500 text-white`}>
                        ✓
                      </div>
                      <span>Règle d'or : On verse <strong>TOUJOURS</strong> le produit pur concentré dans le fond du réservoir, puis on complète avec de l'eau claire jusqu'au trait de jauge de {dilutionInputs.targetVolume} L.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-6 rounded-2xl border mb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 ${isDarkMode ? 'bg-slate-950/40 border-slate-800/90 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                {/* Inputs col (6 cols) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Target volume */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Volume de Bouillie Souhaité (Litre)
                      </label>
                      <input 
                        type="number"
                        value={dilutionInputs.targetVolume}
                        onChange={(e) => setDilutionInputs(prev => ({ ...prev, targetVolume: Math.max(0.1, parseFloat(e.target.value) || 0) }))}
                        className={`w-20 text-xs text-right font-mono font-bold rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-teal-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                        }`}
                        min="0.1"
                        step="0.5"
                      />
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={dilutionInputs.targetVolume}
                      onChange={(e) => setDilutionInputs(prev => ({ ...prev, targetVolume: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-teal-600 my-2"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>0.5 L (Petit pulvé)</span>
                      <span>5 L (Dos standard)</span>
                      <span>20 L (Tracteur/Grand)</span>
                    </div>
                  </div>

                  {/* Dilution mode selector */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Méthode de Proportion
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        onClick={() => setDilutionInputs(prev => ({ ...prev, dilutionType: 'percent' }))}
                        className={`py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${
                          dilutionInputs.dilutionType === 'percent'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        Pourcentage (%)
                      </button>
                      <button
                        onClick={() => setDilutionInputs(prev => ({ ...prev, dilutionType: 'ratio' }))}
                        className={`py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${
                          dilutionInputs.dilutionType === 'ratio'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        Ratio (1:X)
                      </button>
                      <button
                        onClick={() => setDilutionInputs(prev => ({ ...prev, dilutionType: 'conc' }))}
                        className={`py-1.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all ${
                          dilutionInputs.dilutionType === 'conc'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        Concentration (g/L)
                      </button>
                    </div>
                  </div>

                  {/* Mode-specific input controls */}
                  <div className="pt-2">
                    {dilutionInputs.dilutionType === 'percent' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Taux de dilution cible</span>
                          <span className="text-xs font-bold text-teal-500 font-mono">{dilutionInputs.percentValue} %</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={dilutionInputs.percentValue}
                          onChange={(e) => setDilutionInputs(prev => ({ ...prev, percentValue: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-teal-600 my-2"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>0.1% (Faible)</span>
                          <span>2% (Conseillé)</span>
                          <span>10% (Très fort)</span>
                        </div>
                      </div>
                    )}

                    {dilutionInputs.dilutionType === 'ratio' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Ratio d'incorporation</span>
                          <span className="text-xs font-bold text-teal-500 font-mono">1 : {dilutionInputs.ratioValue}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="200"
                          step="5"
                          value={dilutionInputs.ratioValue}
                          onChange={(e) => setDilutionInputs(prev => ({ ...prev, ratioValue: parseInt(e.target.value) }))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-teal-600 my-2"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                          <span>1:5 (Hyper-concentré)</span>
                          <span>1:50 (Standard 2%)</span>
                          <span>1:200 (Dilué 0.5%)</span>
                        </div>
                        <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} italic`}>
                          Signifie 1 part de produit pour {dilutionInputs.ratioValue} parts d'eau.
                        </p>
                      </div>
                    )}

                    {dilutionInputs.dilutionType === 'conc' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Concentration Mère (C1)</label>
                          <select
                            value={isDilutionCustomMother ? 'custom' : dilutionInputs.motherConc}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setIsDilutionCustomMother(true);
                              } else {
                                setIsDilutionCustomMother(false);
                                setDilutionInputs(prev => ({ ...prev, motherConc: parseInt(e.target.value) }));
                              }
                            }}
                            className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none ${
                              isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="360">360 g/L (Classique)</option>
                            <option value="450">450 g/L (Fort)</option>
                            <option value="480">480 g/L (Pro)</option>
                            <option value="custom">Perso...</option>
                          </select>
                          {isDilutionCustomMother && (
                            <input
                              type="number"
                              value={dilutionInputs.motherConc}
                              onChange={(e) => setDilutionInputs(prev => ({ ...prev, motherConc: parseInt(e.target.value) || 0 }))}
                              className={`w-full mt-1.5 text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-teal-500' : 'bg-white border-slate-205 border-slate-200 text-slate-800 focus:border-teal-500'
                              }`}
                              placeholder="g/L pur"
                              min="1"
                            />
                          )}
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Concentration Cible (C2)</label>
                          <select
                            value={isDilutionCustomTarget ? 'custom' : dilutionInputs.targetConc}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setIsDilutionCustomTarget(true);
                              } else {
                                setIsDilutionCustomTarget(false);
                                setDilutionInputs(prev => ({ ...prev, targetConc: parseFloat(e.target.value) }));
                              }
                            }}
                            className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none ${
                              isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="7.2">7.2 g/L (Recommandé)</option>
                            <option value="5.4">5.4 g/L</option>
                            <option value="3.6">3.6 g/L (Léger)</option>
                            <option value="10.8">10.8 g/L (Fort)</option>
                            <option value="custom">Perso...</option>
                          </select>
                          {isDilutionCustomTarget && (
                            <input
                              type="number"
                              value={dilutionInputs.targetConc}
                              onChange={(e) => setDilutionInputs(prev => ({ ...prev, targetConc: parseFloat(e.target.value) || 0 }))}
                              className={`w-full mt-1.5 text-xs font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
                                isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-teal-500' : 'bg-white border-slate-205 border-slate-200 text-slate-800 focus:border-teal-500'
                              }`}
                              placeholder="g/L cible"
                              min="0.1"
                              step="0.1"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Assist: Dilution Methods Info */}
                  {interactiveHelp && (
                    <div className="mt-3.5 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 text-xs text-slate-600 dark:text-slate-300 animate-fadeIn">
                      <div className="flex items-start gap-x-2">
                        <Sparkles className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-teal-600 dark:text-teal-400">Comprendre les méthodes de proportion :</p>
                          <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <li><span className="font-semibold text-slate-700 dark:text-slate-300">Pourcentage (%)</span> : Utilisé en jardinage classique (ex : 2% signifie 2 cl de produit pur pour 1 Litre final).</li>
                            <li><span className="font-semibold text-slate-700 dark:text-slate-300">Ratio (1:X)</span> : Principalement employé dans l'industrie, les huiles ou moteurs (ex : 1:50 correspond à 1 volume de produit pour 50 volumes d'eau).</li>
                            <li><span className="font-semibold text-slate-700 dark:text-slate-300">Concentration (g/L)</span> : Approche scientifique agronomique pour adapter le volume selon le dosage de matière active ciblée.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outputs col (6 cols) */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  {/* Proportion Results Screen */}
                  <div className={`p-4 rounded-xl border border-dashed flex flex-col justify-between h-full bg-teal-500/5 ${isDarkMode ? 'border-teal-850/50 text-slate-200' : 'border-teal-200 text-slate-700'}`}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-x-2 border-b border-teal-500/10 pb-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-teal-600 font-bold">Plan d'Alimentation Instantané</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                          <span className={`text-[10px] uppercase font-bold tracking-widest font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} block mb-1`}>Produit Pur</span>
                          <span className="text-xl font-bold font-mono text-teal-550 text-teal-600 block">
                            {dilutionOutputs.productMl >= 1000 ? `${(dilutionOutputs.productMl / 1000).toFixed(2)} L` : `${dilutionOutputs.productMl} ml`}
                          </span>
                        </div>

                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
                          <span className={`text-[10px] uppercase font-bold tracking-widest font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} block mb-1`}>Eau Claire</span>
                          <span className="text-xl font-bold font-mono text-teal-550 text-teal-600 block">
                            {dilutionOutputs.waterL} L
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs leading-relaxed text-left">
                        <div className="flex items-start gap-x-2">
                          <span className="text-teal-600 font-bold font-mono">1.</span>
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-650 text-slate-600'}>Verser d'abord la moitié de l'eau requise (<strong>{(dilutionOutputs.waterL / 2).toFixed(2)} L</strong>).</span>
                        </div>
                        <div className="flex items-start gap-x-2">
                          <span className="text-teal-600 font-bold font-mono">2.</span>
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-650 text-slate-600'}>Ajouter précisément <strong>{dilutionOutputs.productMl >= 1000 ? `${(dilutionOutputs.productMl / 1000).toFixed(3)} Litres` : `${dilutionOutputs.productMl} ml`}</strong> de produit concentré pur.</span>
                        </div>
                        <div className="flex items-start gap-x-2">
                          <span className="text-teal-600 font-bold font-mono">3.</span>
                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-650 text-slate-600'}>Compléter avec l'eau restante pour atteindre précisément un volume préparé total de <strong>{dilutionInputs.targetVolume} L</strong>. Agiter avant l'épandage.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= INTERACTIVE DYNAMIC TRAITEMENT SHEET PREVIEW ================= */}
          {(mode === 'agri' || mode === 'jardin') && (
            <div className={`mt-10 pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} transition-all text-left`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-3 mb-6">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-bold flex items-center gap-x-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span>Fiche de Traitement Réglementaire (Traçabilité)</span>
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                    Saisissez vos références pour éditer un registre d'application conforme phytosanitaire (Loi Labbé & C.E.P.A).
                  </p>
                  
                  {/* Web Share API Dynamic Feedback Toast */}
                  <AnimatePresence>
                    {shareStatus.type && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`p-2 rounded-lg border text-[11px] flex items-center gap-x-2 mt-2 max-w-lg ${
                          shareStatus.type === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                            : shareStatus.type === 'info'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {shareStatus.type === 'success' && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {shareStatus.type === 'info' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
                        {shareStatus.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        <span className="font-semibold">{shareStatus.message}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex flex-row items-center gap-2 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => window.print()}
                    type="button"
                    className="flex items-center gap-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-705 dark:border-slate-700"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Imprimer standard</span>
                    <span className="sm:hidden">Imprimer</span>
                  </button>
                  <button
                    onClick={handleShareFiche}
                    type="button"
                    disabled={isSharing}
                    className="flex items-center gap-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSharing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    <span>Partager / PDF Mobile</span>
                  </button>
                </div>
              </div>

              {/* Form entries for traceability */}
              <div className={`p-5 rounded-2xl border mb-6 ${isDarkMode ? 'bg-slate-950/45 border-slate-800/80 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Applicateur / Exploitant</label>
                    {isProMode && exploitationData.applicators.length > 0 && (
                      <select
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr) {
                            setFicheInputs(prev => ({ ...prev, applicateur: valStr }));
                          }
                        }}
                        className={`w-full text-[11px] font-semibold rounded-xl px-2 py-1 mb-2 border ${
                          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-350' : 'bg-amber-500/10 border-amber-500/20 text-slate-700 shadow-xs'
                        }`}
                        defaultValue=""
                      >
                        <option value="">⚡ Sélection Pro (Rapide)</option>
                        {exploitationData.applicators.map(app => {
                          const valStr = `${app.name} (Certiphyto: ${app.certiphyto || 'N/A'})`;
                          return (
                            <option key={app.id} value={valStr}>{app.name}</option>
                          );
                        })}
                      </select>
                    )}
                    <input 
                      type="text" 
                      value={ficheInputs.applicateur} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, applicateur: e.target.value }))}
                      className={`w-full text-xs font-medium rounded-xl px-3 py-2 border transition-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                      }`}
                      placeholder="Ex: L. Autreau"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nom de la Parcelle / Zone</label>
                    {isProMode && (exploitationData.parcelles.length > 0 || exploitationData.groupements.length > 0) && (
                      <select
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          if (value.startsWith('p-')) {
                            const id = value.replace('p-', '');
                            const p = exploitationData.parcelles.find(item => item.id === id);
                            if (p) {
                              setFicheInputs(prev => ({ ...prev, parcelle: p.name }));
                              handleAgriChange('surface', p.surface);
                              handleJardinChange('surface', Math.round(p.surface * 10000));
                            }
                          } else if (value.startsWith('g-')) {
                            const id = value.replace('g-', '');
                            const g = exploitationData.groupements.find(item => item.id === id);
                            if (g) {
                              setFicheInputs(prev => ({ ...prev, parcelle: g.name }));
                              const matched = exploitationData.parcelles.filter(p1 => g.parcelleIds.includes(p1.id));
                              const sumHa = matched.reduce((s, p1) => s + p1.surface, 0);
                              handleAgriChange('surface', parseFloat(sumHa.toFixed(3)));
                              handleJardinChange('surface', Math.round(sumHa * 10000));
                            }
                          }
                        }}
                        className={`w-full text-[11px] font-semibold rounded-xl px-2 py-1 mb-2 border ${
                          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-350' : 'bg-amber-500/10 border-amber-500/20 text-slate-700 shadow-xs'
                        }`}
                        defaultValue=""
                      >
                        <option value="">⚡ Sélection Pro (Rapide)</option>
                        {exploitationData.parcelles.length > 0 && (
                          <optgroup label="Parcelles">
                            {exploitationData.parcelles.map(p => (
                              <option key={p.id} value={`p-${p.id}`}>{p.name} ({p.surface} ha)</option>
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
                    )}
                    <input 
                      type="text" 
                      value={ficheInputs.parcelle} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, parcelle: e.target.value }))}
                      className={`w-full text-xs font-medium rounded-xl px-3 py-2 border transition-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                      }`}
                      placeholder="Ex: Parcelle Nord - Vignes"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Substance Active / Produit</label>
                    <input 
                      type="text" 
                      value={ficheInputs.produitNom} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, produitNom: e.target.value }))}
                      className={`w-full text-xs font-medium rounded-xl px-3 py-2 border transition-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                      }`}
                      placeholder="Ex: Glyphosate équivalent"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Date de l'Application</label>
                    <input 
                      type="date" 
                      value={ficheInputs.date} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, date: e.target.value }))}
                      className={`w-full text-xs font-medium rounded-xl px-3 py-2 border transition-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Regulatory steps checklists */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800/85' : 'border-slate-200/60'}`}>
                  <label className="flex items-center gap-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={ficheInputs.zntRespect} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, zntRespect: e.target.checked }))}
                      className="w-4 h-4 rounded-sm accent-emerald-600 border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Zone Non-Traitement (ZNT) 5m respectée</span>
                  </label>
                  <label className="flex items-center gap-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={ficheInputs.epiComplet} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, epiComplet: e.target.checked }))}
                      className="w-4 h-4 rounded-sm accent-emerald-600 border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Équipements (EPI) portés à 100%</span>
                  </label>
                  <label className="flex items-center gap-x-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={ficheInputs.tripleRincage} 
                      onChange={(e) => setFicheInputs(prev => ({ ...prev, tripleRincage: e.target.checked }))}
                      className="w-4 h-4 rounded-sm accent-emerald-600 border-slate-300 text-emerald-600 cursor-pointer"
                    />
                    <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Triple rinçage des fûts effectué</span>
                  </label>
                </div>

                {/* Background Monitoring & Scheduled Planning Module */}
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800/85' : 'border-slate-200/60'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                  <div className="flex items-start gap-x-3">
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setFicheInputs(prev => ({ ...prev, isScheduled: !prev.isScheduled }))}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-hidden ${
                          ficheInputs.isScheduled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}
                        title="Activer la surveillance active"
                      >
                        <motion.div
                          layout
                          className="w-4 h-4 rounded-full bg-white shadow-xs"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-200' : 'text-slate-850'}`}>
                        🔔 Planifier & Activer la surveillance météo en arrière-plan
                      </span>
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} block mt-0.5`}>
                        Reçoit une notification push native si le vent dépasse l'interdiction légale de 19 km/h le jour du traitement.
                      </span>
                    </div>
                  </div>

                  {ficheInputs.isScheduled && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={handleSimulateCriticalAlert}
                        className="flex items-center gap-x-1 border border-dashed border-red-500/30 hover:bg-red-500/5 text-red-650 text-red-600 dark:text-red-400 font-semibold text-[10px] py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Simuler alerte vent (&gt;19 km/h)</span>
                      </button>
                      
                      <div className={`text-[10px] px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-x-1.5 ${
                        notificationPermission === 'granted' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${notificationPermission === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span>{notificationPermission === 'granted' ? 'Surveillance Active' : 'Permissions requises'}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* LIVE DRAFT PAPER PREVIEW DISPLAY */}
              <div className={`p-6 rounded-2xl border border-dashed font-sans transition-all text-xs ${
                isDarkMode 
                  ? 'bg-slate-950/20 border-slate-800 text-slate-300' 
                  : 'bg-yellow-50/15 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between border-b border-dotted border-slate-400/40 pb-3 mb-3">
                  <div className="flex items-center gap-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Aperçu dynamique du registre d'application</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-sm">Brouillon</span>
                </div>
                
                <div className="space-y-2 font-mono text-left">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-slate-100/10 pb-2 mb-2">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Réf Parcelle :</span>
                      <strong className="text-emerald-500">{ficheInputs.parcelle || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Applicateur :</span>
                      <strong className="text-emerald-500">{ficheInputs.applicateur || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Produit chimique :</span>
                      <strong className="text-emerald-500">{ficheInputs.produitNom || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Date de traitement :</span>
                      <strong className="text-emerald-500">{ficheInputs.date}</strong>
                    </div>
                  </div>

                  {mode === 'agri' ? (
                    <div className="space-y-1 text-[11px]">
                      <div>• Surface du lot : <strong>{agriInputs.surface} Hectares</strong></div>
                      <div>• Eau globale requise : <strong>{agriOutputs.totalWater} L</strong> | {agriInputs.productName} pur : <strong>{agriOutputs.totalProduct} L</strong></div>
                      <div>• Concentration : <strong>{agriInputs.productConcentration} {agriInputs.unit}</strong> | Capacité Cuve : <strong>{agriInputs.tankCapacity} L</strong></div>
                      <div>• Remplissage : <strong>{agriOutputs.numTanks} cuve(s)</strong> ({agriOutputs.fullTanksCount} pleine(s) de {agriOutputs.productPerFullTank} L de produit / cuve)</div>
                      {agriOutputs.hasPartialTank && (
                        <div>• Reste partiel de cuve : <strong>Eau {agriOutputs.partialTankWater} L + {agriInputs.productName} {agriOutputs.partialTankProduct} L</strong></div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 text-[11px]">
                      <div>• Surface du lot : <strong>{jardinInputs.surface} m²</strong></div>
                      <div>• Eau globale requise : <strong>{jardinOutputs.totalWater} L</strong> | {jardinInputs.productName} pur : <strong>{jardinOutputs.totalProduct} {jardinInputs.isDry ? 'g' : 'ml'}</strong></div>
                      <div>• Concentration : <strong>{jardinInputs.productConcentration} {jardinInputs.unit}</strong> | Pulvérisateur : <strong>{jardinInputs.tankCapacity} L</strong></div>
                      <div>• Cycles de remplissage manuel : <strong>{jardinOutputs.numTanks} fois</strong> ({jardinOutputs.productPerFullTank} {jardinInputs.isDry ? 'g' : 'ml'} de produit / cuve)</div>
                    </div>
                  )}

                  <div className={`mt-3 pt-2 border-t border-slate-100/10 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-505 text-slate-500'}`}>
                    <div>🌤️ Météo simulée : Temp: {weatherInput.temp}°C, Vent: {weatherInput.wind} km/h, Humidité: {weatherInput.humidity}%</div>
                    <div className="md:text-right">✅ Traçabilité : ZNT: {ficheInputs.zntRespect ? 'OUI':'NON'}, EPI: {ficheInputs.epiComplet ? 'OUI':'NON'}, Triple rincé: {ficheInputs.tripleRincage ? 'OUI':'NON'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick legal disclaimer note footer */}
          <footer className={`mt-8 pt-4 border-t ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'} flex flex-col sm:flex-row items-center justify-between gap-y-2 text-[10px]`}>
            <span>Calculs basés sur les coefficients réglementaires Européens & Français de dosage phytosanitaire.</span>
            <span className="font-mono">Calculateur d'application de Glyphosate • v2.8</span>
          </footer>

        </main>
      </div> {/* Fermer Main Container */}
    </div> {/* Fermer print:hidden wrapper */}

    {/* ================= 2. REGISTER PHYTOSANITAIRE PRINT LAYOUT (Visible only during print) ================= */}
    <div className="hidden print:block w-full max-w-4xl p-10 bg-white text-black font-sans leading-relaxed text-left text-xs">
      
      {/* Registry Seal Frame */}
      <div className="border-4 border-double border-black p-6 mb-8 text-left">
        <div className="flex justify-between items-start border-b border-black pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight font-serif text-black">REGISTRE DES APPLICATIONS PHYTOSANITAIRES</h1>
            <p className="text-[10px] font-mono tracking-wider text-neutral-600 mt-0.5 uppercase">Conforme aux directives du Plan ÉCOPHYTO II & Code Rural Français</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold bg-neutral-900 text-white px-2.5 py-1 uppercase tracking-widest leading-none">Document Réglementaire</span>
            <span className="text-[9px] text-neutral-500 font-mono mt-1">Édition Numérique Sécurisée - v2.8</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs font-mono">
          <div>
            <span className="font-bold text-neutral-500 block text-[9px] uppercase tracking-wider">Nom de l'applicateur certifié :</span>
            <span className="text-xs font-bold text-black border-b border-dashed border-neutral-400 pb-1 w-full block">{ficheInputs.applicateur || 'Non spécifié'}</span>
          </div>
          <div>
            <span className="font-bold text-neutral-500 block text-[9px] uppercase tracking-wider">Date d'application phytosanitaire :</span>
            <span className="text-xs font-bold text-neutral-900 border-b border-dashed border-neutral-400 pb-1 w-full block">{ficheInputs.date}</span>
          </div>
          <div>
            <span className="font-bold text-neutral-550 text-neutral-500 block text-[9px] uppercase tracking-wider">Référence de la parcelle / Lieu d'épandage :</span>
            <span className="text-xs font-bold text-neutral-950 border-b border-dashed border-neutral-400 pb-1 w-full block">{ficheInputs.parcelle || 'Non spécifiée'}</span>
          </div>
          <div>
            <span className="font-bold text-neutral-500 block text-[9px] uppercase tracking-wider">Nom commercial de l'Herbicide / Substance :</span>
            <span className="text-xs font-bold text-neutral-950 border-b border-dashed border-neutral-400 pb-1 w-full block">{ficheInputs.produitNom || 'Glyphosate équivalent'}</span>
          </div>
        </div>
      </div>

      {/* Calculation Table */}
      <div className="border border-black mb-6 text-left">
        <div className="bg-neutral-100 border-b border-black py-2 px-3 font-bold text-xs uppercase tracking-widest text-center">
          Dosages et Mesures de Cuve Calculés par Système Expert
        </div>
        
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-black text-[10px] uppercase font-bold text-neutral-700">
              <th className="py-2 px-4 border-r border-black text-left">Paramètre d'application</th>
              <th className="py-2 px-4 text-right">Valeur ou Consigne Réglementaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            <tr>
              <td className="py-2 px-4 border-r border-black font-bold">Méthode de pulvérisation sélectionnée</td>
              <td className="py-2 px-4 text-right uppercase font-bold text-neutral-900">{mode === 'agri' ? 'Tracteur agricole (Rampe large)' : 'Pulvérisateur mobile à dos / manuel'}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-r border-black font-bold">Surface totale de la parcelle traitée</td>
              <td className="py-2 px-4 text-right font-bold">{mode === 'agri' ? `${agriInputs.surface} Hectares` : `${jardinInputs.surface} m²`}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-r border-black">Concentration de formulation (Matière Active)</td>
              <td className="py-2 px-4 text-right">{mode === 'agri' ? `${agriInputs.productConcentration} ${agriInputs.unit} de ${agriInputs.activeIngredient}` : `${jardinInputs.productConcentration} ${jardinInputs.unit} de ${jardinInputs.activeIngredient}`}</td>
            </tr>
            <tr className="bg-neutral-100">
              <td className="py-2 px-4 border-r border-black font-bold">Volume total d'Eau Claire à charger</td>
              <td className="py-2 px-4 text-right font-bold text-neutral-900">{mode === 'agri' ? `${agriOutputs.totalWater} Litres` : `${jardinOutputs.totalWater} Litres`}</td>
            </tr>
            <tr className="bg-neutral-100">
              <td className="py-2 px-4 border-r border-black font-bold">Volume total de Produit Pur à verser</td>
              <td className="py-2 px-4 text-right font-bold text-neutral-950">{mode === 'agri' ? `${agriOutputs.totalProduct} Litres` : `${jardinOutputs.totalProduct} ${jardinInputs.isDry ? 'g' : 'ml'}`}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 border-r border-black font-bold">Volume de bouillies total prêt à l'emploi</td>
              <td className="py-2 px-4 text-right font-bold">{mode === 'agri' ? `${agriOutputs.totalBouillie} L` : `${jardinOutputs.totalBouillie} L`}</td>
            </tr>
            <tr className="bg-neutral-200">
              <td className="py-2 px-4 border-r border-black font-bold">Plan d'alimentation et cycles de remplissage</td>
              <td className="py-2 px-4 text-right font-bold text-neutral-900">
                {mode === 'agri' ? (
                  <span>
                    {agriOutputs.numTanks} cuve(s) ({agriOutputs.fullTanksCount} cuve(s) pleine(s) de {agriInputs.tankCapacity} L)
                  </span>
                ) : (
                  <span>
                    {jardinOutputs.numTanks} cycle(s) de pulvérisateur à dos de {jardinInputs.tankCapacity} L
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tank step structure explanation if any */}
      <div className="border border-black mb-6 text-left p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-1 mb-2">Instructions de Cuve Chronologiques</h3>
        <ol className="text-xs font-mono space-y-1.5 list-decimal pl-4">
          <li>Verser exactement 50% du volume d'eau requis par cuve dans le réservoir.</li>
          <li>Activer l'agitateur mécanique ou le mélangeur hydraulique.</li>
          {mode === 'agri' ? (
            <>
              <li>Incorporer lentement <strong>{agriOutputs.productPerFullTank} Litres</strong> de {agriInputs.productName} pur par cuve pleine (ou {agriOutputs.partialTankProduct} Litres pour la cuve partielle).</li>
              <li>Rincer le bidon vide à trois reprises et reverser l'eau claire de rinçage directement dans la cuve.</li>
              <li>Compléter avec les 50% restants d'eau pour atteindre la capacité requise ({agriInputs.tankCapacity} Litres).</li>
            </>
          ) : (
            <>
              <li>Incorporer précisément <strong>{jardinOutputs.productPerFullTank} {jardinInputs.isDry ? 'g' : 'ml'}</strong> de {jardinInputs.productName} pur pour un réservoir complet de {jardinInputs.tankCapacity} Litres.</li>
              <li>Fermer hermétiquement le bouchon et agiter manuellement et lentement pendant au moins 30 secondes.</li>
              <li>Compléter avec l'eau claire jusqu'au repère de graduation ({jardinInputs.tankCapacity} Litres).</li>
            </>
          )}
          <li>Poursuivre la pulvérisation directement après préparation. Ne jamais stocker la bouillie préparée.</li>
        </ol>
      </div>

      {/* Environmental conditions */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-left">
        <div className="border border-black p-4 font-mono text-xs">
          <h4 className="font-bold uppercase border-b border-black pb-1 mb-2 text-[10px]">Conditions Météo de Traçabilité</h4>
          <ul className="space-y-1">
            <li>• Température extérieure : <strong>{weatherInput.temp} °C</strong></li>
            <li>• Force du Vent : <strong>{weatherInput.wind} km/h</strong> (Limite réglementaire : 19)</li>
            <li>• Humidité relative : <strong>{weatherInput.humidity} % HR</strong></li>
            <li className="mt-2 text-[10px] font-bold border-t border-black pt-1 uppercase text-left">
              Évaluation : {weatherAdvisory.verdict}
            </li>
          </ul>
        </div>

        <div className="border border-black p-4 font-mono text-xs">
          <h4 className="font-bold uppercase border-b border-black pb-1 mb-2 text-[10px]">Respect de l'Environnement & Sécurité</h4>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-x-2">
              <span>[ {ficheInputs.zntRespect ? 'X' : ' '} ]</span>
              <span className="text-[11px]">Zone Non-Traitement (ZNT) de 5 mètres respectée de tout point d'eau</span>
            </li>
            <li className="flex items-center gap-x-2">
              <span>[ {ficheInputs.epiComplet ? 'X' : ' '} ]</span>
              <span className="text-[11px]">Port d'Équipements de Protection Individuelle complets (Type EPI)</span>
            </li>
            <li className="flex items-center gap-x-2">
              <span>[ {ficheInputs.tripleRincage ? 'X' : ' '} ]</span>
              <span className="text-[11px]">Triple rinçage obligatoire de l'emballage vide effectué</span>
            </li>
            <li className="flex items-center gap-x-2">
              <span>[ X ]</span>
              <span className="text-[11px]">Consignation réglementaire ADIVALOR du bidon usagé</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Signatures & Stamps */}
      <div className="grid grid-cols-2 gap-6 mt-12 border-t border-black pt-6 text-xs text-left font-mono">
        <div>
          <p className="font-bold text-neutral-500 uppercase text-[9px] mb-1">Visa de l'applicateur / Certificat certiphyto :</p>
          <p className="font-bold text-black border-b border-neutral-300 pb-1 mb-4 italic">Signé électroniquement via CAD-Phyto</p>
          <p className="text-[9px] text-neutral-550 text-neutral-500">Généré le {new Date().toLocaleString('fr-FR')} de manière sécurisée</p>
        </div>
        <div className="border border-neutral-400 p-4 min-h-24 flex flex-col justify-between">
          <p className="font-bold text-neutral-500 uppercase text-[9px] tracking-wide mb-1">Signature manuscrite requise :</p>
          <div className="border-b border-neutral-400 border-dotted mt-12 w-full"></div>
        </div>
      </div>
    </div>
  </div>
  );
}

const renderFormattedText = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={idx} className="h-2" />;
    
    if (cleanLine.startsWith('### ')) {
      return <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">{cleanLine.replace('### ', '')}</h4>;
    }
    if (cleanLine.startsWith('## ')) {
      return <h3 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3">{cleanLine.replace('## ', '')}</h3>;
    }
    if (cleanLine.startsWith('# ')) {
      return <h2 key={idx} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3">{cleanLine.replace('# ', '')}</h2>;
    }
    
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      const content = cleanLine.substring(2);
      return (
        <ul key={idx} className="list-disc list-inside ml-4 my-1.5 text-slate-650 dark:text-slate-350 text-xs leading-relaxed space-y-1">
          <li>{renderInlineStyles(content)}</li>
        </ul>
      );
    }
    
    const numMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <ol key={idx} className="list-decimal list-inside ml-4 my-1.5 text-slate-650 dark:text-slate-350 text-xs leading-relaxed space-y-1">
          <li>{renderInlineStyles(numMatch[2])}</li>
        </ol>
      );
    }
    
    return (
      <p key={idx} className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed mb-2.5">
        {renderInlineStyles(cleanLine)}
      </p>
    );
  });
};

const renderInlineStyles = (partStr: string) => {
  const parts = partStr.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((subPart, j) => {
      if (subPart.startsWith('`') && subPart.endsWith('`')) {
        return <code key={j} className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[11px] text-teal-650 dark:text-teal-400">{subPart.slice(1, -1)}</code>;
      }
      return subPart;
    });
  });
};

import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  PlayCircle, 
  Award, 
  ShieldAlert, 
  Droplets, 
  Layers, 
  Search, 
  Flame, 
  CheckCircle, 
  ArrowRight,
  BookMarked,
  FileText,
  LifeBuoy,
  Tv,
  Info
} from 'lucide-react';

interface HelpTutorialsProps {
  isDarkMode: boolean;
  onSelectTab: (tab: any) => void;
  isProMode: boolean;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export default function HelpTutorials({ 
  isDarkMode, 
  onSelectTab, 
  isProMode,
  deferredPrompt,
  onInstallClick
}: HelpTutorialsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'basics' | 'phytosanitaire' | 'hve_ift' | 'safety'>('all');
  const [selectedTutorialId, setSelectedTutorialId] = useState<string | null>(null);

  // Expanded Tutorial Database
  const tutorials = [
    {
      id: 'fundamentals-glyphosate',
      category: 'basics',
      title: 'Comprendre le dosage du Glyphosate (g/L et L/ha)',
      duration: '4 min de lecture',
      shortDesc: 'La différence cruciale entre la dose commerciale (L/ha) et la concentration en matière active.',
      icon: BookOpen,
      color: 'text-emerald-505 text-emerald-500 bg-emerald-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Pour réussir sa pulvérisation et respecter la réglementation, il est impératif de comprendre la différence entre la concentration du produit pur commercial et la dose appliquée à l'hectare.
          </p>
          
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">1. La Concentration en Matière Active (g/L)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Le glyphosate est commercialisé sous différentes formulations. L'étiquette indique le nombre de grammes de glyphosate (acide libre ou sel) par litre d'eau :
            </p>
            <ul className="list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><strong>360 g/L :</strong> Formulation classique (ex : anciens standards de Roundup).</li>
              <li><strong>450 g/L et 480 g/L :</strong> Nouvelles formulations concentrées, nécessitant de baisser le volume de produit à verser.</li>
              <li><strong>500 g/L :</strong> Ultra-concentré souvent réservé aux professionnels.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">2. La dose homologuée (L/ha)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              C'est le volume maximal de produit pur autorisé par hectare de culture. Elle dépend de la cible réglementaire :
            </p>
            <ul className="list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><strong>Viticulture :</strong> Max 1.0 L/ha (à base de 360 g/L) ou équivalent (450 g de matière active) par an sur l'inter-rang.</li>
              <li><strong>Grandes cultures :</strong> Max 3.0 L/ha (à base de 360 g/L) ou équivalent (1080 g de matière active) par an.</li>
              <li><strong>Arboriculture :</strong> Max 1.5 L/ha (à base de 360 g/L) ou équivalent (540 g de matière active) par an sous le rang.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
            <strong>Règle d'or de l'application :</strong> Toujours ajuster le volume de produit commercial en fonction de la concentration de l'emballage pour ne pas dépasser la quantité réglementaire par hectare : <br />
            <code className="block mt-2 p-2 bg-slate-900 text-slate-200 rounded-lg text-center font-mono">Dose réelle (L/ha) = (Dose Réf d'étiquette × 360) / Votre concentration (g/L)</code>
          </div>
        </div>
      )
    },
    {
      id: 'hve-ift-explanation',
      category: 'hve_ift',
      title: 'Guide complet HVE : Maîtriser l\'Indicateur IFT',
      duration: '6 min de lecture',
      shortDesc: 'Découvrez comment fonctionne le barème officiel HVE-3 pour valider vos points de certification environnementale.',
      icon: Award,
      color: 'text-amber-505 text-amber-500 bg-amber-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            La certification <strong>Haute Valeur Environnementale (HVE niveau 3)</strong> utilise l'Indicateur de Fréquence de Traitement (IFT) pour quantifier la pression phytosanitaire exercée sur l'exploitation.
          </p>

          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} space-y-3`}>
            <h4 className="font-bold text-xs text-emerald-500">Formule réglementaire de l'IFT Herbicide</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pour chaque parcelle et chaque traitement, l'IFT est calculé d'après la dose appliquée rapportée à la dose de référence :
            </p>
            <div className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-teal-405 text-teal-400 text-center">
              IFT Individuel = (Dose Appliquee × Concentration) / Dose Active de Reference
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              La moyenne de l'exploitation est ensuite <strong>établie par pondération de la surface</strong> de chaque parcelle traitée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-450 uppercase block">🍇 Viticulture</span>
              <strong className="text-xs text-slate-800 dark:text-slate-200">Seuil Cible ≤ 0.6</strong>
              <p className="text-[10px] text-slate-500">Au-delà de 1.0, l'obtention des points d'excellence HVE est compromise.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-450 uppercase block">🌾 Grandes Cultures</span>
              <strong className="text-xs text-slate-800 dark:text-slate-200">Seuil Cible ≤ 1.0</strong>
              <p className="text-[10px] text-slate-500">Un IFT de référence bas garantit l'alignement avec les aides PAC.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-450 uppercase block">🍎 Arboriculture</span>
              <strong className="text-xs text-slate-800 dark:text-slate-205">Seuil Cible ≤ 0.8</strong>
              <p className="text-[10px] text-slate-500">Le désherbage ciblé sous-rang réduit durablement l'indice global.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
            <strong>Activez le Mode Pro :</strong> Notre module de l'onglet "Mon Exploitation" intègre une interface interactive d'autosurveillance qui regroupe vos parcelles, calcule les moyennes pondérées et valide vos points HVE à chaque nouvelle fiche de traitement éditée.
          </div>
        </div>
      )
    },
    {
      id: 'znt-drift-control',
      category: 'phytosanitaire',
      title: 'Comprendre et maîtriser la dérive de pulvérisation (ZNT)',
      duration: '5 min de lecture',
      shortDesc: 'Comment configurer vos buses d\'injection d\'air et respecter les bandes de non-traitement obligatoires de 5m à 20m.',
      icon: Droplets,
      color: 'text-sky-505 text-sky-500 bg-sky-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            La dérive désigne la fraction de produit emportée par le vent en dehors de la parcelle ciblée. Elle engendre un gaspillage économique et pose des risques environnementaux majeurs pour les cours d'eau (zones ZNT) et les habitations riveraines.
          </p>

          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-sky-500 uppercase">Facteurs majeurs influençant la dérive :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100/10">
                <strong className="block text-slate-750 dark:text-slate-200 mb-0.5">💨 La vitesse du vent :</strong>
                L'application phytosanitaire est strictement interdite par la loi si la vitesse du vent dépasse <strong>19 km/h (Force 3 de Beaufort)</strong>.
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100/10">
                <strong className="block text-slate-755 dark:text-slate-200 mb-0.5">🫧 La taille des gouttelettes :</strong>
                Les buses classiques fentes produisent des gouttes fines (sensibles au vent). L'usage de <strong>buses d'injection d'air</strong> (grosses gouttes chargées de bulles d'air) réduit la dérive de 66% à 90%.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">La Zone Non-Traitement (ZNT) :</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Par défaut, une bande de sécurité de <strong>5 mètres minimum</strong> doit être conservée en bordure de tout point d'eau cadastré pour le glyphosate. Cette distance doit être portée à 20 mètres si aucune mesure de réduction homologuée (type haie ou buse anti-dérive) n'est mise en œuvre.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sky-550/5 text-xs text-sky-600 dark:text-sky-400 border border-sky-500/10">
            💡 <strong>Raccourci :</strong> Vous pouvez tester différents types de buses et d'intensités de vent dans notre onglet dédié <strong>"Calculateur de Dérive & ZNT"</strong> pour adapter vos pressions de rampe (en bars) et connaître votre réduction effective de dérive.
          </div>
        </div>
      )
    },
    {
      id: 'equipment-protective-rules',
      category: 'safety',
      title: 'Équipements de protection individuelle (EPI) : Guide d\'habillage',
      duration: '4 min de lecture',
      shortDesc: 'Protégez votre santé en appliquant l\'ordre d\'enfilement des EPI lors de la préparation de la cuve et de la pulvérisation.',
      icon: ShieldAlert,
      color: 'text-red-505 text-red-500 bg-red-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Le moment le plus critique pour l'opérateur est la phase de préparation et d'incorporation du produit pur. C'est là que la concentration en glyphosate est maximale et présente le plus grand risque de contact cutané ou d'inhalation.
          </p>

          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-3">
            <h4 className="font-bold text-xs text-rose-500 flex items-center gap-1">
              🧼 L'ordre rigoureux d'habillage (Enfiler les EPI) :
            </h4>
            <ol className="list-decimal pl-5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <li>
                <strong>Combinaison :</strong> Enfiler la combinaison de protection de catégorie III (type 4 ou s'il fait chaud, type 5/6 imperméable).
              </li>
              <li>
                <strong>Bottes :</strong> Porter des bottes en caoutchouc nitrile résistant aux produits chimiques. La combinaison doit recouvrir l'extérieur des bottes (ne jamais rentrer le pantalon dans la botte !).
              </li>
              <li>
                <strong>Masque respiratoire :</strong> Ajuster le demi-masque anti-vapeurs à cartouches A2P3 protégeant des aérosols et solvants organiques.
              </li>
              <li>
                <strong>Lunettes de protection :</strong> Placer les lunettes-masques étanches (norme EN 166-3) par-dessus les lanières du masque.
              </li>
              <li>
                <strong>Gants nitrile :</strong> En dernier, enfiler des gants à manchette longue (norme EN 374). Rentrer ou sortir le gant de la manche en fonction du travail : manche de combinaison par-dessus le gant si les mains travaillent vers le bas.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800 space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Précautions après l'application :</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pour retirer les EPI, procédez à l'inverse en rinçant d'abord vos gants à l'eau claire avant de les ôter afin de ne pas contaminer vos mains nues avec les résidus présents sur les manches.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tank-cleaning-rules',
      category: 'phytosanitaire',
      title: 'Nettoyage et rinçage de cuve (Protection des cultures)',
      duration: '3 min de lecture',
      shortDesc: 'Évitez les phytotoxicités croisées en appliquant la méthode universelle du triple rinçage après traitement.',
      icon: Droplets,
      color: 'text-teal-505 text-teal-500 bg-teal-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Le glyphosate est un herbicide total non sélectif. Si vous utilisez le même réservoir ou pulvérisateur pour appliquer par la suite un fongicide ou un engrais foliaire sur d'autres cultures, la présence de traces de glyphosate détruira instantanément la culture cible.
          </p>

          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-xs text-emerald-500 uppercase">La Méthode Légale du Triple Rinçage :</h4>
            <ul className="list-disc pl-4 text-xs text-slate-550 dark:text-slate-450 space-y-2.5">
              <li>
                <strong>1. Vidange complète :</strong> Vider complètement le fond de cuve et l'appliquer sur une zone de friches autorisée ou récupérer les effluents.
              </li>
              <li>
                <strong>2. Premier rinçage (Gros nettoyage) :</strong> Remplir au moins 10% de la cuve avec de l'eau claire, activer l'agitateur de rampe et faire circuler l'eau dans tous les tuyaux et buses de pulvérisation. Vider le mélange.
              </li>
              <li>
                <strong>3. Deuxième rinçage (Neutralisation) :</strong> Répéter le rinçage en ajoutant un détergent détoxifiant adapté aux herbicides (nettoyant cuve homologué). circuler et vider.
              </li>
              <li>
                <strong>4. Troisième rinçage (Finitions) :</strong> Remplir une dernière fois à l'eau claire pour rincer les résidus de détergent.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200/40 dark:border-slate-800 leading-relaxed text-xs">
            ⚠️ <strong>Gestion des Bidons Vides (EVPP) :</strong> Rincer trois fois chaque bidon de glyphosate vide à l'eau claire en versant l'eau de rinçage dans la cuve de préparation. Égoutter, puis stocker le bidon bouchon ouvert en vue de la collecte nationale ADIVALOR.
          </div>
        </div>
      )
    },
    {
      id: 'quick-start-app',
      category: 'basics',
      title: 'Tutoriel rapide : Prendre en main le Calculateur',
      duration: '3 min de lecture',
      shortDesc: 'Découvrez l\'ergonomie générale de l\'application et configurez votre premier dosage de cuve.',
      icon: BookMarked,
      color: 'text-violet-505 text-violet-500 bg-violet-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Bienvenue dans le <strong>Calculateur d'application de Glyphosate</strong>. Cette application regroupe tous les outils nécessaires aux viticulteurs, céréaliers et jardiniers pour doser, tracer et sécuriser leurs interventions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} space-y-2`}>
              <h4 className="font-extrabold text-xs text-sky-505 text-slate-800 dark:text-white flex items-center gap-1">
                <span>🚜 Étape 1 : Renseigner les parcelles</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Allez sur l'onglet <strong>"Mon Exploitation"</strong>. Saisissez vos parcelles avec leurs surfaces réelles (en hectares) et associez vos applicateurs certifiés Certiphyto.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'} space-y-2`}>
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1">
                <span>⚡ Étape 2 : Calculer le mélange cuve</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Basculez sur l'onglet <strong>"Agricole"</strong> ou <strong>"Jardinier"</strong>, entrez votre surface de travail, votre pulvérisateur ainsi que la dose cible. L'application calcule automatiquement le nombre de cuves pleines et la quantité exacte de produit pur à verser.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-505/5 border border-violet-500/10 text-xs text-violet-600 dark:text-violet-400">
            <strong>Générez vos registres légaux :</strong> Une fois le calcul validé, cliquez sur "Générer la fiche PDF de traitement". Cela produit un rapport d'application conforme au registre phytosanitaire obligatoire en France, archivé de manière sécurisée dans votre historique local.
          </div>
        </div>
      )
    },
    {
      id: "pwa-installation",
      category: "basics",
      title: "Installation Mobile (PWA) & Fonctionnement Hors-ligne",
      duration: "2 min de lecture",
      shortDesc: "Installez l'application sur l'écran d'accueil pour un usage autonome, 100% fonctionnel sur le terrain sans réseau internet.",
      icon: LifeBuoy,
      color: "text-emerald-500 bg-emerald-500/10",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Cette application est construite avec la technologie <strong>PWA (Progressive Web App)</strong>. Cela signifie qu'elle peut s'installer directement sur l'écran d'accueil de votre smartphone, tablette ou ordinateur comme une application native, <strong>sans avoir besoin de passer par Google Play ou l'App Store</strong>.
          </p>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
            <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              💡 Les avantages d'une installation PWA :
            </h4>
            <ul className="list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><strong>Fonctionnement Hors-ligne complet :</strong> Calculez vos dosages de cuves, accédez à vos parcelles et consultez les guides sur le terrain même sans aucun réseau (3G/4G/5G/Wi-Fi).</li>
              <li><strong>Affichage plein écran :</strong> Supprime l'encadrement classique du navigateur web pour maximiser l'espace utile et l'ergonomie.</li>
              <li><strong>Zéro encombrement :</strong> Utilise moins de 1 Mo d'espace de stockage et se met à jour automatiquement en arrière-plan lors de l'accès à internet.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'} space-y-2`}>
              <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>🤖 Android (Google Chrome)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                1. Ouvrez l'application sous <strong>Chrome</strong>.<br />
                2. Un bouton interactif d'installation d'option peut s'afficher sur l'écran.<br />
                3. Si non, tapez sur l'icône de menu <strong>(3 points verticaux)</strong> en haut à droite du navigateur et sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'} space-y-2`}>
              <h4 className="font-extrabold text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <span>🍏 iPhone & iPad (Safari)</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                1. Ouvrez l'application obligatoirement avec <strong>Safari</strong>.<br />
                2. Appuyez sur l'icône de <strong>Partage</strong> 📤 (le carré avec une flèche pointant vers le haut au milieu/bas de votre barre de navigation).<br />
                3. Faites défiler la liste, et appuyez sur l'option <strong>"Sur l'écran d'accueil"</strong> (ou <strong>"Add to Home Screen"</strong>).
              </p>
            </div>
          </div>

          {deferredPrompt && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                Votre navigateur signale que l'installation directe en un clic est prête sur votre appareil actuel !
              </p>
              <button
                type="button"
                onClick={onInstallClick}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                📥 Installer l'application maintenant
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  // Helper filter logic
  const filteredTutorials = tutorials.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const selectedTutorial = tutorials.find(t => t.id === selectedTutorialId);

  return (
    <div id="help-tutorials-component" className="space-y-6 text-left">
      
      {/* Header design layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold font-display flex items-center gap-x-2.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <LifeBuoy className="w-5.5 h-5.5 text-emerald-500 animate-pulse" />
            <span>Centre d'Aide & Tutoriels Pratiques</span>
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            Des guides pédagogiques, réglementations officielles HVE/IFT et explications agronomiques de précision pour maîtriser vos applications.
          </p>
        </div>

        {/* Quick Pro Mode status indication badge */}
        <div className={`p-2 px-3 rounded-xl border text-xs flex items-center gap-x-2 ${
          isDarkMode ? 'bg-slate-950/45 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-650'
        }`}>
          <Tv className="w-4 h-4 text-emerald-500" />
          <span>{isProMode ? 'Accès illimité aux conseils Pro' : 'Version Standard Active'}</span>
        </div>
      </div>

      {/* Main Grid Workdesk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: Categories & Tutorial Lists */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search bar & Category filter */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-955 bg-slate-950/30 border-slate-800' : 'bg-white border-slate-210 border-slate-200/90 shadow-xs'} space-y-4`}>
            {/* Search inputs */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un guide ou mot clé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-hidden w-full ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* Quick Category switcher */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'all', label: 'Tout voir' },
                { id: 'basics', label: 'B.A.-BA' },
                { id: 'phytosanitaire', label: 'Traitements' },
                { id: 'hve_ift', label: 'Normes HVE' },
                { id: 'safety', label: 'EPI & Securité' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setSelectedTutorialId(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-emerald-600 border-emerald-600 text-white font-black'
                      : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Tutorial Cards */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTutorials.length === 0 ? (
              <div className="p-8 border border-dashed rounded-xl text-center text-xs text-slate-400">
                Aucun guide ne répond à vos filtres de recherche.
              </div>
            ) : (
              filteredTutorials.map((tut) => {
                const IconComp = tut.icon;
                const isSelected = selectedTutorialId === tut.id;

                return (
                  <button
                    key={tut.id}
                    onClick={() => setSelectedTutorialId(tut.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-emerald-600/10 border-emerald-600' 
                        : (isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200 hover:bg-slate-50')
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${tut.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                          tut.category === 'hve_ift' ? 'bg-amber-500/10 text-amber-500' :
                          tut.category === 'safety' ? 'bg-red-500/10 text-red-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {tut.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-405 text-slate-400">{tut.duration}</span>
                      </div>
                      <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-emerald-500' : 'text-slate-850 dark:text-slate-200'}`}>
                        {tut.title}
                      </h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-400 line-clamp-2">
                        {tut.shortDesc}
                      </p>
                    </div>

                    {/* Active pointer arrow indicator */}
                    {isSelected && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick FAQ / Help Hotline widget */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800/80 shadow-xs' : 'bg-slate-50 border-slate-100'} space-y-2`}>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>Besoin d'une réponse réglementaire ?</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-405 leading-relaxed">
              Consultez notre <strong>Conseils & Diagnostic IA</strong> doté du moteur d'intelligence Gemini pour analyser vos parcelles, vos adventices, vos dosages ou les ZNT locales.
            </p>
          </div>

        </div>

        {/* RIGHT COMPONENT: Active Tutorial View */}
        <div className="lg:col-span-7">
          {selectedTutorial ? (
            <div className={`p-6 rounded-2xl border flex flex-col justify-between h-full bg-slate-950/40 border-slate-850 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
            }`}>
              {/* Tutorial Title block */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
                  <div className={`p-3 rounded-xl ${selectedTutorial.color}`}>
                    {React.createElement(selectedTutorial.icon, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      TUTORIEL EXPÉDIÉ DE PRÉCISION • {selectedTutorial.duration}
                    </span>
                    <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedTutorial.title}
                    </h3>
                  </div>
                </div>

                {/* Styled parsed content container */}
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {selectedTutorial.content}
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400 font-medium">Fin de ce guide agronomique</span>
                <button
                  type="button"
                  onClick={() => setSelectedTutorialId(null)}
                  className={`px-4 py-2 border rounded-xl font-bold cursor-pointer transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Fermer
                </button>
              </div>

            </div>
          ) : (
            <div className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center h-full min-h-[360px] ${
              isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-slate-50/50 border-slate-200'
            }`}>
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 animate-bounce">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-250">
                Sélectionnez un guide de tutoriel à gauche
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Apprenez à calculer les doses, gérer les fiches d'exploitation, configurer sous sécurité ou optimiser vos indicateurs IFT pour les exigences HVE.
              </p>

              {/* Interactive quick tips links */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                <button
                  type="button"
                  onClick={() => setSelectedTutorialId('fundamentals-glyphosate')}
                  className={`p-2.5 font-bold text-[10px] rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-805 text-slate-300 hover:border-emerald-500/40' : 'bg-white border-slate-200 text-slate-600 hover:shadow-xs'
                  }`}
                >
                  📖 Bases du Glyhposate
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTutorialId('hve-ift-explanation')}
                  className={`p-2.5 font-bold text-[10px] rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-805 text-slate-300 hover:border-amber-500/40' : 'bg-white border-slate-200 text-slate-600 hover:shadow-xs'
                  }`}
                >
                  🏆 Comprendre l'IFT
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTutorialId('equipment-protective-rules')}
                  className={`p-2.5 font-bold text-[10px] rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-805 text-slate-300 hover:border-red-500/40' : 'bg-white border-slate-200 text-slate-600 hover:shadow-xs'
                  }`}
                >
                  🛡️ S'équiper avec les EPI
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Parcelle } from '../types';
import { MapPin, Info, Layers, Crosshair, HelpCircle } from 'lucide-react';

interface ParcellesMapProps {
  parcelles: Parcelle[];
  selectedParcelId?: string | null;
  onSelectParcel?: (id: string) => void;
  isDarkMode: boolean;
  // Callback when user clicks map to select an insertion point for a new parcel
  onMapClickCoordinate?: (lat: number, lng: number) => void;
  interactiveSelection?: boolean;
}

export default function ParcellesMap({
  parcelles,
  selectedParcelId,
  onSelectParcel,
  isDarkMode,
  onMapClickCoordinate,
  interactiveSelection = true
}: ParcellesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const fieldsLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Helper to get color based on cepage or culture
  const getParcelColor = (cepage: string = '') => {
    const c = cepage.toLowerCase();
    if (c.includes('pinot') || c.includes('noir') || c.includes('rouge')) return '#dc2626'; // Red wine Pinot
    if (c.includes('chardonnay') || c.includes('blanc') || c.includes('aligote')) return '#d97706'; // Golden white wine
    if (c.includes('orge') || c.includes('ble') || c.includes('cereale')) return '#eab308'; // Amber cereal
    if (c.includes('mais')) return '#fbbf24'; // Yellow corn
    return '#10b981'; // Default Agronomic Emerald
  };

  // Coordinates helper to center map
  const getMapCenter = (): [number, number] => {
    const activeParcelles = parcelles.filter(p => p.latitude && p.longitude);
    if (activeParcelles.length > 0) {
      const sumLat = activeParcelles.reduce((acc, p) => acc + (p.latitude || 47.15), 0);
      const sumLng = activeParcelles.reduce((acc, p) => acc + (p.longitude || 4.93), 0);
      return [sumLat / activeParcelles.length, sumLng / activeParcelles.length];
    }
    return [47.15, 4.93]; // Burgundy base
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center = getMapCenter();
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    // Use clean tile template
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const attribution = isDarkMode
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    L.tileLayer(tileUrl, { attribution, maxZoom: 20 }).addTo(map);

    // Add Layer Groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    fieldsLayerRef.current = L.layerGroup().addTo(map);

    // Map Click Handler for placing new plots
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Update state
      setTempCoords({ lat, lng });

      if (onMapClickCoordinate) {
        onMapClickCoordinate(lat, lng);
      }

      // Add temporary marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setLatLng(e.latlng);
      } else {
        const tempIcon = L.divIcon({
          className: 'custom-temp-marker',
          html: `<div class="w-7 h-7 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-white font-bold shadow-md animate-pulse">
            📍
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28]
        });

        tempMarkerRef.current = L.marker(e.latlng, {
          icon: tempIcon,
          draggable: true
        }).addTo(map);

        tempMarkerRef.current.on('dragend', (deEvent: any) => {
          const marker = deEvent.target;
          const pos = marker.getLatLng();
          setTempCoords({ lat: pos.lat, lng: pos.lng });
          if (onMapClickCoordinate) {
            onMapClickCoordinate(pos.lat, pos.lng);
          }
        });
      }

      // Add simple descriptive tooltip of selected coordinate
      tempMarkerRef.current.bindTooltip(
        `<div class="text-xs p-1 font-sans">
          <span class="font-bold text-amber-600">🎯 Emplacement Sélectionné</span><br/>
          Lat: ${lat.toFixed(5)}<br/>Lng: ${lng.toFixed(5)}<br/>
          <span class="text-[9px] text-slate-400">Prêt pour création de parcelle</span>
        </div>`,
        { permanent: false, direction: 'top', opacity: 0.9 }
      ).openTooltip();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isDarkMode]);

  // Redraw Plot Markings and Fields when Parcelles or selection state updates
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !fieldsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    fieldsLayerRef.current.clearLayers();

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    parcelles.forEach(p => {
      const lat = p.latitude;
      const lng = p.longitude;
      if (!lat || !lng) return;

      const parcelLatLng = L.latLng(lat, lng);
      bounds.extend(parcelLatLng);

      const color = getParcelColor(p.cepage);
      const isSelected = selectedParcelId === p.id;

      // Draw Field Acreage Area (Circular approximation: Area in sq meters = Surface (ha) * 10,005)
      // Radius = sqrt(Area / pi)
      const sqMeters = p.surface * 10000;
      const radius = Math.sqrt(sqMeters / Math.PI);

      const circle = L.circle(parcelLatLng, {
        radius: radius > 0 ? radius : 50, // Minimum radius representation
        color: isSelected ? '#10b981' : color,
        weight: isSelected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.45 : 0.25,
        className: `interactive-parcel-field cursor-pointer transition-all`
      }).addTo(fieldsLayerRef.current!);

      // Construct highly styled custom HTML marker Pin with custom SVGs
      const pinIcon = L.divIcon({
        className: 'custom-parcel-marker-pin',
        html: `
          <div class="relative flex items-center justify-center transition-all ${isSelected ? 'scale-125 z-50' : 'z-10 hover:scale-110'}">
            <div class="absolute w-6 h-6 rounded-full opacity-35 animate-ping" style="background-color: ${color}"></div>
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold shadow-lg transition-colors"
                 style="background-color: ${color}; border-color: ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'}">
              <span class="text-[9px] uppercase font-mono">${p.name.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(parcelLatLng, { icon: pinIcon }).addTo(markersLayerRef.current!);

      // Popup Content template
      const popupHtml = `
        <div class="p-3 text-left max-w-[210px] font-sans text-xs">
          <div class="flex items-center gap-1.5 mb-1.5 border-b pb-1.5 border-slate-100">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${color}"></span>
            <strong class="text-slate-850 font-bold text-sm block truncate">${p.name}</strong>
          </div>
          <div class="space-y-1 text-slate-655 font-medium">
            <p><strong>Commune :</strong> ${p.village}</p>
            <p><strong>Appellation :</strong> ${p.cru}</p>
            <p><strong>Cépage :</strong> <span class="px-1 text-[10px] bg-slate-100 text-slate-800 font-bold rounded">${p.cepage}</span></p>
            <p><strong>Surface :</strong> <span class="font-bold text-emerald-600">${p.surface} ha</span></p>
          </div>
          ${onSelectParcel ? `
            <button 
              type="button" 
              id="btn-select-parcel-${p.id}"
              class="mt-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded text-[10px] uppercase tracking-wide cursor-pointer text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              🎯 Sélectionner la parcelle
            </button>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, className: 'modern-gourmet-popup' });
      circle.bindPopup(popupHtml, { closeButton: false, className: 'modern-gourmet-popup' });

      // Click callback for circles & markers to directly set active item
      const handlePopupSelectionClick = (e: any) => {
        // We defer selection to click inside popup button if provided or click directly
        if (onSelectParcel) {
          // Listen to the button click inside popup when open
          setTimeout(() => {
            const btn = document.getElementById(`btn-select-parcel-${p.id}`);
            if (btn) {
              btn.onclick = () => {
                onSelectParcel(p.id);
                mapRef.current?.closePopup();
              };
            }
          }, 50);
        }
      };

      marker.on('popupopen', handlePopupSelectionClick);
      circle.on('popupopen', handlePopupSelectionClick);

      // Programmatic direct map selection on click
      if (interactiveSelection && onSelectParcel) {
        marker.on('click', () => {
          onSelectParcel(p.id);
        });
        circle.on('click', () => {
          onSelectParcel(p.id);
        });
      }
    });

    // Fit map bounds to view all parcelles simultaneously if > 0
    if (parcelles.filter(p => p.latitude && p.longitude).length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [parcelles, selectedParcelId, interactiveSelection]);

  const handleCenterOnExploitation = () => {
    if (!mapRef.current) return;
    const center = getMapCenter();
    mapRef.current.setView(center, 12, { animate: true });
  };

  const handleClearTempCoord = () => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
    setTempCoords(null);
    if (onMapClickCoordinate) {
      onMapClickCoordinate(0, 0); // reset
    }
  };

  return (
    <div className="space-y-3.5 text-left">
      <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
        isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-205 text-slate-600'
      }`}>
        <div className="flex items-center gap-x-2">
          <Layers className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>
            <strong>Visualisation SIG live :</strong> Cliquez sur une parcelle pour la sélectionner.
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleCenterOnExploitation}
            className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/25 rounded-md font-bold transition-all text-[10px] flex items-center gap-x-1 cursor-pointer"
            title="Recentrer le domaine"
          >
            <Crosshair className="w-3 h-3" />
            <span>Recadrer</span>
          </button>
          
          {tempCoords && (
            <button
              type="button"
              onClick={handleClearTempCoord}
              className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 hover:border-rose-500/25 rounded-md font-bold transition-all text-[10px] flex items-center gap-x-1 cursor-pointer"
            >
              <span>Effacer cible [🎯]</span>
            </button>
          )}
        </div>
      </div>

      {/* Actual Map Containment Stage */}
      <div 
        className="relative rounded-2xl overflow-hidden border border-slate-300/80 dark:border-slate-800 shadow-md h-[360px] md:h-[460px] w-full"
        style={{ zIndex: 1 }}
      >
        <div ref={mapContainerRef} className="w-full h-full" id="agricultural-gis-canvas" />

        {/* Map legend overlay widget */}
        <div className={`absolute bottom-3 right-3 p-3 rounded-xl border shadow-md font-sans text-[10px] leading-relaxed z-500 space-y-1.5 pointer-events-auto ${
          isDarkMode ? 'bg-slate-950/90 border-slate-850 text-slate-300' : 'bg-white/95 border-slate-100 text-slate-700'
        }`} style={{ zIndex: 600 }}>
          <p className="font-bold border-b pb-1 mb-1 border-slate-400/20 text-center text-[10px] uppercase tracking-wider text-slate-500">Cultures & Cépages</p>
          <div className="flex items-center gap-x-2 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full block border border-white/20 bg-red-600"></span>
            <span>Pinot Noir / Rouges</span>
          </div>
          <div className="flex items-center gap-x-2 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full block border border-white/20 bg-amber-600"></span>
            <span>Chardonnay / Blancs</span>
          </div>
          <div className="flex items-center gap-x-2 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full block border border-white/20 bg-yellow-500"></span>
            <span>Céréales & Maïs</span>
          </div>
          <div className="flex items-center gap-x-2 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full block border border-white/20 bg-emerald-500"></span>
            <span>Autre / Non spécifié</span>
          </div>
          {tempCoords && (
            <div className="border-t pt-1.5 mt-1.5 border-dashed border-amber-500/30 font-semibold text-amber-600">
              ⚡ Placeur : {tempCoords.lat.toFixed(4)}, {tempCoords.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Floating Tooltip Instruction */}
        <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl border shadow-sm flex items-center gap-x-1.5 z-500 max-w-[280px] leading-tight ${
          isDarkMode ? 'bg-slate-950/85 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-150 text-slate-700'
        }`} style={{ zIndex: 600 }}>
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-[10px] font-medium leading-relaxed">
            Astuce : Cliquez sur la carte pour définir les coordonnées d'une nouvelle parcelle à ajouter !
          </span>
        </div>
      </div>
    </div>
  );
}

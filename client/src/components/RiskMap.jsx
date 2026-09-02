import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayersControl,
  useMapEvents
} from 'react-leaflet';

import {
  AlertTriangle,
  CloudRain,
  X
} from 'lucide-react';

import RiskPointPopup from './RiskPointPopup';

import {
  API,
  enrichLocation,
  getAreaName,
  getRiskPointName,
  riskClass,
  riskColor
} from '../App';

import 'leaflet/dist/leaflet.css';

function MapClickHandler({
  onLocationClick,
  disabled = false
}) {
  useMapEvents({
    click: async event => {
      if (disabled) return;

      const lat = Number(event.latlng.lat);
      const lng = Number(event.latlng.lng);

      try {
        onLocationClick({
          loading: true,
          lat,
          lng
        });

        const response = await fetch(
          `${API}/location-report?lat=${encodeURIComponent(
            lat
          )}&lng=${encodeURIComponent(lng)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to get live conditions'
          );
        }

        let finalData = {
          ...data,
          lat: data.lat ?? lat,
          lng: data.lng ?? lng,
          clickedLocation: true
        };

        finalData =
          await enrichLocation(finalData);

        onLocationClick({
          loading: false,
          data: finalData
        });
      } catch (error) {
        onLocationClick({
          loading: false,
          error:
            error.message ||
            'Unable to get live conditions'
        });
      }
    }
  });

  return null;
}

export function MapLayers() {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer
        checked
        name="English Street Map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Standard Map">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Terrain">
        <TileLayer
          attribution="Map data &copy; OpenStreetMap contributors &copy; SRTM"
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Satellite">
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Topographic">
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Light">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}

export default function RiskMap({
  locations,
  onSelect,
  compact = false
}) {
  const [clickReport, setClickReport] =
    useState(null);

  const openReport = async () => {
    if (clickReport?.data) {
      onSelect(
        await enrichLocation(
          clickReport.data
        )
      );
    }
  };

  return (
    <div
      className={
        compact
          ? 'mapWrap compact'
          : 'mapWrap'
      }
    >
      <MapContainer
        center={[25.7, 92.5]}
        zoom={compact ? 5 : 6}
        scrollWheelZoom={!compact}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <MapLayers />

        <MapClickHandler
          onLocationClick={setClickReport}
          disabled={Boolean(
            clickReport?.loading
          )}
        />

        {locations.map((location, index) => (
          <CircleMarker
            key={
              location.id ??
              `${location.lat}-${location.lng}-${index}`
            }
            center={[
              Number(location.lat),
              Number(location.lng)
            ]}
            radius={
              String(location.riskLevel).toUpperCase() ===
              'CRITICAL'
                ? compact ? 11 : 16
                : compact ? 8 : 13
            }
            pathOptions={{
              color: riskColor(location.riskLevel),
              fillColor: riskColor(location.riskLevel),
              fillOpacity:
                String(location.riskLevel).toUpperCase() ===
                'CRITICAL'
                  ? 0.85
                  : 0.65,
              weight:
                String(location.riskLevel).toUpperCase() ===
                'CRITICAL'
                  ? 3
                  : 2
            }}
            eventHandlers={{
              click: event => {
                event.originalEvent.stopPropagation();
                onSelect(location);
              }
            }}
          >
            <Popup>
              <RiskPointPopup
                location={location}
              />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {clickReport?.loading && (
        <div className="mapClickLoading">
          <CloudRain size={18} />
          Getting live conditions...
        </div>
      )}

      {clickReport?.error && (
        <div className="mapClickError">
          <AlertTriangle size={18} />

          <span>{clickReport.error}</span>

          <button
            onClick={() =>
              setClickReport(null)
            }
          >
            <X size={14} />
          </button>
        </div>
      )}

      {clickReport?.data && (
        <div className="mapClickReport">
          <div>
            <small>EXACT MAP LOCATION</small>

            <b>
              {getAreaName(
                clickReport.data
              )}
            </b>

            <span>
              {clickReport.data.state ||
                'Northeast India'}
            </span>

            <small>
              {getRiskPointName(
                clickReport.data
              )}
            </small>

            <strong
              className={`riskPill ${riskClass(
                clickReport.data.riskLevel
              )}`}
            >
              {clickReport.data.riskLevel}
              {' • '}
              {clickReport.data.riskScore}%
            </strong>
          </div>

          <button
            className="primary"
            onClick={openReport}
          >
            View live report
          </button>
        </div>
      )}

      <div className="legend">
        <span>
          <i className="dot low" /> Low
        </span>

        <span>
          <i className="dot moderate" /> Moderate
        </span>

        <span>
          <i className="dot high" /> High
        </span>

        <span>
          <i className="dot critical" /> Critical
        </span>
      </div>
    </div>
  );
}
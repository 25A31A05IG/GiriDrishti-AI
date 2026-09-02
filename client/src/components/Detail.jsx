import React from 'react';
import {
  X,
  CloudRain,
  Navigation,
  Gauge,
  Mountain
} from 'lucide-react';

import Feature from './Feature';

import {
  getAreaName,
  getRiskPointName,
  riskClass
} from '../App';

export default function Detail({
  location,
  onClose
}) {
  if (!location) return null;

  const areaName =
    getAreaName(location);

  const risk =
    String(
      location.riskLevel || ''
    ).toUpperCase();

  const action =
    risk === 'CRITICAL'
      ? 'Immediate field inspection; consider road restriction and notify nearby communities.'
      : risk === 'HIGH'
      ? 'Field inspection and enhanced monitoring; prepare local warning.'
      : 'Continue monitoring and verify field conditions.';

  return (
    <div className="overlay">
      <div className="drawer">
        <button
          className="close"
          onClick={onClose}
        >
          <X />
        </button>

        <p className="eyebrow">
          {location.clickedLocation
            ? 'EXACT LIVE LOCATION REPORT'
            : 'LIVE RISK ASSESSMENT'}
        </p>

        <h2>
          {areaName === 'Unknown Area'
            ? 'Selected Location'
            : areaName}
        </h2>

        <p>
          {location.state ||
            'Northeast India'}
        </p>

        <p style={{
          fontSize: 12,
          opacity: 0.65
        }}>
          {getRiskPointName(location)}
        </p>

        {location.displayName && (
          <p style={{
            fontSize: 12,
            opacity: 0.7
          }}>
            {location.displayName}
          </p>
        )}

        <div
          className={`bigRisk ${riskClass(
            location.riskLevel
          )}`}
        >
          <span>
            {location.riskLevel ||
              'UNKNOWN'}
          </span>

          <strong>
            {location.riskScore ?? 0}%
          </strong>

          <small>
            landslide risk score
          </small>
        </div>

        <div className="featureGrid">
          <Feature
            icon={<CloudRain />}
            label="Rainfall"
            value={`${Number(
              location.rainfall || 0
            ).toFixed(2)} mm`}
          />

          <Feature
            icon={<Navigation />}
            label="Slope"
            value={`${location.slope ?? 0}°`}
          />

          <Feature
            icon={<Gauge />}
            label="Soil moisture"
            value={`${Number(
              location.soilMoisture || 0
            ).toFixed(2)}%`}
          />

          <Feature
            icon={<Mountain />}
            label="Elevation"
            value={`${location.elevation ?? 0} m`}
          />
        </div>

        <h3>Current Weather</h3>

        <div className="exposure">
          <span>
            🌧️{' '}
            {Number(
              location.currentRain || 0
            ).toFixed(2)} mm current rain
          </span>

          <span>
            💧{' '}
            {Number(
              location.humidity || 0
            ).toFixed(0)}% humidity
          </span>

          <span>
            🌡️{' '}
            {Number(
              location.temperature || 0
            ).toFixed(1)}°C
          </span>

          <span>
            💨{' '}
            {Number(
              location.windSpeed || 0
            ).toFixed(1)} km/h wind
          </span>
        </div>

        <h3>Coordinates</h3>

        <div className="exposure">
          <span>
            Latitude:{' '}
            {Number(
              location.lat
            ).toFixed(6)}
          </span>

          <span>
            Longitude:{' '}
            {Number(
              location.lng
            ).toFixed(6)}
          </span>
        </div>

        <div className="recommend">
          <b>Recommended action</b>
          <p>{action}</p>
        </div>

        <div style={{
          marginTop: 16,
          fontSize: 12,
          opacity: 0.7
        }}>
          Weather source:{' '}
          {location.weatherSource ||
            'Open-Meteo live weather'}
          <br />

          Updated:{' '}
          {location.weatherUpdatedAt
            ? new Date(
                location.weatherUpdatedAt
              ).toLocaleString()
            : 'Not available'}
          <br />

          ML service:{' '}
          {location.mlService
            ? 'Online'
            : 'Fallback risk engine'}
        </div>
      </div>
    </div>
  );
}
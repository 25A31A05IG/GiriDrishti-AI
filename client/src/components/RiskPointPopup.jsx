import React, { useEffect, useState } from 'react';
import {
  getAreaName,
  getRiskPointName,
  riskClass,
  reverseGeocode
} from '../App';

export default function RiskPointPopup({
  location
}) {
  const [area, setArea] = useState(
    getAreaName(location)
  );

  const [loadingArea, setLoadingArea] =
    useState(
      getAreaName(location) ===
        'Unknown Area'
    );

  useEffect(() => {
    let cancelled = false;

    const existing = getAreaName(location);

    if (existing !== 'Unknown Area') {
      setArea(existing);
      setLoadingArea(false);
      return;
    }

    const lat = Number(location?.lat);
    const lng = Number(location?.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setLoadingArea(false);
      return;
    }

    reverseGeocode(lat, lng)
      .then(result => {
        if (!cancelled) {
          setArea(result.areaName);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingArea(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  const formatWeatherTime = value => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const weatherTime =
    location?.weatherUpdatedAt ||
    location?.weatherTime ||
    location?.updatedAt;

  const checkedTime =
    location?.weatherCheckedAt ||
    location?.checkedAt;

  return (
    <div className="mapPopup">
      <b>
        {loadingArea
          ? 'Finding area...'
          : area}
      </b>

      <span>
        {location.state ||
          'Northeast India'}
      </span>

      <small>
        {getRiskPointName(location)}
      </small>

      <strong
        className={riskClass(
          location.riskLevel
        )}
      >
        {location.riskLevel}
        {' • '}
        {location.riskScore ?? 0}%
      </strong>

      <small>
        Coordinates:{' '}
        {Number(location.lat).toFixed(5)}
        {', '}
        {Number(location.lng).toFixed(5)}
      </small>

      {location.rainfall !== undefined && (
        <small>
          Rainfall: {location.rainfall} mm
        </small>
      )}

      {location.temperature !== undefined && (
        <small>
          Temperature: {location.temperature}°C
        </small>
      )}

      {location.humidity !== undefined && (
        <small>
          Humidity: {location.humidity}%
        </small>
      )}

      {location.windSpeed !== undefined && (
        <small>
          Wind: {location.windSpeed} km/h
        </small>
      )}

      {weatherTime && (
        <small>
          Weather data:{' '}
          {formatWeatherTime(weatherTime)}
        </small>
      )}

      {checkedTime && (
        <small>
          Checked:{' '}
          {formatWeatherTime(checkedTime)}
        </small>
      )}

      <small>
        Source: Open-Meteo
      </small>
    </div>
  );
}
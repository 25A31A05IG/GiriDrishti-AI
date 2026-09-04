// services/weatherService.js

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const geocodeCache = new Map();

/**
 * Reverse-geocodes coordinates into actual town, district, and state names
 */
async function fetchPlaceName(lat, lng) {
  const key = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=jsonv2&zoom=14`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "GiriDrishtiAI/2.0 (DisasterManagement)" }
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const areaName =
        addr.village ||
        addr.suburb ||
        addr.town ||
        addr.city ||
        addr.municipality ||
        addr.county ||
        addr.district ||
        addr.state_district ||
        `Sector (${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)})`;

      const state = addr.state || "Northeast India";
      const result = {
        areaName,
        state,
        displayName: `${areaName}, ${state}`,
        fullAddress: data.display_name || `${areaName}, ${state}`
      };

      geocodeCache.set(key, result);
      return result;
    }
  } catch (_) {}

  return {
    areaName: `Sector (${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)})`,
    state: "Northeast India",
    displayName: `Northeast India (${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)})`,
    fullAddress: "Northeast India Region"
  };
}

/**
 * Fetches real-time, high-precision telemetry from Open-Meteo NWP models
 */
async function fetchAccurateWeather(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,surface_pressure` +
    `&hourly=precipitation,rain,showers,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_temperature_0_to_7cm` +
    `&past_days=1&forecast_days=1&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  const nowIso = new Date().toISOString();

  if (!response.ok) {
    throw new Error(`Open-Meteo returned status ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const hourly = data.hourly || {};

  // Exact matching between current observation time and hourly index
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  let activeIndex = times.length - 1;

  if (current.time && times.length > 0) {
    const targetMs = new Date(current.time).getTime();
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(new Date(times[i]).getTime() - targetMs);
      if (diff < minDiff) {
        minDiff = diff;
        activeIndex = i;
      }
    }
  }

  // 24-hour antecedent rainfall calculation
  const hourlyPrecip = Array.isArray(hourly.precipitation)
    ? hourly.precipitation.map(Number).filter(Number.isFinite)
    : [];

  const pastPrecip = activeIndex > 0
    ? hourlyPrecip.slice(Math.max(0, activeIndex - 24), activeIndex + 1)
    : hourlyPrecip.slice(0, 24);

  const accumulated24hRain = pastPrecip.reduce((acc, val) => acc + val, 0);

  // Parse volumetric soil moisture across shallow layers (0-1cm, 1-3cm, 3-9cm)
  const layer0 = (hourly.soil_moisture_0_to_1cm || [])[activeIndex];
  const layer1 = (hourly.soil_moisture_1_to_3cm || [])[activeIndex];
  const layer2 = (hourly.soil_moisture_3_to_9cm || [])[activeIndex];

  const validMoisture = [layer0, layer1, layer2].filter(Number.isFinite);
  const avgMoistureFraction = validMoisture.length > 0
    ? validMoisture.reduce((a, b) => a + b, 0) / validMoisture.length
    : 0.28;

  const soilMoisturePct = clamp(avgMoistureFraction * 100, 5, 95);

  const totalPrecip = Number(
    current.precipitation ??
    ((current.rain ?? 0) + (current.showers ?? 0))
  );

  const observedIso = current.time ? new Date(current.time).toISOString() : nowIso;

  return {
    rainfall: Number(totalPrecip.toFixed(2)),
    currentRain: Number((current.rain ?? 0).toFixed(2)),
    showers: Number((current.showers ?? 0).toFixed(2)),
    accumulated24hRain: Number(accumulated24hRain.toFixed(2)),
    soilMoisture: Number(soilMoisturePct.toFixed(2)),
    soilTemperature: activeIndex >= 0 && Array.isArray(hourly.soil_temperature_0_to_7cm)
      ? Number(Number(hourly.soil_temperature_0_to_7cm[activeIndex] ?? 23.5).toFixed(1))
      : 23.5,
    temperature: Number.isFinite(Number(current.temperature_2m))
      ? Number(Number(current.temperature_2m).toFixed(1))
      : 24.0,
    apparentTemperature: Number.isFinite(Number(current.apparent_temperature))
      ? Number(Number(current.apparent_temperature).toFixed(1))
      : null,
    humidity: Number.isFinite(Number(current.relative_humidity_2m))
      ? Math.round(Number(current.relative_humidity_2m))
      : 65,
    windSpeed: Number.isFinite(Number(current.wind_speed_10m))
      ? Number(Number(current.wind_speed_10m).toFixed(1))
      : 0.0,
    surfacePressure: Number.isFinite(Number(current.surface_pressure))
      ? Number(Number(current.surface_pressure).toFixed(1))
      : null,
    weatherCode: Number(current.weather_code || 0),
    weatherSource: "Open-Meteo High-Resolution API",
    observed: observedIso,
    weatherObservedAt: observedIso,
    retrieved: nowIso,
    weatherRetrievedAt: nowIso,
    weatherUpdatedAt: observedIso,
    weatherCheckedAt: nowIso,
    weatherFresh: true,
    dataStatus: "LIVE"
  };
}

module.exports = {
  fetchAccurateWeather,
  fetchPlaceName
};

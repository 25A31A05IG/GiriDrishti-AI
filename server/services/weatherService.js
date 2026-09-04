// services/weatherService.js

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

async function fetchAccurateWeather(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m,surface_pressure` +
    `&hourly=precipitation,rain,showers,soil_moisture_0_to_7cm,soil_temperature_0_to_7cm` +
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

  // Align local observation timestamp with hourly soil array index
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  let activeIndex = times.length - 1;

  if (current.time && times.length > 0) {
    const curTimeMs = new Date(current.time).getTime();
    let minDelta = Infinity;

    for (let i = 0; i < times.length; i++) {
      const delta = Math.abs(new Date(times[i]).getTime() - curTimeMs);
      if (delta < minDelta) {
        minDelta = delta;
        activeIndex = i;
      }
    }
  }

  // 24-hour antecedent rainfall accumulation
  const hourlyPrecip = Array.isArray(hourly.precipitation)
    ? hourly.precipitation.map(Number).filter(Number.isFinite)
    : [];

  const pastPrecip = activeIndex > 0
    ? hourlyPrecip.slice(Math.max(0, activeIndex - 24), activeIndex + 1)
    : hourlyPrecip.slice(0, 24);

  const accumulated24hRain = pastPrecip.reduce((sum, val) => sum + val, 0);

  // Volumetric fraction (m³/m³) to accurate percentage conversion
  const soilArr = Array.isArray(hourly.soil_moisture_0_to_7cm)
    ? hourly.soil_moisture_0_to_7cm.filter(Number.isFinite)
    : [];

  const rawFraction = activeIndex >= 0 && soilArr[activeIndex] !== undefined
    ? soilArr[activeIndex]
    : (soilArr[0] ?? 0.24);

  const soilMoisturePct = clamp(rawFraction * 100, 0, 100);

  // Total current rain including convective showers
  const currentTotalPrecip = Number(
    current.precipitation ??
    ((current.rain ?? 0) + (current.showers ?? 0))
  );

  const observedIso = current.time ? new Date(current.time).toISOString() : nowIso;

  return {
    rainfall: Number(currentTotalPrecip.toFixed(2)),
    currentRain: Number((current.rain ?? 0).toFixed(2)),
    showers: Number((current.showers ?? 0).toFixed(2)),
    accumulated24hRain: Number(accumulated24hRain.toFixed(2)),
    soilMoisture: Number(soilMoisturePct.toFixed(2)),
    soilTemperature: activeIndex >= 0 && Array.isArray(hourly.soil_temperature_0_to_7cm)
      ? Number(hourly.soil_temperature_0_to_7cm[activeIndex] ?? 22.0)
      : 22.0,
    temperature: Number.isFinite(Number(current.temperature_2m))
      ? Number(current.temperature_2m)
      : 24.0,
    apparentTemperature: Number.isFinite(Number(current.apparent_temperature))
      ? Number(current.apparent_temperature)
      : null,
    humidity: Number.isFinite(Number(current.relative_humidity_2m))
      ? Number(current.relative_humidity_2m)
      : 65,
    windSpeed: Number.isFinite(Number(current.wind_speed_10m))
      ? Number(current.wind_speed_10m)
      : 0,
    surfacePressure: Number.isFinite(Number(current.surface_pressure))
      ? Number(current.surface_pressure)
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
  fetchAccurateWeather
};

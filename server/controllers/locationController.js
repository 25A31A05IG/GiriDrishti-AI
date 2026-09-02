const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ||
  'http://localhost:8000';

const NORTHEAST_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
];

const WEATHER_TIMEOUT = 15000;

let inventory = [];
let inventoryLoaded = false;

/* =========================================================
   LOAD GSI INVENTORY
========================================================= */

function loadInventory() {
  if (inventoryLoaded) return inventory;

  const possibleFiles = [
    path.join(
      __dirname,
      '..',
      'data',
      'gsi_landslide_clean.csv'
    ),
    path.join(
      __dirname,
      '..',
      'data',
      'gsi_ner_inventory.csv'
    ),
    path.join(
      __dirname,
      '..',
      '..',
      'ml-service',
      'data',
      'gsi_landslide_clean.csv'
    )
  ];

  const file = possibleFiles.find(
    filePath => fs.existsSync(filePath)
  );

  if (!file) {
    console.warn(
      'GSI inventory CSV not found.'
    );

    inventoryLoaded = true;
    inventory = [];
    return inventory;
  }

  try {
    const text =
      fs.readFileSync(file, 'utf8');

    const lines =
      text.split(/\r?\n/)
        .filter(Boolean);

    if (lines.length < 2) {
      inventoryLoaded = true;
      inventory = [];
      return inventory;
    }

    const headers =
      parseCSVLine(lines[0]);

    inventory =
      lines
        .slice(1)
        .map(line => {
          const values =
            parseCSVLine(line);

          const row = {};

          headers.forEach(
            (header, index) => {
              row[header] =
                values[index] ?? '';
            }
          );

          return row;
        })
        .map(row => ({
          ...row,
          latitude: Number(
            row.latitude
          ),
          longitude: Number(
            row.longitude
          )
        }))
        .filter(row =>
          Number.isFinite(row.latitude) &&
          Number.isFinite(row.longitude)
        )
        .filter(row => {
          const state =
            normalizeState(row.state);

          return NORTHEAST_STATES.includes(
            state
          );
        });

    inventoryLoaded = true;

    console.log(
      `GSI inventory loaded: ${inventory.length} Northeast records`
    );

    return inventory;

  } catch (error) {
    console.error(
      'Unable to load GSI inventory:',
      error.message
    );

    inventoryLoaded = true;
    inventory = [];

    return inventory;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let quoted = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {
    const char = line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      char === ',' &&
      !quoted
    ) {
      result.push(
        current.trim()
      );

      current = '';
      continue;
    }

    current += char;
  }

  result.push(
    current.trim()
  );

  return result;
}

function normalizeState(state) {
  const value =
    String(state || '')
      .trim()
      .toLowerCase();

  const match =
    NORTHEAST_STATES.find(
      item =>
        item.toLowerCase() === value
    );

  return match || state;
}

/* =========================================================
   DISTANCE
========================================================= */

function distanceKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) *
      Math.PI) /
    180;

  const dLng =
    ((lng2 - lng1) *
      Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
    Math.cos(
      (lat2 * Math.PI) / 180
    ) *
    Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/* =========================================================
   HISTORICAL RISK
========================================================= */

function calculateHistoricalRisk(
  lat,
  lng
) {
  const data = loadInventory();

  if (!data.length) {
    return {
      score: 0,
      nearbyCount: 0,
      nearestDistanceKm: null
    };
  }

  let nearbyCount = 0;
  let nearest =
    Infinity;

  /*
    Nearby historical landslides
    have stronger influence.

    10 km  -> strongest
    25 km  -> strong
    50 km  -> moderate
    100 km -> weak
  */

  for (const item of data) {
    const distance =
      distanceKm(
        lat,
        lng,
        item.latitude,
        item.longitude
      );

    if (distance < nearest) {
      nearest = distance;
    }

    if (distance <= 10) {
      nearbyCount += 5;
    } else if (distance <= 25) {
      nearbyCount += 2;
    } else if (distance <= 50) {
      nearbyCount += 1;
    }
  }

  let score = 0;

  if (nearest <= 5) {
    score = 95;
  } else if (nearest <= 10) {
    score = 85;
  } else if (nearest <= 25) {
    score = 72;
  } else if (nearest <= 50) {
    score = 58;
  } else if (nearest <= 100) {
    score = 40;
  } else {
    score = 20;
  }

  score +=
    Math.min(
      nearbyCount,
      30
    );

  score =
    Math.min(
      Math.round(score),
      100
    );

  return {
    score,
    nearbyCount,
    nearestDistanceKm:
      Number.isFinite(nearest)
        ? Number(
            nearest.toFixed(2)
          )
        : null
  };
}

/* =========================================================
   TERRAIN
========================================================= */

/*
  Prototype terrain estimation.

  IMPORTANT:
  The GSI CSV does not contain DEM
  slope/elevation measurements.

  These are deterministic terrain
  estimates until a real DEM source
  is connected.
*/

function estimateTerrain(
  lat,
  lng
) {
  const seed =
    Math.abs(
      Math.sin(
        lat * 12.9898 +
        lng * 78.233
      )
    );

  const slope =
    8 +
    seed * 42;

  const elevation =
    100 +
    Math.abs(
      Math.sin(
        lat * 5.13 +
        lng * 2.71
      )
    ) *
      2200;

  return {
    slope:
      Number(
        slope.toFixed(1)
      ),
    elevation:
      Number(
        elevation.toFixed(0)
      )
  };
}

/* =========================================================
   OPEN-METEO
========================================================= */

async function getLiveWeather(
  lat,
  lng
) {
  const url =
    'https://api.open-meteo.com/v1/forecast';

  const params = {
    latitude: lat,
    longitude: lng,

    current:
      [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'rain',
        'showers',
        'wind_speed_10m'
      ].join(','),

    hourly:
      [
        'precipitation',
        'soil_moisture_0_1cm'
      ].join(','),

    timezone:
      'auto',

    past_days: 1,

    forecast_days: 2
  };

  try {
    const response =
      await axios.get(
        url,
        {
          params,
          timeout:
            WEATHER_TIMEOUT
        }
      );

    const data =
      response.data || {};

    const current =
      data.current || {};

    const hourly =
      data.hourly || {};

    const precipitation =
      Array.isArray(
        hourly.precipitation
      )
        ? hourly.precipitation
        : [];

    const soil =
      Array.isArray(
        hourly.soil_moisture_0_1cm
      )
        ? hourly.soil_moisture_0_1cm
        : [];

    /*
      Use the latest available hourly
      precipitation values for recent
      rainfall rather than accidentally
      using the first 24 forecast hours.
    */

    const recentRainValues =
      precipitation.slice(-24);

    const recentRainfall =
      recentRainValues.reduce(
        (sum, value) =>
          sum +
          (Number(value) || 0),
        0
      );

    const validSoil =
      soil
        .map(Number)
        .filter(
          Number.isFinite
        );

    const latestSoil =
      validSoil.length
        ? validSoil[
            validSoil.length - 1
          ]
        : null;

    const currentRain =
      Number(
        current.precipitation
      ) || 0;

    const temperature =
      Number(
        current.temperature_2m
      );

    const humidity =
      Number(
        current.relative_humidity_2m
      );

    const windSpeed =
      Number(
        current.wind_speed_10m
      );

    return {
      available: true,

      rainfall:
        Number(
          recentRainfall.toFixed(2)
        ),

      currentRain:
        Number(
          currentRain.toFixed(2)
        ),

      soilMoisture:
        latestSoil !== null
          ? Number(
              latestSoil.toFixed(3)
            )
          : null,

      temperature:
        Number.isFinite(
          temperature
        )
          ? Number(
              temperature.toFixed(1)
            )
          : null,

      humidity:
        Number.isFinite(
          humidity
        )
          ? Math.round(
              humidity
            )
          : null,

      windSpeed:
        Number.isFinite(
          windSpeed
        )
          ? Number(
              windSpeed.toFixed(1)
            )
          : null,

      weatherTime:
        current.time ||
        null,

      weatherSource:
        'Open-Meteo'
    };

  } catch (error) {
    console.error(
      'Open-Meteo error:',
      error.response?.data ||
        error.message
    );

    /*
      Fallback request.

      Even if an extended weather
      variable fails, we still try
      to obtain the basic current
      weather.
    */

    try {
      const fallback =
        await axios.get(
          url,
          {
            params: {
              latitude: lat,
              longitude: lng,
              current:
                [
                  'temperature_2m',
                  'relative_humidity_2m',
                  'precipitation',
                  'wind_speed_10m'
                ].join(','),
              timezone: 'auto'
            },
            timeout:
              WEATHER_TIMEOUT
          }
        );

      const current =
        fallback.data?.current ||
        {};

      return {
        available: true,

        rainfall:
          Number(
            current.precipitation
          ) || 0,

        currentRain:
          Number(
            current.precipitation
          ) || 0,

        soilMoisture:
          null,

        temperature:
          Number.isFinite(
            Number(
              current.temperature_2m
            )
          )
            ? Number(
                Number(
                  current.temperature_2m
                ).toFixed(1)
              )
            : null,

        humidity:
          Number.isFinite(
            Number(
              current.relative_humidity_2m
            )
          )
            ? Number(
                current.relative_humidity_2m
              )
            : null,

        windSpeed:
          Number.isFinite(
            Number(
              current.wind_speed_10m
            )
          )
            ? Number(
                Number(
                  current.wind_speed_10m
                ).toFixed(1)
              )
            : null,

        weatherTime:
          current.time ||
          null,

        weatherSource:
          'Open-Meteo'
      };

    } catch (fallbackError) {
      console.error(
        'Open-Meteo fallback error:',
        fallbackError.message
      );

      return {
        available: false,
        rainfall: 0,
        currentRain: 0,
        soilMoisture: null,
        temperature: null,
        humidity: null,
        windSpeed: null,
        weatherTime: null,
        weatherSource:
          'Open-Meteo unavailable'
      };
    }
  }
}

/* =========================================================
   AI PREDICTION
========================================================= */

async function getAIPrediction(
  features
) {
  try {
    const response =
      await axios.post(
        `${ML_SERVICE_URL}/predict`,
        features,
        {
          timeout:
            15000
        }
      );

    return response.data;

  } catch (error) {
    console.error(
      'ML service error:',
      error.response?.data ||
        error.message
    );

    return null;
  }
}

/* =========================================================
   RISK CALCULATION
========================================================= */

function calculateFallbackRisk({
  weather,
  terrain,
  historical
}) {
  /*
    Environmental score

    Rain:
      current/recent rainfall

    Soil:
      soil moisture

    Terrain:
      slope

    Historical:
      GSI evidence
  */

  const rainScore =
    Math.min(
      Number(
        weather.rainfall || 0
      ) / 80,
      1
    ) * 100;

  const currentRainScore =
    Math.min(
      Number(
        weather.currentRain || 0
      ) / 25,
      1
    ) * 100;

  const slopeScore =
    Math.min(
      Number(
        terrain.slope || 0
      ) / 45,
      1
    ) * 100;

  const soilValue =
    weather.soilMoisture;

  const soilScore =
    soilValue !== null &&
    Number.isFinite(
      Number(soilValue)
    )
      ? Math.min(
          Number(soilValue) / 0.5,
          1
        ) * 100
      : 35;

  const terrainScore =
    slopeScore;

  const historicalScore =
    historical.score;

  let score =
    rainScore * 0.22 +
    currentRainScore * 0.13 +
    soilScore * 0.18 +
    terrainScore * 0.20 +
    historicalScore * 0.27;

  /*
    If there is very strong rainfall
    near known historical landslides,
    increase the risk response.
  */

  if (
    historicalScore >= 70 &&
    rainScore >= 60
  ) {
    score += 8;
  }

  if (
    historicalScore >= 80 &&
    currentRainScore >= 50 &&
    slopeScore >= 60
  ) {
    score += 8;
  }

  score =
    Math.max(
      0,
      Math.min(
        Math.round(score),
        100
      )
    );

  return score;
}

function riskLevelFromScore(
  score
) {
  if (score >= 85) {
    return 'CRITICAL';
  }

  if (score >= 65) {
    return 'HIGH';
  }

  if (score >= 40) {
    return 'MODERATE';
  }

  return 'LOW';
}

/* =========================================================
   COMPLETE LOCATION REPORT
========================================================= */

async function buildLocationReport(
  lat,
  lng
) {
  const weather =
    await getLiveWeather(
      lat,
      lng
    );

  const terrain =
    estimateTerrain(
      lat,
      lng
    );

  const historical =
    calculateHistoricalRisk(
      lat,
      lng
    );

  const ml =
    await getAIPrediction({
      rainfall:
        Number(
          weather.rainfall || 0
        ),

      soilMoisture:
        Number(
          weather.soilMoisture || 0
        ),

      slope:
        terrain.slope,

      elevation:
        terrain.elevation,

      historicalRisk:
        historical.score,

      latitude: lat,

      longitude: lng
    });

  let riskScore;

  let aiScore =
    ml?.aiScore ?? null;

  if (
    ml &&
    Number.isFinite(
      Number(ml.riskScore)
    )
  ) {
    riskScore =
      Math.round(
        Number(
          ml.riskScore
        )
      );
  } else {
    riskScore =
      calculateFallbackRisk({
        weather,
        terrain,
        historical
      });
  }

  riskScore =
    Math.max(
      0,
      Math.min(
        riskScore,
        100
      )
    );

  /*
    Use our calibrated thresholds
    consistently even if the ML service
    returns a textual level.
  */

  const riskLevel =
    riskLevelFromScore(
      riskScore
    );

  const checkedAt =
    new Date().toISOString();

  return {
    lat,
    lng,

    riskScore,

    riskLevel,

    probability:
      ml?.probability ??
      riskScore / 100,

    aiScore,

    rainfall:
      weather.rainfall,

    currentRain:
      weather.currentRain,

    soilMoisture:
      weather.soilMoisture,

    temperature:
      weather.temperature,

    humidity:
      weather.humidity,

    windSpeed:
      weather.windSpeed,

    weatherUpdatedAt:
      weather.weatherTime,

    weatherCheckedAt:
      checkedAt,

    weatherSource:
      weather.weatherSource,

    weatherAvailable:
      weather.available,

    slope:
      terrain.slope,

    elevation:
      terrain.elevation,

    historicalRisk:
      historical.score,

    nearbyHistoricalLandslides:
      historical.nearbyCount,

    nearestHistoricalLandslideKm:
      historical.nearestDistanceKm,

    mlAvailable:
      Boolean(ml),

    updatedAt:
      checkedAt
  };
}

/* =========================================================
   DYNAMIC HOTSPOTS
========================================================= */

async function getLocations(
  req,
  res
) {
  try {
    const data =
      loadInventory();

    if (!data.length) {
      return res.json([]);
    }

    /*
      Group actual GSI locations into
      spatial cells.

      This means hotspots are generated
      from the real inventory instead of
      fixed demo zones.
    */

    const cells =
      new Map();

    const CELL_SIZE =
      0.18;

    for (const item of data) {
      const lat =
        Number(item.latitude);

      const lng =
        Number(item.longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        continue;
      }

      const cellLat =
        Math.floor(
          lat / CELL_SIZE
        );

      const cellLng =
        Math.floor(
          lng / CELL_SIZE
        );

      const key =
        `${cellLat}:${cellLng}`;

      if (!cells.has(key)) {
        cells.set(
          key,
          []
        );
      }

      cells
        .get(key)
        .push(item);
    }

    const candidates =
      Array.from(
        cells.values()
      )
        .sort(
          (a, b) =>
            b.length - a.length
        )
        .slice(0, 80);

    const results = [];

    /*
      Evaluate each dynamic hotspot.

      Sequential requests are used to
      avoid hammering weather/ML services.
    */

    for (
      const cell of candidates
    ) {
      const center =
        cell.reduce(
          (acc, item) => {
            acc.lat +=
              item.latitude;

            acc.lng +=
              item.longitude;

            return acc;
          },
          {
            lat: 0,
            lng: 0
          }
        );

      const lat =
        center.lat /
        cell.length;

      const lng =
        center.lng /
        cell.length;

      const report =
        await buildLocationReport(
          lat,
          lng
        );

      /*
        Historical concentration
        provides additional hotspot
        evidence.
      */

      const densityBoost =
        Math.min(
          cell.length / 20,
          1
        ) * 12;

      let adjustedScore =
        Math.round(
          report.riskScore +
          densityBoost
        );

      adjustedScore =
        Math.min(
          adjustedScore,
          100
        );

      const adjustedLevel =
        riskLevelFromScore(
          adjustedScore
        );

      results.push({
        ...report,

        id:
          `risk-${lat.toFixed(4)}-${lng.toFixed(4)}`,

        riskScore:
          adjustedScore,

        riskLevel:
          adjustedLevel,

        historicalDensity:
          cell.length,

        state:
          normalizeState(
            cell[0]?.state
          ),

        areaName:
          cell[0]?.district ||
          normalizeState(
            cell[0]?.state
          ),

        riskPointName:
          `${adjustedLevel} Risk Hotspot`,

        pointName:
          `${adjustedLevel} Risk Hotspot`,

        dynamic:
          true
      });
    }

    /*
      Highest-risk points first.
    */

    results.sort(
      (a, b) =>
        b.riskScore -
        a.riskScore
    );

    /*
      Return the strongest dynamic
      hotspots rather than thousands
      of points.
    */

    return res.json(
      results.slice(0, 60)
    );

  } catch (error) {
    console.error(
      'Location controller error:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to calculate live landslide risk'
    });
  }
}

/* =========================================================
   EXACT COORDINATE REPORT
========================================================= */

async function getLocationReport(
  req,
  res
) {
  try {
    const lat =
      Number(req.query.lat);

    const lng =
      Number(req.query.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        error:
          'Valid latitude and longitude are required'
      });
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        error:
          'Latitude or longitude is outside valid range'
      });
    }

    const report =
      await buildLocationReport(
        lat,
        lng
      );

    return res.json({
      ...report,

      id:
        `live-${lat}-${lng}`,

      dynamic:
        true,

      riskPointName:
        `${report.riskLevel} Live Assessment`,

      pointName:
        `${report.riskLevel} Live Assessment`
    });

  } catch (error) {
    console.error(
      'Location report error:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to generate live location report'
    });
  }
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getLocations,
  getLocationReport,
  loadInventory,
  buildLocationReport
};
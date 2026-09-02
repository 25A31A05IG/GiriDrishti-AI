import React from 'react';
import {
  Bell,
  AlertTriangle
} from 'lucide-react';

import PageTitle from './PageTitle';

import {
  enrichLocation,
  sameId,
  riskClass
} from '../App';

export default function Alerts({
  alerts,
  locations,
  onSelect
}) {
  return (
    <>
      <PageTitle
        title="Early Warning Center"
        sub="Automatically detected HIGH and CRITICAL locations from the live NER scan."
        icon={<Bell />}
      />

      <div className="notice">
        <AlertTriangle />

        <div>
          <b>Dynamic live alerts</b>

          <span>
            Alerts are generated from current environmental conditions at dynamically scanned locations.
          </span>
        </div>
      </div>

      <div className="alertGrid">
        {alerts.length === 0 ? (
          <section className="card">
            <p className="muted">
              No current HIGH or CRITICAL hotspots detected.
            </p>
          </section>
        ) : (
          alerts.map((alert, index) => (
            <div
              className="card alertCard"
              key={
                alert.id ??
                `${alert.lat}-${alert.lng}-${index}`
              }
            >
              <div className="alertTop">
                <span
                  className={`riskPill ${riskClass(
                    alert.riskLevel
                  )}`}
                >
                  {alert.riskLevel}
                </span>

                <strong>
                  {alert.riskScore}%
                </strong>
              </div>

              <h3>
                {alert.location ||
                  alert.areaName ||
                  'Unknown Area'}
              </h3>

              <p>
                {alert.state} •{' '}
                {Number(alert.lat).toFixed(5)}
                {', '}
                {Number(alert.lng).toFixed(5)}
              </p>

              <div className="action">
                <b>Live conditions</b>

                <span>
                  Rainfall: {alert.rainfall} mm
                  {' • '}
                  Soil: {alert.soilMoisture}%
                  {' • '}
                  Humidity: {alert.humidity}%
                </span>
              </div>

              <div className="action">
                <b>Recommended action</b>

                <span>
                  {alert.action ||
                    'Continue monitoring and verify field conditions.'}
                </span>
              </div>

              <button
                className="primary"
                onClick={async () => {
                  const location =
                    locations.find(x =>
                      sameId(x.id, alert.id)
                    );

                  onSelect(
                    await enrichLocation(
                      location || alert
                    )
                  );
                }}
              >
                Inspect location
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
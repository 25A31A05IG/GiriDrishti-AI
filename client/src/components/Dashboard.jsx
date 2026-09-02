import React from 'react';
import {
  ChevronRight,
  Gauge
} from 'lucide-react';

import Stats from './Stats';
import RiskMap from './RiskMap';
import Flow from './Flow';
import { sameId, riskClass } from '../App';

export default function Dashboard({
  locations,
  counts,
  avg,
  alerts,
  onSelect,
  setPage
}) {
  return (
    <>
      <div className="hero">
        <div>
          <p className="eyebrow">
            NORTH EASTERN REGION • LIVE RISK INTELLIGENCE
          </p>

          <h1>
            Landslide Risk
            <br />
            <span>Command Center</span>
          </h1>

          <p>
            AI-assisted monitoring that connects
            environmental signals, hazard probability,
            exposure and recommended action.
          </p>
        </div>

        <div className="heroBadge">
          <div className="pulse">
            <span />
          </div>

          <b>AI ENGINE ONLINE</b>

          <small>
            Dynamic risk assessment ready
          </small>
        </div>
      </div>

      <Stats counts={counts} avg={avg} />

      <div className="grid2">
        <section className="card mapCard">
          <div className="cardHead">
            <div>
              <h2>Regional Risk Map</h2>

              <p>
                Live dynamic risk points across Northeast India.
              </p>
            </div>

            <button
              onClick={() => setPage('map')}
              className="textBtn"
            >
              Open full map
              <ChevronRight size={16} />
            </button>
          </div>

          <RiskMap
            locations={locations}
            onSelect={onSelect}
            compact
          />
        </section>

        <section className="card">
          <div className="cardHead">
            <div>
              <h2>Priority Alerts</h2>

              <p>
                Automatically detected live high-risk locations.
              </p>
            </div>

            <button
              onClick={() => setPage('alerts')}
              className="textBtn"
            >
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="alertList">
            {alerts.length === 0 ? (
              <p className="muted">
                No current HIGH or CRITICAL hotspots detected.
              </p>
            ) : (
              alerts.slice(0, 4).map(alert => {
                const location = locations.find(
                  x => sameId(x.id, alert.id)
                );

                return (
                  <div
                    className="alertRow"
                    key={
                      alert.id ??
                      `${alert.lat}-${alert.lng}`
                    }
                    onClick={() =>
                      onSelect(location || alert)
                    }
                  >
                    <span
                      className={`riskPill ${riskClass(
                        alert.riskLevel
                      )}`}
                    >
                      {alert.riskLevel}
                    </span>

                    <div>
                      <b>
                        {alert.location ||
                          alert.areaName ||
                          'Unknown Area'}
                      </b>

                      <small>
                        {alert.state}
                      </small>
                    </div>

                    <strong>
                      {alert.riskScore}%
                    </strong>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="card how">
        <div className="cardHead">
          <div>
            <h2>Risk → Exposure → Action</h2>

            <p>
              Our core decision-support workflow.
            </p>
          </div>
        </div>

        <div className="flow">
          <Flow
            n="01"
            t="Predict"
            d="Live rainfall + soil + terrain + history"
          />

          <Flow
            n="02"
            t="Assess"
            d="Probability and severity"
          />

          <Flow
            n="03"
            t="Expose"
            d="People, roads, infrastructure"
          />

          <Flow
            n="04"
            t="Act"
            d="Dynamic warning and response priority"
          />
        </div>
      </section>
    </>
  );
}
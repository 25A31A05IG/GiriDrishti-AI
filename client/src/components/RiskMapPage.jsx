import React, { useState } from 'react';

import {
  MapContainer,
  CircleMarker,
  Popup,
  useMapEvents
} from 'react-leaflet';

import {
  Map as MapIcon
} from 'lucide-react';

import PageTitle from './PageTitle';
import RiskPointPopup from './RiskPointPopup';
import DynamicZoneDetails from './DynamicZoneDetails';
import { MapLayers } from './RiskMap';

import {
  sameId,
  riskClass,
  riskColor,
  enrichLocation,
  getAreaName,
  getRiskPointName,
  fetchLocationReport
} from '../App';


// =========================================================
// MAP CLICK HANDLER
// =========================================================

function MapClickHandler({ onMapClick }) {

  useMapEvents({

    click: async event => {

      const lat =
        event.latlng.lat;

      const lng =
        event.latlng.lng;

      await onMapClick(
        lat,
        lng
      );
    }

  });

  return null;
}


// =========================================================
// RISK MAP PAGE
// =========================================================

export default function RiskMapPage({
  locations,
  onSelect
}) {

  const [
    selectedZone,
    setSelectedZone
  ] = useState(null);

  const [
    selectedLoading,
    setSelectedLoading
  ] = useState(false);


  // =======================================================
  // SELECT EXISTING RISK POINT
  // =======================================================

  const selectZone = async location => {

    if (!location) {
      return;
    }

    setSelectedZone(
      location
    );

    setSelectedLoading(
      true
    );

    try {

      let enriched =
        location;

      // ---------------------------------------------------
      // GET LIVE CONDITIONS
      // ---------------------------------------------------

      const lat =
        Number(location.lat);

      const lng =
        Number(location.lng);

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {

        try {

          const liveData =
            await fetchLocationReport(
              lat,
              lng
            );

          enriched = {
            ...location,
            ...liveData
          };

        } catch (error) {

          console.error(
            'Unable to load live conditions:',
            error
          );

          enriched = {
            ...location,
            error:
              error.message ||
              'Unable to get live conditions'
          };
        }
      }

      // ---------------------------------------------------
      // REVERSE GEOCODE IF NECESSARY
      // ---------------------------------------------------

      if (
        getAreaName(enriched) ===
        'Unknown Area'
      ) {

        enriched =
          await enrichLocation(
            enriched
          );
      }

      setSelectedZone(
        enriched
      );

      // ---------------------------------------------------
      // ALSO SEND TO APP DETAIL MODAL
      // ---------------------------------------------------

      if (onSelect) {
        onSelect(
          enriched
        );
      }

    } finally {

      setSelectedLoading(
        false
      );
    }
  };


  // =======================================================
  // CLICK ANYWHERE ON MAP
  // =======================================================

  const handleMapClick =
    async (
      lat,
      lng
    ) => {

      console.log(
        'Map clicked:',
        lat,
        lng
      );

      setSelectedLoading(
        true
      );

      // Temporary location while loading

      const temporaryLocation = {

        id:
          `map-${lat}-${lng}`,

        lat,
        lng,

        areaName:
          'Loading location...',

        riskPointName:
          'Live Location',

        loading: true
      };

      setSelectedZone(
        temporaryLocation
      );

      try {

        // -------------------------------------------------
        // FETCH LIVE WEATHER + RISK
        // -------------------------------------------------

        const report =
          await fetchLocationReport(
            lat,
            lng
          );

        console.log(
          'Live report:',
          report
        );

        // -------------------------------------------------
        // REVERSE GEOCODE
        // -------------------------------------------------

        let geo = {

          areaName:
            'Area unavailable',

          district: '',

          state: '',

          displayName: ''
        };

        try {

          geo =
            await enrichLocation({
              lat,
              lng
            });

        } catch (error) {

          console.error(
            'Geocoding failed:',
            error
          );
        }

        // -------------------------------------------------
        // CREATE COMPLETE LOCATION
        // -------------------------------------------------

        const liveLocation = {

          ...report,

          lat,
          lng,

          id:
            `map-${lat}-${lng}`,

          areaName:
            report.areaName ||
            geo.areaName,

          district:
            report.district ||
            geo.district,

          state:
            report.state ||
            geo.state,

          displayName:
            report.displayName ||
            geo.displayName,

          riskPointName:
            'Live Risk Assessment',

          pointName:
            'Live Risk Assessment',

          loading: false
        };

        setSelectedZone(
          liveLocation
        );

        // -------------------------------------------------
        // OPEN MAIN DETAIL PANEL
        // -------------------------------------------------

        if (onSelect) {

          onSelect(
            liveLocation
          );
        }

      } catch (error) {

        console.error(
          'Map live report error:',
          error
        );

        const errorLocation = {

          lat,
          lng,

          id:
            `map-${lat}-${lng}`,

          areaName:
            'Unable to load location',

          riskPointName:
            'Live Location',

          error:
            error.message ||
            'Unable to get live conditions',

          loading: false
        };

        setSelectedZone(
          errorLocation
        );

        if (onSelect) {

          onSelect(
            errorLocation
          );
        }

      } finally {

        setSelectedLoading(
          false
        );
      }
    };


  return (

    <>

      {/* =================================================
          PAGE TITLE
      ================================================= */}

      <PageTitle
        title="Risk Map"
        sub="Explore dynamically detected landslide risk across Northeast India."
        icon={
          <MapIcon />
        }
      />


      {/* =================================================
          MAP + ZONES LAYOUT
      ================================================= */}

      <div className="riskMapLayout">


        {/* =================================================
            MAP
        ================================================= */}

        <section
          className="card riskMapMain"
        >

          <div className="cardHead">

            <div>

              <h2>
                Regional Risk Map
              </h2>

              <p>
                Click any point or anywhere on the map for live conditions.
              </p>

            </div>

          </div>


          <div className="fullRiskMap">

            <MapContainer

              center={[
                25.7,
                92.5
              ]}

              zoom={6}

              scrollWheelZoom

              style={{
                height: '100%',
                width: '100%'
              }}

            >

              {/* =========================================
                  BASE MAP LAYERS
              ========================================= */}

              <MapLayers />


              {/* =========================================
                  ANYWHERE MAP CLICK
              ========================================= */}

              <MapClickHandler
                onMapClick={
                  handleMapClick
                }
              />


              {/* =========================================
                  RISK POINTS
              ========================================= */}

              {locations
                .filter(
                  location =>
                    Number.isFinite(
                      Number(
                        location.lat
                      )
                    ) &&
                    Number.isFinite(
                      Number(
                        location.lng
                      )
                    )
                )
                .map(
                  (
                    location,
                    index
                  ) => (

                    <CircleMarker

                      key={
                        location.id ??
                        `${location.lat}-${location.lng}-${index}`
                      }

                      center={[
                        Number(
                          location.lat
                        ),
                        Number(
                          location.lng
                        )
                      ]}

                      radius={
                        String(
                          location.riskLevel
                        ).toUpperCase() ===
                        'CRITICAL'
                          ? 16
                          : 12
                      }

                      pathOptions={{

                        color:
                          riskColor(
                            location.riskLevel
                          ),

                        fillColor:
                          riskColor(
                            location.riskLevel
                          ),

                        fillOpacity:
                          selectedZone &&
                          sameId(
                            selectedZone.id,
                            location.id
                          )
                            ? 0.95
                            : 0.70,

                        weight:
                          selectedZone &&
                          sameId(
                            selectedZone.id,
                            location.id
                          )
                            ? 4
                            : 2
                      }}

                      eventHandlers={{

                        click:
                          event => {

                            event
                              .originalEvent
                              .stopPropagation();

                            selectZone(
                              location
                            );
                          }

                      }}

                    >

                      <Popup>

                        <RiskPointPopup
                          location={
                            location
                          }
                        />

                      </Popup>

                    </CircleMarker>

                  )
                )}

            </MapContainer>


            {/* =========================================
                LEGEND
            ========================================= */}

            <div className="legend">

              <span>

                <i className="dot low" />

                Low

              </span>

              <span>

                <i className="dot moderate" />

                Moderate

              </span>

              <span>

                <i className="dot high" />

                High

              </span>

              <span>

                <i className="dot critical" />

                Critical

              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            RISK ZONES PANEL
        ================================================= */}

        <section
          className="card zonesPanel"
        >

          <div className="zonesHeader">

            <div>

              <p className="eyebrow">
                LIVE DYNAMIC MONITOR
              </p>

              <h2>
                Risk Zones & Points
              </h2>

              <p>
                {locations.length}
                {' '}
                dynamically scanned points
              </p>

            </div>

            <MapIcon
              size={20}
              className="zonesHeaderIcon"
            />

          </div>


          {/* =================================================
              ZONE LIST
          ================================================= */}

          <div className="zoneList">

            {locations
              .slice()
              .sort(
                (
                  a,
                  b
                ) =>
                  Number(
                    b.riskScore || 0
                  ) -
                  Number(
                    a.riskScore || 0
                  )
              )
              .slice(
                0,
                100
              )
              .map(
                location => (

                  <button

                    key={
                      location.id ??
                      `${location.lat}-${location.lng}`
                    }

                    className={
                      'zoneItem ' +
                      (
                        selectedZone &&
                        sameId(
                          selectedZone.id,
                          location.id
                        )
                          ? 'selected'
                          : ''
                      )
                    }

                    onClick={() =>
                      selectZone(
                        location
                      )
                    }

                  >

                    <span

                      className="zoneColor"

                      style={{
                        background:
                          riskColor(
                            location.riskLevel
                          )
                      }}

                    />


                    <span
                      className="zoneInfo"
                    >

                      <b>

                        {getAreaName(
                          location
                        )}

                      </b>

                      <small>

                        {location.state ||
                          'Northeast India'}

                      </small>

                      <small>

                        {getRiskPointName(
                          location
                        )}

                      </small>

                    </span>


                    <span

                      className={
                        `zoneScore ${riskClass(
                          location.riskLevel
                        )}`
                      }

                    >

                      {location.riskScore ??
                        0}%

                    </span>

                  </button>

                )
              )}

          </div>


          {/* =================================================
              SELECTED LOCATION DETAILS
          ================================================= */}

          {selectedZone ? (

            <DynamicZoneDetails

              location={
                selectedZone
              }

              onSelect={
                onSelect
              }

              loading={
                selectedLoading
              }

            />

          ) : (

            <div
              className="zonePlaceholder"
            >

              <MapIcon
                size={34}
              />

              <b>
                Select a risk point
              </b>

              <span>

                Click a colored point or click anywhere on the map for an exact live report.

              </span>

            </div>

          )}

        </section>

      </div>

    </>
  );
}
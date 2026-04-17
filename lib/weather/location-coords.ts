/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

export interface LocationCoords {
  lat: number;
  lon: number;
  label: string;
}

/**
 * Server-only map from location key → coordinates.
 * Coordinates are never sent to the client. They are only used
 * server-side to fetch weather from Open-Meteo.
 */
export const LOCATION_COORDS: Record<string, LocationCoords> = {
  // Germany
  "de-berlin": { lat: 52.52, lon: 13.41, label: "Berlin" },
  "de-hamburg": { lat: 53.55, lon: 10.0, label: "Hamburg" },
  "de-munich": { lat: 48.14, lon: 11.58, label: "Munich" },
  "de-cologne": { lat: 50.94, lon: 6.96, label: "Cologne" },
  "de-frankfurt": { lat: 50.11, lon: 8.68, label: "Frankfurt" },
  "de-stuttgart": { lat: 48.78, lon: 9.18, label: "Stuttgart" },
  "de-dusseldorf": { lat: 51.23, lon: 6.77, label: "Düsseldorf" },
  "de-leipzig": { lat: 51.34, lon: 12.37, label: "Leipzig" },
  "de-dortmund": { lat: 51.51, lon: 7.47, label: "Dortmund" },
  "de-nuremberg": { lat: 49.45, lon: 11.08, label: "Nuremberg" },

  // France
  "fr-paris": { lat: 48.85, lon: 2.35, label: "Paris" },
  "fr-marseille": { lat: 43.3, lon: 5.37, label: "Marseille" },
  "fr-lyon": { lat: 45.75, lon: 4.85, label: "Lyon" },
  "fr-toulouse": { lat: 43.6, lon: 1.44, label: "Toulouse" },
  "fr-nice": { lat: 43.71, lon: 7.26, label: "Nice" },
  "fr-nantes": { lat: 47.22, lon: -1.55, label: "Nantes" },
  "fr-strasbourg": { lat: 48.58, lon: 7.75, label: "Strasbourg" },
  "fr-bordeaux": { lat: 44.84, lon: -0.58, label: "Bordeaux" },
  "fr-montpellier": { lat: 43.61, lon: 3.88, label: "Montpellier" },
  "fr-lille": { lat: 50.63, lon: 3.06, label: "Lille" },

  // Sweden
  "se-stockholm": { lat: 59.33, lon: 18.07, label: "Stockholm" },
  "se-gothenburg": { lat: 57.71, lon: 11.97, label: "Gothenburg" },
  "se-malmo": { lat: 55.6, lon: 13.0, label: "Malmö" },
  "se-uppsala": { lat: 59.86, lon: 17.64, label: "Uppsala" },
  "se-vasteras": { lat: 59.61, lon: 16.55, label: "Västerås" },
  "se-orebro": { lat: 59.27, lon: 15.22, label: "Örebro" },
  "se-linkoping": { lat: 58.41, lon: 15.62, label: "Linköping" },
  "se-helsingborg": { lat: 56.05, lon: 12.69, label: "Helsingborg" },
  "se-jonkoping": { lat: 57.78, lon: 14.16, label: "Jönköping" },
  "se-norrkoping": { lat: 58.59, lon: 16.18, label: "Norrköping" },

  // Spain
  "es-madrid": { lat: 40.42, lon: -3.7, label: "Madrid" },
  "es-barcelona": { lat: 41.39, lon: 2.15, label: "Barcelona" },
  "es-valencia": { lat: 39.47, lon: -0.38, label: "Valencia" },
  "es-seville": { lat: 37.39, lon: -5.99, label: "Seville" },
  "es-zaragoza": { lat: 41.65, lon: -0.89, label: "Zaragoza" },
  "es-malaga": { lat: 36.72, lon: -4.42, label: "Málaga" },
  "es-murcia": { lat: 37.98, lon: -1.13, label: "Murcia" },
  "es-palma": { lat: 39.57, lon: 2.65, label: "Palma" },
  "es-las-palmas": { lat: 28.1, lon: -15.41, label: "Las Palmas" },
  "es-bilbao": { lat: 43.26, lon: -2.93, label: "Bilbao" },

  // Portugal
  "pt-lisbon": { lat: 38.72, lon: -9.14, label: "Lisbon" },
  "pt-porto": { lat: 41.15, lon: -8.61, label: "Porto" },
  "pt-braga": { lat: 41.55, lon: -8.43, label: "Braga" },
  "pt-coimbra": { lat: 40.21, lon: -8.43, label: "Coimbra" },
  "pt-funchal": { lat: 32.65, lon: -16.91, label: "Funchal" },
  "pt-faro": { lat: 37.02, lon: -7.93, label: "Faro" },
  "pt-aveiro": { lat: 40.64, lon: -8.65, label: "Aveiro" },
  "pt-setubal": { lat: 38.52, lon: -8.89, label: "Setúbal" },
  "pt-evora": { lat: 38.57, lon: -7.91, label: "Évora" },
  "pt-guimaraes": { lat: 41.44, lon: -8.3, label: "Guimarães" },

  // Austria
  "at-vienna": { lat: 48.21, lon: 16.37, label: "Vienna" },
  "at-graz": { lat: 47.07, lon: 15.44, label: "Graz" },
  "at-linz": { lat: 48.31, lon: 14.29, label: "Linz" },
  "at-salzburg": { lat: 47.8, lon: 13.04, label: "Salzburg" },
  "at-innsbruck": { lat: 47.27, lon: 11.39, label: "Innsbruck" },
  "at-klagenfurt": { lat: 46.62, lon: 14.31, label: "Klagenfurt" },
  "at-wels": { lat: 48.16, lon: 14.03, label: "Wels" },
  "at-st-polten": { lat: 48.2, lon: 15.62, label: "St. Pölten" },
  "at-steyr": { lat: 48.04, lon: 14.42, label: "Steyr" },
  "at-feldkirch": { lat: 47.24, lon: 9.6, label: "Feldkirch" },

  // Switzerland
  "ch-zurich": { lat: 47.38, lon: 8.54, label: "Zurich" },
  "ch-geneva": { lat: 46.2, lon: 6.15, label: "Geneva" },
  "ch-basel": { lat: 47.56, lon: 7.59, label: "Basel" },
  "ch-bern": { lat: 46.95, lon: 7.44, label: "Bern" },
  "ch-lausanne": { lat: 46.52, lon: 6.63, label: "Lausanne" },
  "ch-winterthur": { lat: 47.5, lon: 8.72, label: "Winterthur" },
  "ch-lucerne": { lat: 47.05, lon: 8.31, label: "Lucerne" },
  "ch-st-gallen": { lat: 47.42, lon: 9.37, label: "St. Gallen" },
  "ch-lugano": { lat: 46.0, lon: 8.95, label: "Lugano" },
  "ch-biel": { lat: 47.14, lon: 7.25, label: "Biel/Bienne" },

  // England / UK
  "gb-london": { lat: 51.51, lon: -0.13, label: "London" },
  "gb-birmingham": { lat: 52.48, lon: -1.89, label: "Birmingham" },
  "gb-manchester": { lat: 53.48, lon: -2.24, label: "Manchester" },
  "gb-leeds": { lat: 53.8, lon: -1.55, label: "Leeds" },
  "gb-sheffield": { lat: 53.38, lon: -1.47, label: "Sheffield" },
  "gb-liverpool": { lat: 53.41, lon: -2.98, label: "Liverpool" },
  "gb-bristol": { lat: 51.45, lon: -2.6, label: "Bristol" },
  "gb-edinburgh": { lat: 55.95, lon: -3.19, label: "Edinburgh" },
  "gb-glasgow": { lat: 55.86, lon: -4.25, label: "Glasgow" },
  "gb-cardiff": { lat: 51.48, lon: -3.18, label: "Cardiff" },

  // Netherlands
  "nl-amsterdam": { lat: 52.37, lon: 4.9, label: "Amsterdam" },
  "nl-rotterdam": { lat: 51.92, lon: 4.48, label: "Rotterdam" },
  "nl-the-hague": { lat: 52.08, lon: 4.31, label: "The Hague" },
  "nl-utrecht": { lat: 52.09, lon: 5.12, label: "Utrecht" },
  "nl-eindhoven": { lat: 51.44, lon: 5.48, label: "Eindhoven" },
  "nl-tilburg": { lat: 51.56, lon: 5.09, label: "Tilburg" },
  "nl-groningen": { lat: 53.22, lon: 6.57, label: "Groningen" },
  "nl-almere": { lat: 52.37, lon: 5.22, label: "Almere" },
  "nl-breda": { lat: 51.59, lon: 4.78, label: "Breda" },
  "nl-nijmegen": { lat: 51.84, lon: 5.87, label: "Nijmegen" },

  // Belgium
  "be-brussels": { lat: 50.85, lon: 4.35, label: "Brussels" },
  "be-antwerp": { lat: 51.22, lon: 4.4, label: "Antwerp" },
  "be-ghent": { lat: 51.05, lon: 3.72, label: "Ghent" },
  "be-bruges": { lat: 51.21, lon: 3.22, label: "Bruges" },
  "be-liege": { lat: 50.63, lon: 5.57, label: "Liège" },
  "be-namur": { lat: 50.47, lon: 4.87, label: "Namur" },
  "be-leuven": { lat: 50.88, lon: 4.7, label: "Leuven" },
  "be-mons": { lat: 50.45, lon: 3.95, label: "Mons" },
  "be-aalst": { lat: 50.94, lon: 4.04, label: "Aalst" },
  "be-kortrijk": { lat: 50.83, lon: 3.26, label: "Kortrijk" },

  // Italy
  "it-rome": { lat: 41.9, lon: 12.49, label: "Rome" },
  "it-milan": { lat: 45.46, lon: 9.19, label: "Milan" },
  "it-naples": { lat: 40.85, lon: 14.27, label: "Naples" },
  "it-turin": { lat: 45.07, lon: 7.69, label: "Turin" },
  "it-palermo": { lat: 38.11, lon: 13.35, label: "Palermo" },
  "it-genoa": { lat: 44.41, lon: 8.93, label: "Genoa" },
  "it-bologna": { lat: 44.49, lon: 11.34, label: "Bologna" },
  "it-florence": { lat: 43.77, lon: 11.25, label: "Florence" },
  "it-bari": { lat: 41.12, lon: 16.87, label: "Bari" },
  "it-catania": { lat: 37.5, lon: 15.09, label: "Catania" },

  // Poland
  "pl-warsaw": { lat: 52.23, lon: 21.01, label: "Warsaw" },
  "pl-krakow": { lat: 50.06, lon: 19.94, label: "Kraków" },
  "pl-lodz": { lat: 51.77, lon: 19.46, label: "Łódź" },
  "pl-wroclaw": { lat: 51.11, lon: 17.04, label: "Wrocław" },
  "pl-poznan": { lat: 52.41, lon: 16.93, label: "Poznań" },
  "pl-gdansk": { lat: 54.35, lon: 18.65, label: "Gdańsk" },
  "pl-szczecin": { lat: 53.43, lon: 14.55, label: "Szczecin" },
  "pl-bydgoszcz": { lat: 53.12, lon: 18.0, label: "Bydgoszcz" },
  "pl-lublin": { lat: 51.25, lon: 22.57, label: "Lublin" },
  "pl-katowice": { lat: 50.26, lon: 19.02, label: "Katowice" },

  // Greece
  "gr-athens": { lat: 37.98, lon: 23.73, label: "Athens" },
  "gr-thessaloniki": { lat: 40.64, lon: 22.94, label: "Thessaloniki" },
  "gr-patras": { lat: 38.25, lon: 21.74, label: "Patras" },
  "gr-heraklion": { lat: 35.34, lon: 25.13, label: "Heraklion" },
  "gr-larissa": { lat: 39.64, lon: 22.42, label: "Larissa" },
  "gr-volos": { lat: 39.37, lon: 22.95, label: "Volos" },
  "gr-ioannina": { lat: 39.66, lon: 20.85, label: "Ioannina" },
  "gr-chania": { lat: 35.51, lon: 24.02, label: "Chania" },
  "gr-rhodes": { lat: 36.43, lon: 28.22, label: "Rhodes" },
  "gr-kavala": { lat: 40.94, lon: 24.4, label: "Kavala" },
};

/** Default fallback when no location is set or key is unknown. */
const DEFAULT_LOCATION: LocationCoords = {
  lat: 52.52,
  lon: 13.41,
  label: "Berlin",
};

export function getCoordsForLocation(locationKey: string): LocationCoords {
  return LOCATION_COORDS[locationKey] ?? DEFAULT_LOCATION;
}

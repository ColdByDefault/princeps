/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

/**
 * Client-safe city list for the location picker.
 * Contains only display data — no coordinates.
 * Cities are grouped by country, EU-focused.
 */
export interface LocationOption {
  /** Unique key used as the stored value (e.g. "de-berlin"). */
  value: string;
  /** Display label (city name). */
  label: string;
  /** Country group for the dropdown. */
  country: string;
}

export const LOCATION_OPTIONS: LocationOption[] = [
  // Germany
  { value: "de-berlin", label: "Berlin", country: "Germany" },
  { value: "de-hamburg", label: "Hamburg", country: "Germany" },
  { value: "de-munich", label: "Munich", country: "Germany" },
  { value: "de-cologne", label: "Cologne", country: "Germany" },
  { value: "de-frankfurt", label: "Frankfurt", country: "Germany" },
  { value: "de-stuttgart", label: "Stuttgart", country: "Germany" },
  { value: "de-dusseldorf", label: "Düsseldorf", country: "Germany" },
  { value: "de-leipzig", label: "Leipzig", country: "Germany" },
  { value: "de-dortmund", label: "Dortmund", country: "Germany" },
  { value: "de-nuremberg", label: "Nuremberg", country: "Germany" },

  // France
  { value: "fr-paris", label: "Paris", country: "France" },
  { value: "fr-marseille", label: "Marseille", country: "France" },
  { value: "fr-lyon", label: "Lyon", country: "France" },
  { value: "fr-toulouse", label: "Toulouse", country: "France" },
  { value: "fr-nice", label: "Nice", country: "France" },
  { value: "fr-nantes", label: "Nantes", country: "France" },
  { value: "fr-strasbourg", label: "Strasbourg", country: "France" },
  { value: "fr-bordeaux", label: "Bordeaux", country: "France" },
  { value: "fr-montpellier", label: "Montpellier", country: "France" },
  { value: "fr-lille", label: "Lille", country: "France" },

  // Sweden
  { value: "se-stockholm", label: "Stockholm", country: "Sweden" },
  { value: "se-gothenburg", label: "Gothenburg", country: "Sweden" },
  { value: "se-malmo", label: "Malmö", country: "Sweden" },
  { value: "se-uppsala", label: "Uppsala", country: "Sweden" },
  { value: "se-vasteras", label: "Västerås", country: "Sweden" },
  { value: "se-orebro", label: "Örebro", country: "Sweden" },
  { value: "se-linkoping", label: "Linköping", country: "Sweden" },
  { value: "se-helsingborg", label: "Helsingborg", country: "Sweden" },
  { value: "se-jonkoping", label: "Jönköping", country: "Sweden" },
  { value: "se-norrkoping", label: "Norrköping", country: "Sweden" },

  // Spain
  { value: "es-madrid", label: "Madrid", country: "Spain" },
  { value: "es-barcelona", label: "Barcelona", country: "Spain" },
  { value: "es-valencia", label: "Valencia", country: "Spain" },
  { value: "es-seville", label: "Seville", country: "Spain" },
  { value: "es-zaragoza", label: "Zaragoza", country: "Spain" },
  { value: "es-malaga", label: "Málaga", country: "Spain" },
  { value: "es-murcia", label: "Murcia", country: "Spain" },
  { value: "es-palma", label: "Palma", country: "Spain" },
  { value: "es-las-palmas", label: "Las Palmas", country: "Spain" },
  { value: "es-bilbao", label: "Bilbao", country: "Spain" },

  // Portugal
  { value: "pt-lisbon", label: "Lisbon", country: "Portugal" },
  { value: "pt-porto", label: "Porto", country: "Portugal" },
  { value: "pt-braga", label: "Braga", country: "Portugal" },
  { value: "pt-coimbra", label: "Coimbra", country: "Portugal" },
  { value: "pt-funchal", label: "Funchal", country: "Portugal" },
  { value: "pt-faro", label: "Faro", country: "Portugal" },
  { value: "pt-aveiro", label: "Aveiro", country: "Portugal" },
  { value: "pt-setubal", label: "Setúbal", country: "Portugal" },
  { value: "pt-evora", label: "Évora", country: "Portugal" },
  { value: "pt-guimaraes", label: "Guimarães", country: "Portugal" },

  // Austria
  { value: "at-vienna", label: "Vienna", country: "Austria" },
  { value: "at-graz", label: "Graz", country: "Austria" },
  { value: "at-linz", label: "Linz", country: "Austria" },
  { value: "at-salzburg", label: "Salzburg", country: "Austria" },
  { value: "at-innsbruck", label: "Innsbruck", country: "Austria" },
  { value: "at-klagenfurt", label: "Klagenfurt", country: "Austria" },
  { value: "at-wels", label: "Wels", country: "Austria" },
  { value: "at-st-polten", label: "St. Pölten", country: "Austria" },
  { value: "at-steyr", label: "Steyr", country: "Austria" },
  { value: "at-feldkirch", label: "Feldkirch", country: "Austria" },

  // Switzerland
  { value: "ch-zurich", label: "Zurich", country: "Switzerland" },
  { value: "ch-geneva", label: "Geneva", country: "Switzerland" },
  { value: "ch-basel", label: "Basel", country: "Switzerland" },
  { value: "ch-bern", label: "Bern", country: "Switzerland" },
  { value: "ch-lausanne", label: "Lausanne", country: "Switzerland" },
  { value: "ch-winterthur", label: "Winterthur", country: "Switzerland" },
  { value: "ch-lucerne", label: "Lucerne", country: "Switzerland" },
  { value: "ch-st-gallen", label: "St. Gallen", country: "Switzerland" },
  { value: "ch-lugano", label: "Lugano", country: "Switzerland" },
  { value: "ch-biel", label: "Biel/Bienne", country: "Switzerland" },

  // England / UK
  { value: "gb-london", label: "London", country: "England" },
  { value: "gb-birmingham", label: "Birmingham", country: "England" },
  { value: "gb-manchester", label: "Manchester", country: "England" },
  { value: "gb-leeds", label: "Leeds", country: "England" },
  { value: "gb-sheffield", label: "Sheffield", country: "England" },
  { value: "gb-liverpool", label: "Liverpool", country: "England" },
  { value: "gb-bristol", label: "Bristol", country: "England" },
  { value: "gb-edinburgh", label: "Edinburgh", country: "England" },
  { value: "gb-glasgow", label: "Glasgow", country: "England" },
  { value: "gb-cardiff", label: "Cardiff", country: "England" },

  // Netherlands
  { value: "nl-amsterdam", label: "Amsterdam", country: "Netherlands" },
  { value: "nl-rotterdam", label: "Rotterdam", country: "Netherlands" },
  { value: "nl-the-hague", label: "The Hague", country: "Netherlands" },
  { value: "nl-utrecht", label: "Utrecht", country: "Netherlands" },
  { value: "nl-eindhoven", label: "Eindhoven", country: "Netherlands" },
  { value: "nl-tilburg", label: "Tilburg", country: "Netherlands" },
  { value: "nl-groningen", label: "Groningen", country: "Netherlands" },
  { value: "nl-almere", label: "Almere", country: "Netherlands" },
  { value: "nl-breda", label: "Breda", country: "Netherlands" },
  { value: "nl-nijmegen", label: "Nijmegen", country: "Netherlands" },

  // Belgium
  { value: "be-brussels", label: "Brussels", country: "Belgium" },
  { value: "be-antwerp", label: "Antwerp", country: "Belgium" },
  { value: "be-ghent", label: "Ghent", country: "Belgium" },
  { value: "be-bruges", label: "Bruges", country: "Belgium" },
  { value: "be-liege", label: "Liège", country: "Belgium" },
  { value: "be-namur", label: "Namur", country: "Belgium" },
  { value: "be-leuven", label: "Leuven", country: "Belgium" },
  { value: "be-mons", label: "Mons", country: "Belgium" },
  { value: "be-aalst", label: "Aalst", country: "Belgium" },
  { value: "be-kortrijk", label: "Kortrijk", country: "Belgium" },

  // Italy
  { value: "it-rome", label: "Rome", country: "Italy" },
  { value: "it-milan", label: "Milan", country: "Italy" },
  { value: "it-naples", label: "Naples", country: "Italy" },
  { value: "it-turin", label: "Turin", country: "Italy" },
  { value: "it-palermo", label: "Palermo", country: "Italy" },
  { value: "it-genoa", label: "Genoa", country: "Italy" },
  { value: "it-bologna", label: "Bologna", country: "Italy" },
  { value: "it-florence", label: "Florence", country: "Italy" },
  { value: "it-bari", label: "Bari", country: "Italy" },
  { value: "it-catania", label: "Catania", country: "Italy" },

  // Poland (+1)
  { value: "pl-warsaw", label: "Warsaw", country: "Poland" },
  { value: "pl-krakow", label: "Kraków", country: "Poland" },
  { value: "pl-lodz", label: "Łódź", country: "Poland" },
  { value: "pl-wroclaw", label: "Wrocław", country: "Poland" },
  { value: "pl-poznan", label: "Poznań", country: "Poland" },
  { value: "pl-gdansk", label: "Gdańsk", country: "Poland" },
  { value: "pl-szczecin", label: "Szczecin", country: "Poland" },
  { value: "pl-bydgoszcz", label: "Bydgoszcz", country: "Poland" },
  { value: "pl-lublin", label: "Lublin", country: "Poland" },
  { value: "pl-katowice", label: "Katowice", country: "Poland" },

  // Greece (+2)
  { value: "gr-athens", label: "Athens", country: "Greece" },
  { value: "gr-thessaloniki", label: "Thessaloniki", country: "Greece" },
  { value: "gr-patras", label: "Patras", country: "Greece" },
  { value: "gr-heraklion", label: "Heraklion", country: "Greece" },
  { value: "gr-larissa", label: "Larissa", country: "Greece" },
  { value: "gr-volos", label: "Volos", country: "Greece" },
  { value: "gr-ioannina", label: "Ioannina", country: "Greece" },
  { value: "gr-chania", label: "Chania", country: "Greece" },
  { value: "gr-rhodes", label: "Rhodes", country: "Greece" },
  { value: "gr-kavala", label: "Kavala", country: "Greece" },
];

/** All unique location values — used for validation. */
export const VALID_LOCATIONS = new Set(LOCATION_OPTIONS.map((o) => o.value));

/** Ordered country keys for rendering groups in a consistent order. */
export const LOCATION_COUNTRIES = [
  "Germany",
  "France",
  "Sweden",
  "Spain",
  "Portugal",
  "Austria",
  "Switzerland",
  "England",
  "Netherlands",
  "Belgium",
  "Italy",
  "Poland",
  "Greece",
] as const;

/** Grouped by country — suitable for `<SelectGroup>`. */
export const LOCATION_OPTIONS_BY_COUNTRY: Record<string, LocationOption[]> =
  LOCATION_OPTIONS.reduce<Record<string, LocationOption[]>>((acc, opt) => {
    (acc[opt.country] ??= []).push(opt);
    return acc;
  }, {});

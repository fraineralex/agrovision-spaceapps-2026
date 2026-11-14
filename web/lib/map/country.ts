/* AI: Grok (xAI), 2026-11-14; Frainer review pending. */
export const COUNTRY_VIEW = {
  center: [-70.2, 18.8] as [number, number],
  zoom: 7.3,
  pitch: 45,
  bearing: -12,
};

export const VALLEY_VIEW = {
  center: [-71.27, 18.81] as [number, number],
  zoom: 12.4,
  pitch: 48,
  bearing: -16,
};

export type Province = {
  id: string;
  name: string;
  sourceName: string;
  lon: number;
  lat: number;
};

export const PROVINCE_SOURCE = "Natural Earth admin-1 (2022) via geoBoundaries gbOpen DOM ADM1, simplified geometry, public domain. Centers are polygon centroids for navigation, not an official cadastral point.";

export const provinces: Province[] = [
  { id: "azua", name: "Azua", sourceName: "Azua", lon: -70.834, lat: 18.58 },
  { id: "bahoruco", name: "Bahoruco", sourceName: "Bahoruco", lon: -71.33, lat: 18.514 },
  { id: "barahona", name: "Barahona", sourceName: "Barahona", lon: -71.21, lat: 18.171 },
  { id: "dajabon", name: "Dajabón", sourceName: "Dajabón", lon: -71.602, lat: 19.438 },
  { id: "distrito-nacional", name: "Distrito Nacional", sourceName: "Distrito Nacional", lon: -69.946, lat: 18.483 },
  { id: "duarte", name: "Duarte", sourceName: "Duarte", lon: -70.088, lat: 19.243 },
  { id: "el-seibo", name: "El Seibo", sourceName: "El Seybo", lon: -69.056, lat: 18.819 },
  { id: "espaillat", name: "Espaillat", sourceName: "Espaillat", lon: -70.394, lat: 19.538 },
  { id: "hato-mayor", name: "Hato Mayor", sourceName: "Hato Mayor", lon: -69.386, lat: 18.874 },
  { id: "hermanas-mirabal", name: "Hermanas Mirabal", sourceName: "Hermanas", lon: -70.367, lat: 19.409 },
  { id: "independencia", name: "Independencia", sourceName: "Independencia", lon: -71.629, lat: 18.424 },
  { id: "la-altagracia", name: "La Altagracia", sourceName: "La Altagracia", lon: -68.66, lat: 18.584 },
  { id: "elias-pina", name: "Elías Piña", sourceName: "La Estrelleta", lon: -71.6, lat: 19.005 },
  { id: "la-romana", name: "La Romana", sourceName: "La Romana", lon: -68.978, lat: 18.509 },
  { id: "la-vega", name: "La Vega", sourceName: "La Vega", lon: -70.632, lat: 19.052 },
  { id: "maria-trinidad-sanchez", name: "María Trinidad Sánchez", sourceName: "María Trinidad Sánchez", lon: -69.984, lat: 19.444 },
  { id: "monsenor-nouel", name: "Monseñor Nouel", sourceName: "Monseñor Nouel", lon: -70.418, lat: 18.893 },
  { id: "monte-cristi", name: "Monte Cristi", sourceName: "Monte Cristi", lon: -71.444, lat: 19.722 },
  { id: "monte-plata", name: "Monte Plata", sourceName: "Monte Plata", lon: -69.805, lat: 18.833 },
  { id: "pedernales", name: "Pedernales", sourceName: "Pedernales", lon: -71.533, lat: 17.968 },
  { id: "peravia", name: "Peravia", sourceName: "Peravia", lon: -70.373, lat: 18.333 },
  { id: "puerto-plata", name: "Puerto Plata", sourceName: "Puerto Plata", lon: -70.801, lat: 19.744 },
  { id: "samana", name: "Samaná", sourceName: "Samaná", lon: -69.5, lat: 19.233 },
  { id: "san-cristobal", name: "San Cristóbal", sourceName: "San Cristóbal", lon: -70.21, lat: 18.522 },
  { id: "san-jose-de-ocoa", name: "San José de Ocoa", sourceName: "San José de Ocoa", lon: -70.498, lat: 18.611 },
  { id: "san-juan", name: "San Juan", sourceName: "San Juan", lon: -71.286, lat: 18.88 },
  { id: "san-pedro-de-macoris", name: "San Pedro de Macorís", sourceName: "San Pedro de Macorís", lon: -69.369, lat: 18.547 },
  { id: "sanchez-ramirez", name: "Sánchez Ramírez", sourceName: "Sánchez Ramírez", lon: -70.145, lat: 19.018 },
  { id: "santiago", name: "Santiago", sourceName: "Santiago", lon: -70.903, lat: 19.324 },
  { id: "santiago-rodriguez", name: "Santiago Rodríguez", sourceName: "Santiago Rodríguez", lon: -71.31, lat: 19.383 },
  { id: "santo-domingo", name: "Santo Domingo", sourceName: "Santo Domingo", lon: -69.861, lat: 18.565 },
  { id: "valverde", name: "Valverde", sourceName: "Valverde", lon: -71.035, lat: 19.582 },
];

export function inDominicanRepublic(lon: number, lat: number) {
  return lon >= -72.05 && lon <= -68.25 && lat >= 17.45 && lat <= 19.95;
}

export function filterProvinces(query: string) {
  const needle = query.trim().toLocaleLowerCase("es");
  if (!needle) return provinces;
  return provinces.filter((item) => item.name.toLocaleLowerCase("es").includes(needle) || item.sourceName.toLocaleLowerCase("es").includes(needle));
}

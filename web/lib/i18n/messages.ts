/* AI: Codex gpt-6.1-terra (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
/** Stable identifiers keep presentation translations separate from crop scoring. */
export const messages = {
  en: {
    onboarding: {"dialog":"Tell us about your farm","back":"← Back","skip":"Skip","where":"Where is your farm?","nearby":"Choose a nearby place. You can mark your farm on the map later.","gps":"Use my location","manual":"or search manually","search":"Search for a place in the Dominican Republic","example":"E.g. Pedro Brand","frequent":"Common farming areas","searching":"Searching for places…","unavailable":"The catalog could not be loaded. Search by province or use the map.","none":"We could not find that place.","gpsUnsupported":"Your device cannot provide a location. Enter your community or province.","gpsSearching":"Finding your location…","gpsOutside":"Your location is outside the Dominican Republic. Enter your community or province.","gpsError":"Could not get your location. Enter your community or province."},
    common: { language: "Language", title: "AgroVision | Dominican Republic", description: "Check rainfall, plan your planting, and calculate the minimum price needed to cover your farm costs in the Dominican Republic.", sunlightMode: "Sunlight mode", offlineReady: "Ready to use offline", offlineUsing: "Offline: using saved data", myFarms: "My farms", chooseFarm: "Choose a farm", addFarm: "Add farm", unmapped: "not marked on the map", edit: "Edit", confirmDelete: "Yes, delete", no: "No", delete: "Delete" },
    crops: {
      ajo: "Garlic", habichuela_roja: "Red beans", habichuela_negra: "Black beans",
      maiz: "Maize", arroz: "Rice", batata: "Sweet potato", yuca: "Cassava",
      platano: "Plantain", guineo: "Banana", mani: "Peanut", tomate: "Tomato",
      cebolla: "Onion", aji: "Pepper", auyama: "Squash", papa: "Potato",
      pepino: "Cucumber", berenjena: "Eggplant", repollo: "Cabbage", zanahoria: "Carrot",
      pina: "Pineapple", cafe: "Coffee", cacao: "Cocoa", aguacate: "Avocado",
    },
  },
  es: {
    onboarding: {"dialog":"Cuéntanos de tu finca","back":"← Atrás","skip":"Saltar","where":"¿Dónde está tu finca?","nearby":"Elige un lugar cercano. Puedes marcar tu finca en el mapa después.","gps":"Usar mi ubicación","manual":"o busca manualmente","search":"Busca un lugar en RD","example":"Ej.: Pedro Brand","frequent":"Zonas agrícolas frecuentes","searching":"Buscando lugares…","unavailable":"No se pudo cargar el catálogo. Puedes buscar por provincia o usar el mapa.","none":"No encontramos ese lugar.","gpsUnsupported":"Tu teléfono no permite ubicación. Escribe tu comunidad o provincia.","gpsSearching":"Buscando tu ubicación…","gpsOutside":"Tu ubicación no está en República Dominicana. Escribe tu comunidad o provincia.","gpsError":"No se pudo obtener tu ubicación. Escribe tu comunidad o provincia."},
    common: { language: "Idioma", title: "AgroVision | República Dominicana", description: "Consulta la lluvia, organiza tu siembra y calcula el precio mínimo para cubrir tus gastos en el campo dominicano.", sunlightMode: "Modo sol", offlineReady: "Lista para usar sin internet", offlineUsing: "Sin internet: usando datos guardados", myFarms: "Mis fincas", chooseFarm: "Elige una finca", addFarm: "Agregar finca", unmapped: "sin marcar en el mapa", edit: "Editar", confirmDelete: "Sí, borrar", no: "No", delete: "Borrar" },
    crops: {
      ajo: "Ajo", habichuela_roja: "Habichuela roja", habichuela_negra: "Habichuela negra",
      maiz: "Maíz", arroz: "Arroz", batata: "Batata", yuca: "Yuca",
      platano: "Plátano", guineo: "Guineo", mani: "Maní", tomate: "Tomate",
      cebolla: "Cebolla", aji: "Ají", auyama: "Auyama", papa: "Papa",
      pepino: "Pepino", berenjena: "Berenjena", repollo: "Repollo", zanahoria: "Zanahoria",
      pina: "Piña", cafe: "Café", cacao: "Cacao", aguacate: "Aguacate",
    },
  },
} as const;

export type Locale = keyof typeof messages;

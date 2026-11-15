/* AI: Codex gpt-6.1-terra (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
/** Stable identifiers keep presentation translations separate from crop scoring. */
export const messages = {
  en: {
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

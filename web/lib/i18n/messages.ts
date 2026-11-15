/* AI: Codex gpt-6.1-terra (OpenAI), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
/** Stable identifiers keep presentation translations separate from crop scoring. */
export const messages = {
  en: {
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

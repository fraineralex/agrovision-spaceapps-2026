/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */

type Pest = { name: string; taxon?: string; external?: boolean };
type PestEntry = { name: string; pests: readonly Pest[]; sources: readonly number[] };

export const pestSources: readonly [string, string][] = [
  [
    "Guía dominicana de arroz",
    "https://intranet.cedaf.org.do/digital/arroz_cedaf.pdf"
  ],
  [
    "Diagnóstico fitosanitario dominicano",
    "https://wp.sodiaf.org.do/publicaciones/wp-content/uploads/2023/02/Diagnostico_Fitosanitario.pdf"
  ],
  [
    "Estudio en Puerto Rico",
    "https://utia.tennessee.edu/aplu/wp-content/uploads/sites/95/2022/02/Institutional-Updates-Feb-2022.pdf"
  ],
  [
    "Ministerio de Agricultura, veda en Azua",
    "https://agricultura.gob.do/noticia/inician-veda-de-hospederos-mosca-blanca-y-trips-en-azua/"
  ],
  [
    "Ministerio de Medio Ambiente",
    "https://ambiente.gob.do/app/uploads/2016/10/Estretegia-Nacional.pdf"
  ],
  [
    "Índice fitosanitario dominicano",
    "https://es.scribd.com/document/619455837/Ndice-de-Plagas-y-Enfermedades"
  ],
  [
    "Guía dominicana de yuca",
    "https://wp.sodiaf.org.do/publicaciones/wp-content/uploads/2023/02/Gua-Tcnica-para-la-Produccin-de-Yuca.pdf"
  ],
  [
    "Estudio del IDIAF en San Juan",
    "https://sodiaf.org.do/apf/index.php/apf/es/article/view/85"
  ],
  [
    "Revisión sobre la papa dominicana",
    "https://www.researchgate.net/publication/396161503_Cultivo_de_papa_y_su_problemas_fitosanitarios_en_la_Rep_Dominicana_2025"
  ],
  [
    "Guía dominicana de yautía",
    "https://intranet.cedaf.org.do/publicaciones/guias/download/yautia.pdf"
  ],
  [
    "Universidad de Panamá",
    "https://up-rid.up.ac.pa/1494/3/zulay_achurra.pdf"
  ],
  [
    "Ministerio de Agricultura, sanidad vegetal",
    "https://agricultura.gob.do/noticia/rd-refuerza-programas-sanidad-vegetal/"
  ],
  [
    "Ministerio de Agricultura, vigilancia en Ocoa",
    "https://agricultura.gob.do/noticia/agricultura-promueve-uso-insectos-beneficos-para-eliminar-plagas-endemicas-en-ocoa/"
  ],
  [
    "Reporte de distribución del ácaro rojo",
    "https://mida.gob.pa/direcciones/direccion-nacional-de-sanidad-vegetal/alertas-fitosanitarias/"
  ],
  [
    "Ministerio de Agricultura, reportes regionales",
    "https://agricultura.gob.do/transparencia/wp-content/uploads/2023/02/ENFERM1.pdf"
  ],
  [
    "Ministerio de Agricultura, HLB de los cítricos",
    "https://agricultura.gob.do/noticia/agricultura-instala-8-modernos-invernaderos-para-producir-dos-millones-de-plantulas-de-citricos-de-alto-valor-genetico/"
  ],
  [
    "UF/IFAS, plagas de la caña",
    "https://ask.ifas.ufl.edu/publication/ig065"
  ],
  [
    "Guía dominicana de cacao",
    "https://cedaf.org.do/wp-content/uploads/2022/08/cacao.pdf"
  ],
  [
    "INDOCAFÉ",
    "https://indocafe.gob.do/index.php/en/despacho/itemlist/user/369-harrypimentel"
  ],
  [
    "UF/IFAS, gusano cornudo",
    "https://ask.ifas.ufl.edu/publication/IN1187"
  ]
];

const entries = {
  arroz: {"name": "Arroz", "pests": [{"name": "Sogata", "taxon": "Tagosodes orizicolus"}, {"name": "Ácaro del vaneo", "taxon": "Steneotarsonemus spinki"}], "sources": [0]},
  maiz: {"name": "Maíz", "pests": [{"name": "Gusano cogollero", "taxon": "Spodoptera frugiperda"}, {"name": "Gusano de la mazorca", "taxon": "Helicoverpa zea", "external": true}], "sources": [1, 2]},
  habichuela_roja: {"name": "Habichuela roja", "pests": [{"name": "Mosca blanca", "taxon": "Bemisia tabaci"}, {"name": "Nematodos agalladores", "taxon": "Meloidogyne"}], "sources": [3, 4]},
  guandul: {"name": "Guandul", "pests": [{"name": "Nematodos agalladores", "taxon": "Meloidogyne"}, {"name": "Perforador de vainas", "taxon": "Chloridea virescens", "external": true}], "sources": [4, 2]},
  platano: {"name": "Plátano", "pests": [{"name": "Picudo negro", "taxon": "Cosmopolites sordidus"}, {"name": "Nematodo barrenador de raíces", "taxon": "Radopholus similis"}], "sources": [5]},
  yuca: {"name": "Yuca", "pests": [{"name": "Gusano de flota", "taxon": "Erinnyis ello"}, {"name": "Ácaros", "taxon": "Mononychellus"}, {"name": "Ácaros", "taxon": "Tetranychus"}, {"name": "Chinche de encaje", "taxon": "Vatiga"}], "sources": [6]},
  batata: {"name": "Batata", "pests": [{"name": "Piogán o gorgojo de la batata", "taxon": "Cylas formicarius"}], "sources": [7]},
  papa: {"name": "Papa", "pests": [{"name": "Polilla de la papa", "taxon": "Phthorimaea operculella"}, {"name": "Moscas minadoras", "taxon": "Liriomyza"}], "sources": [1, 8]},
  yautia: {"name": "Yautía", "pests": [{"name": "Nematodos agalladores", "taxon": "Meloidogyne"}, {"name": "Nematodos espirales", "taxon": "Helicotylenchus"}, {"name": "Nematodo del cormo", "taxon": "Scutellonema bradys"}], "sources": [9]},
  name: {"name": "Ñame", "pests": [{"name": "Nematodos agalladores", "taxon": "Meloidogyne"}, {"name": "Nematodo de la pudrición seca", "taxon": "Scutellonema bradys", "external": true}], "sources": [4, 10]},
  tomate: {"name": "Tomate", "pests": [{"name": "Mosca blanca", "taxon": "Bemisia tabaci"}, {"name": "Moscas minadoras", "taxon": "Liriomyza"}], "sources": [1]},
  cebolla: {"name": "Cebolla", "pests": [{"name": "Trips de la cebolla", "taxon": "Thrips tabaci"}], "sources": [5]},
  aji: {"name": "Ají", "pests": [{"name": "Picudo del ají", "taxon": "Anthonomus eugenii"}, {"name": "Trips"}], "sources": [11, 12]},
  auyama: {"name": "Auyama", "pests": [{"name": "Gusano barrenador de cucurbitáceas", "taxon": "Diaphania nitidalis"}], "sources": [1]},
  repollo: {"name": "Repollo", "pests": [{"name": "Polilla dorso de diamante", "taxon": "Plutella xylostella"}], "sources": [1]},
  aguacate: {"name": "Aguacate", "pests": [{"name": "Chinche de encaje del aguacate", "taxon": "Pseudacysta perseae"}], "sources": [5]},
  mango: {"name": "Mango", "pests": [{"name": "Mosca de la fruta del mango", "taxon": "Anastrepha obliqua"}], "sources": [11]},
  pina: {"name": "Piña", "pests": [{"name": "Cochinilla harinosa de la piña", "taxon": "Dysmicoccus brevipes"}], "sources": [5]},
  coco: {"name": "Coco", "pests": [{"name": "Ácaro rojo de las palmas", "taxon": "Raoiella indica"}, {"name": "Abejón del coco", "taxon": "Strategus"}], "sources": [13, 5]},
  lechosa: {"name": "Lechosa", "pests": [{"name": "Cochinilla de la lechosa", "taxon": "Paracoccus marginatus"}], "sources": [14]},
  limon: {"name": "Limón", "pests": [{"name": "Psílido asiático de los cítricos (vector del HLB)", "taxon": "Diaphorina citri"}, {"name": "Minador de los cítricos", "taxon": "Phyllocnistis citrella"}], "sources": [15, 5]},
  cana: {"name": "Caña de azúcar", "pests": [{"name": "Barrenador del tallo", "taxon": "Diatraea saccharalis"}, {"name": "Vaquita de la caña", "taxon": "Diaprepes abbreviatus"}], "sources": [5, 16]},
  cacao: {"name": "Cacao", "pests": [{"name": "Trips"}, {"name": "Cochinillas harinosas"}, {"name": "Gusanos defoliadores"}], "sources": [17]},
  cafe: {"name": "Café", "pests": [{"name": "Broca del café", "taxon": "Hypothenemus hampei"}, {"name": "Minador de la hoja", "taxon": "Leucoptera coffeella"}], "sources": [18]},
  tabaco: {"name": "Tabaco", "pests": [{"name": "Gusano cornudo", "taxon": "Manduca sexta"}, {"name": "Gusano de las yemas", "taxon": "Chloridea virescens"}], "sources": [5, 19]},
} satisfies Record<string, PestEntry>;

export const pestCatalog = {
  ...entries,
  habichuela_negra: { ...entries.habichuela_roja, name: "Habichuela negra" },
  guineo: { ...entries.platano, name: "Guineo" },
};

export type PestCrop = keyof typeof pestCatalog;

export function pestsFor(crop: string): PestEntry | undefined {
  return Object.hasOwn(pestCatalog, crop) ? pestCatalog[crop as PestCrop] : undefined;
}

export const pestLimit = "La lista indica qué vigilar. La presencia y la importancia de cada plaga dependen de la finca, la zona y la época. † Referencia externa pendiente de confirmar localmente.";

export function sharedPests(previous: string, crop: string) {
  const before = pestsFor(previous)?.pests ?? [];
  return (pestsFor(crop)?.pests ?? []).filter(pest =>
    pest.taxon && before.some(other => other.taxon === pest.taxon)
  ).map(pest => ({
    ...pest,
    external: Boolean(pest.external || before.some(other => other.taxon === pest.taxon && other.external)),
  }));
}

export function pestPrecautions(previous: string, crop: string): string[] {
  const candidate = pestsFor(crop);
  if (!candidate) return [];
  const shared = sharedPests(previous, crop);
  const before = pestsFor(previous);
  const sharedNames = shared.map(p => p.name.toLowerCase() + (p.external ? " (por confirmar localmente)" : ""));
  const messages: string[] = [];
  if (before && sharedNames.length) {
    messages.push(`Antes de sembrar ${candidate.name.toLowerCase()}, revisa si hubo ${sharedNames.join(", ")} en ${before.name.toLowerCase()}. Si observaste daño, confirma la plaga con tu técnico antes de repetir un hospedero.`);
  }
  const next = candidate.pests.find(p => !p.external && !shared.some(other => other.taxon && other.taxon === p.taxon));
  if (next) {
    const action = next.name.toLowerCase().includes("nematodo")
      ? "Si hubo plantas débiles o raíces dañadas, consulta si hace falta analizar raíces o suelo."
      : "Revisa las plantas desde el establecimiento y consulta a tu técnico si ves daño.";
    messages.push(`En ${candidate.name.toLowerCase()}, vigila ${next.name.toLowerCase()}. ${action}`);
  }
  if (!messages.length && candidate.pests.length) messages.push("Consulta con tu técnico qué plagas del cultivo conviene vigilar en tu zona y época de siembra.");
  return messages;
}

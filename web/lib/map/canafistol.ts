/* AI: OpenAI, 2026-11-15. Coordinates transcribed from the user's Google Earth AOI; Frainer review pending. */
export const CANAFISTOL_CENTER: [number, number] = [-71.2534, 18.8944];
export const CANAFISTOL_BOUNDS: [[number, number], [number, number]] = [
  [-71.25915, 18.88745],
  [-71.24725, 18.89815],
];

// Purchased imagery AOI as drawn by the user in Google Earth. This marks the
// acquisition area only; it is not a farm boundary or a cadastral parcel.
export const CANAFISTOL_AOI: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: { name: "Purchased imagery area", status: "delivery pending" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [-71.25834529733268, 18.89798961284101],
      [-71.25897016739086, 18.89026015938751],
      [-71.25539411432659, 18.88814098282268],
      [-71.25199554659063, 18.88756956762435],
      [-71.24906937226795, 18.88984552321061],
      [-71.24745894424625, 18.89627679225734],
      [-71.25834529733268, 18.89798961284101],
    ]],
  },
};

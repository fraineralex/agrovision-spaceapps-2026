<!-- Asistencia IA: Codex (OpenAI), 2026-11-14; revisión por Frainer pendiente. -->
# Límites aproximados de campos

Pipeline CPU separado de `scripts/ml/` y de los componentes web. Produce
candidatos de campos a partir de imagen real; **no catastro ni inventario
exhaustivo de fincas**. Método, fuentes y límites:
[`docs/12_field_boundaries_method.md`](../../docs/12_field_boundaries_method.md).

## Entorno reproducible

Python 3.11, 8 CPU disponibles, 4 hilos de PyTorch usados. Instalar primero
PyTorch CPU evita descargar dependencias CUDA a través de `timm`:

```bash
uv venv --python 3.11 /tmp/agrovision-fields-venv
uv pip install --python /tmp/agrovision-fields-venv/bin/python \
  torch==2.15.0+cpu torchvision==0.29.2+cpu \
  --index-url https://download.pytorch.org/whl/cpu
uv pip install --python /tmp/agrovision-fields-venv/bin/python \
  -r scripts/fields/requirements.txt
curl -fL https://raw.githubusercontent.com/ChaoningZhang/MobileSAM/f706ad9c4eb7f219c00d9050e46328518ffb65d2/weights/mobile_sam.pt \
  -o /tmp/mobile_sam.pt
```

Se llama directamente a MobileSAM para evitar dependencias de notebook y
servicios adicionales de `samgeo`; es el mismo generador automático de máscaras.

## Adquisición explícita (requiere red)

Revisar las condiciones de Esri enlazadas en la metodología antes de ampliar o
redistribuir la caché. Archivos crudos locales ignorados por Git; metadatos y
hashes versionados. WorldCover se conserva a 10 m, sin inventar detalle fino.

```bash
/tmp/agrovision-fields-venv/bin/python scripts/fields/acquire.py \
  --bbox -71.29 18.76 -71.22 18.83 --name san_juan_core
/tmp/agrovision-fields-venv/bin/python scripts/fields/landcover.py
OMP_NUM_THREADS=4 /tmp/agrovision-fields-venv/bin/python \
  scripts/fields/delineate.py --checkpoint /tmp/mobile_sam.pt --max-minutes 25
```

Cada ventana completada se guarda en `data/cache/fields/attempts/`, por lo que
una interrupción no obliga a repetir inferencia. El límite de tiempo se comprueba
entre ventanas. El reporte indica si terminó todas las ventanas; no presentar una
ejecución parcial como cobertura completa. Para ampliar, usar otro `--name` en
los tres scripts; no sobrescribir la adquisición de una ejecución anterior.

## Reconstrucción offline y verificación

Con la caché local original puede reconstruirse sin nuevas solicitudes ni
inferencia. `--export-only` no necesita cargar PyTorch ni los pesos. Las salidas
GeoJSON y el PNG versionados se pueden consumir offline desde un clon sin caché
de imágenes; no requiere reconstruirlos para la demo.

```bash
/tmp/agrovision-fields-venv/bin/python scripts/fields/delineate.py --export-only
/tmp/agrovision-fields-venv/bin/python scripts/fields/validate.py
```

Salidas: `data/derived/fields_san_juan.geojson`,
`web/public/data/fields_san_juan.geojson` (<3 MB),
`data/derived/fields_preview.png` y `data/derived/fields_report.json`.
El área y centroide del archivo web corresponden al polígono completo; no
recalcular el área sobre grados ni usar la puntuación de máscara como certeza
de propiedad. No se cambian componentes UI ni manifiestos de otro agente.

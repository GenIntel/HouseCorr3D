# Assets for the HouseCorr3D project page

The site works **right now** with styled placeholders and a stylized SVG demo.
Drop the real files below into this folder and they appear automatically — no code changes needed
(each `<img>` swaps in on load; the placeholder only shows when a file is missing).

## Image slots

| File | Used in | Suggested size / aspect | From the paper |
|------|---------|--------------------------|----------------|
| `teaser.png` | Hero + social preview | ~1600×900, 16∶9 (`.gif` welcome) | Fig. 1 — correspondences across instances |
| `task.png` | The Task section | ~1400×800 | Fig. 3a — camera-space correspondence setup |
| `dataset.png` | Benchmark section | ~1600×900 | Fig. 2 — keypoints on CAD meshes |
| `pipeline.png` | Method section | ~1600×800 | Fig. 3b — Morpheus pipeline |
| `qualitative_baselines.png` | Results before/after slider | same size as the next | Fig. 4 — DINOv2 / GenPose++ / MagicPony |
| `qualitative_morpheus.png` | Results before/after slider | **identical dimensions** to the file above | Fig. 4 — Morpheus |

Notes
- `teaser.png` doubles as the social-share (Open Graph) image.
- The two `qualitative_*` images drive the wipe slider — give them the **same width and height**
  so the wipe lines up. Once both exist, the slider activates automatically.
- PNG or JPG both fine; keep files reasonably small (< ~500 KB each) for fast loads.

## Interactive demo data — `demo/pairs.json`

By default this is an empty array `[]`, so the demo renders the built-in stylized SVG objects
(Mug, Bottle). To upgrade it to **real image pairs**, fill `demo/pairs.json` with entries in the
format shown in `demo/pairs.example.json`:

```jsonc
[
  {
    "name": "Mug",                 // shown in the category dropdown
    "category": "mug",
    "query":  {
      "image": "assets/demo/mug_q.png",
      "w": 512, "h": 512,          // natural pixel size of the image
      "keypoints": [
        { "id": "rim_front", "label": "front rim", "color": "#35e0d4", "x": 240, "y": 120 },
        { "id": "handle",    "label": "handle",    "color": "#9b8cff", "x": 410, "y": 250 },
        { "id": "rim_back",  "label": "back rim",  "color": "#f9776a", "x": 250, "y": 96, "amodal": true }
      ]
    },
    "target": {
      "image": "assets/demo/mug_t.png",
      "w": 512, "h": 512,
      "keypoints": [
        { "id": "rim_front", "label": "front rim", "color": "#35e0d4", "x": 300, "y": 150 },
        { "id": "handle",    "label": "handle",    "color": "#9b8cff", "x": 470, "y": 300 },
        { "id": "rim_back",  "label": "back rim",  "color": "#f9776a", "x": 305, "y": 120, "amodal": true }
      ]
    }
  }
]
```

Rules
- `x`/`y` are pixel coordinates **in the image's own resolution** (`w`×`h`); the page rescales
  them to fit each panel.
- Keypoints with the **same `id`** in `query` and `target` are treated as a correspondence pair.
- Set `"amodal": true` for occluded keypoints — they appear only when "Show amodal" is on and
  render with a dashed link.

## TODO for maintainers
- Replace the **Dataset** button URL in `index.html` (currently points to the GitHub repo).
- Verify the arXiv ID `2605.28257` once the paper is public.

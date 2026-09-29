import sys
from pathlib import Path
import cairosvg
from PIL import Image

if len(sys.argv) != 3:
    raise SystemExit("usage: prepare-android-launcher.py <android-res-dir> <app-id>")

res = Path(sys.argv[1])
app_id = sys.argv[2]
root = Path(__file__).resolve().parent.parent
svg = root / "public" / "logos" / f"{app_id}.svg"
if not svg.exists():
    raise SystemExit(f"Missing SVG launcher source for {app_id}: {svg}")

sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in sizes.items():
    target_dir = res / folder
    target_dir.mkdir(parents=True, exist_ok=True)
    raw = target_dir / f".{app_id}-{size}.png"
    cairosvg.svg2png(url=str(svg), write_to=str(raw), output_width=size, output_height=size)
    image = Image.open(raw).convert("RGBA")
    for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
        image.save(target_dir / name, format="PNG", optimize=True)
    raw.unlink(missing_ok=True)

print(f"Prepared valid Android launcher PNGs for {app_id}")

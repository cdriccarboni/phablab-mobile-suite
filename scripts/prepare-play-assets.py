import json
import os
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
play = json.loads((ROOT / "play-app.json").read_text(encoding="utf-8"))
app_id = play["id"]
out = ROOT / "release" / "play" / app_id
out.mkdir(parents=True, exist_ok=True)

store = ROOT / "store" / "play" / app_id
icon_existing = store / "icon-512.png"
feature_existing = store / "feature-1024x500.png"

if icon_existing.exists():
    shutil.copy2(icon_existing, out / "icon-512.png")
else:
    src = ROOT / "public" / "logos" / f"{app_id}.png"
    if not src.exists():
        raise SystemExit(f"Missing logo for {app_id}")
    logo = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", (512, 512), (20, 24, 32, 255))
    logo.thumbnail((360, 360), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((512-logo.width)//2, (512-logo.height)//2))
    canvas.convert("RGB").save(out / "icon-512.png", quality=95)

if feature_existing.exists():
    shutil.copy2(feature_existing, out / "feature-1024x500.png")
else:
    icon = Image.open(out / "icon-512.png").convert("RGBA")
    feature = Image.new("RGBA", (1024, 500), (20, 24, 32, 255))
    icon.thumbnail((360, 360), Image.Resampling.LANCZOS)
    feature.alpha_composite(icon, (80, (500-icon.height)//2))
    draw = ImageDraw.Draw(feature)
    draw.text((500, 180), play["name"], fill=(255,255,255,255))
    draw.text((500, 230), play["listing"]["shortDescription"], fill=(215,215,220,255))
    feature.convert("RGB").save(out / "feature-1024x500.png", quality=95)

(out / "listing.json").write_text(json.dumps(play, ensure_ascii=False, indent=2), encoding="utf-8")

#!/usr/bin/env python3
"""Icônes Play et mipmaps propres à chaque app P2, à partir de apps.json."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
catalog = {app["id"]: app for app in json.loads((ROOT / "apps.json").read_text())}
emoji_font = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109)
title_font = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Bold.ttf", 64)
sub_font = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Regular.ttf", 28)
small_font = ImageFont.truetype("/usr/share/fonts/truetype/macos/Inter-Regular.ttf", 22)

BRAND = {
    "wallcheck": ("#1E3A2F", "Mesurez ce qu'un mur ou une porte arrête vraiment, avec deux téléphones."),
    "captioncast": ("#10243A", "Parlez sur un téléphone, lisez les sous-titres en direct sur l'autre."),
    "signme": ("#1A1C24", "Un téléphone de secours devient un panneau d'affichage à distance."),
    "lagcheck": ("#241838", "Mesurez le décalage entre le son et l'image en quelques secondes."),
    "tapback": ("#0E332C", "Un bouton ici, l'autre téléphone vibre et clignote."),
    "papercheck": ("#1C2E24", "Photographiez une liste papier, cochez-la sur votre téléphone."),
    "comparesound": ("#2A2416", "Avant, après : entendez et mesurez la différence acoustique."),
    "showmethat": ("#3A1824", "Prenez une photo, elle s'affiche en plein écran sur l'autre téléphone."),
    "counttogether": ("#15243E", "Un seul compteur partagé et synchronisé sur plusieurs téléphones."),
    "phablabphone": ("#123028", "Un labo de poche : micro, inclinaison, mouvement et son de votre téléphone."),
    "framematch": ("#2C2618", "Superposez une photo de référence pour retrouver exactement le même cadrage."),
    "relaytap": ("#3A2412", "Testez vos réflexes : signal aléatoire, tapez le plus vite, classement."),
}
DENSITIES = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}

def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i+2], 16) for i in (0, 2, 4))

def emoji_image(emoji, size):
    canvas = Image.new("RGBA", (140, 140), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.text((16, 16), emoji, font=emoji_font, embedded_color=True)
    bbox = canvas.getbbox()
    glyph = canvas.crop(bbox) if bbox else canvas
    return glyph.resize((size, size), Image.Resampling.LANCZOS)

def square_icon(emoji, bg, size):
    image = Image.new("RGBA", (size, size), hex_rgb(bg) + (255,))
    glyph = emoji_image(emoji, int(size * 0.62))
    image.alpha_composite(glyph, ((size - glyph.width) // 2, (size - glyph.height) // 2))
    return image

def feature_graphic(emoji, bg, name, subtitle):
    image = Image.new("RGB", (1024, 500), hex_rgb(bg))
    draw = ImageDraw.Draw(image)
    accent = tuple(min(255, c + 28) for c in hex_rgb(bg))
    draw.rectangle((0, 0, 360, 500), fill=accent)
    icon = square_icon(emoji, bg, 280)
    image.paste(icon, (40, 110))
    draw.text((400, 150), name, font=title_font, fill=(255, 255, 255))
    # Wrap subtitle to two lines.
    words = subtitle.split()
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=sub_font) > 560 and current:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    y = 250
    for line in lines[:3]:
        draw.text((400, y), line, font=sub_font, fill=(232, 236, 242))
        y += 40
    draw.text((400, 420), "PhabLab · test fermé", font=small_font, fill=(186, 196, 208))
    return image

def write_background(path, bg):
    path.write_text(
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n"
        f"    <color name=\"ic_launcher_background\">{bg}</color>\n</resources>\n",
        encoding="utf-8",
    )

def main():
    for app_id, (bg, subtitle) in BRAND.items():
        app = catalog[app_id]
        out = ROOT / "store" / "play" / app_id
        res = out / "res"
        icon = square_icon(app["emoji"], bg, 512)
        out.mkdir(parents=True, exist_ok=True)
        icon.save(out / "icon-512.png")
        icon.resize((192, 192), Image.Resampling.LANCZOS).save(out / "icon-192.png")
        feature_graphic(app["emoji"], bg, app["name"], subtitle).save(out / "feature-1024x500.png")
        foreground = square_icon(app["emoji"], bg, 432)
        drawable = res / "drawable"
        drawable.mkdir(parents=True, exist_ok=True)
        foreground.save(drawable / "ic_launcher_foreground.png")
        values = res / "values"
        values.mkdir(parents=True, exist_ok=True)
        write_background(values / "ic_launcher_background.xml", bg)
        for folder, size in DENSITIES.items():
            target = res / folder
            target.mkdir(parents=True, exist_ok=True)
            small = icon.resize((size, size), Image.Resampling.LANCZOS)
            small.save(target / "ic_launcher.png")
            small.save(target / "ic_launcher_round.png")
        print(app_id, "icons ok")

if __name__ == "__main__":
    main()

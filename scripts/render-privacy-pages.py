#!/usr/bin/env python3
"""Publie le texte §8 de chaque dossier Play dans docs/confidentialite/<id>.html."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
IDS = [
    "wallcheck", "captioncast", "signme", "lagcheck", "tapback", "papercheck",
    "comparesound", "showmethat", "counttogether", "phablabphone", "framematch", "relaytap",
]

def markdown_block(text):
    match = re.search(r"## 8\. Règles de confidentialité.*?\n```markdown\n(.*?)\n```", text, re.S)
    if not match:
        raise SystemExit("section 8 introuvable")
    return match.group(1).strip()

def inline(text):
    escaped = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)

def to_html(app_id, markdown):
    lines = markdown.splitlines()
    title = lines[0].lstrip("# ").strip() if lines else app_id
    body = []
    for line in lines[1:]:
        if line.strip():
            body.append("<p>" + inline(line.strip()) + "</p>")
    return f"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{inline(title)}</title>
  <style>
    body {{ margin: 0; background: #0b0d12; color: #f5f7fb; font-family: Inter, system-ui, sans-serif; }}
    main {{ max-width: 720px; margin: auto; padding: 32px 18px 64px; }}
    h1 {{ font-size: 28px; line-height: 1.2; }}
    p {{ color: #d5dbe6; line-height: 1.55; font-size: 17px; }}
    a {{ color: #8fd7ff; }}
  </style>
</head>
<body>
<main>
  <h1>{inline(title)}</h1>
  {''.join(body)}
  <p><a href="../">Retour au centre de test PhabLab</a></p>
</main>
</body>
</html>
"""

def main():
    out = ROOT / "docs" / "confidentialite"
    out.mkdir(parents=True, exist_ok=True)
    cards = []
    for app_id in IDS:
        matches = list(UPLOADS.glob(f"{app_id}_*.md"))
        if len(matches) != 1:
            raise SystemExit(f"dossier Play introuvable pour {app_id}")
        markdown = markdown_block(matches[0].read_text(encoding="utf-8"))
        (out / f"{app_id}.html").write_text(to_html(app_id, markdown), encoding="utf-8")
        title = markdown.splitlines()[0].lstrip("# ").split("—", 1)[-1].strip()
        cards.append(f'<a class="card" href="./{app_id}.html"><strong>{title}</strong><span>Politique de confidentialité</span></a>')
        print(app_id, "privacy ok")
    index = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confidentialité · PhabLab</title>
<style>body{margin:0;background:#0b0d12;color:#fff;font-family:system-ui,sans-serif}main{max-width:720px;margin:auto;padding:28px 16px 48px}a.card{display:block;margin:10px 0;padding:14px 16px;border:1px solid #29303d;border-radius:16px;background:#151923;color:#fff;text-decoration:none}a.card span{display:block;color:#aab2c0;margin-top:4px}</style>
</head><body><main><h1>Politiques de confidentialité</h1><p>Textes des 12 applications de la vague P2. Les quatre autres applications sont suivies séparément.</p>
""" + "\n".join(cards) + "\n<p><a href=\"../\">Centre de test</a></p></main></body></html>\n"
    (out / "index.html").write_text(index, encoding="utf-8")

if __name__ == "__main__":
    main()

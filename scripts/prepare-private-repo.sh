#!/bin/sh
# Prépare un dépôt git local pour une mini-app exportée.
# Ne crée pas le dépôt GitHub, ne pousse pas, n'utilise pas --force.
set -eu
if [ "$#" -ne 1 ]; then
  echo "usage: scripts/prepare-private-repo.sh <twinlevel|sensorlink|syncmark|soundrace>" >&2
  exit 2
fi
APP="$1"
case "$APP" in
  twinlevel|sensorlink|syncmark|soundrace) ;;
  *) echo "app inconnue: $APP" >&2; exit 2 ;;
esac
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SRC="$ROOT/exports/$APP"
if [ ! -d "$SRC" ]; then
  node "$ROOT/scripts/export-standalone.mjs" --apply "--app=$APP" "--out=$ROOT/exports"
fi
DEST="${TMPDIR:-/tmp}/${APP}-standalone"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$SRC"/. "$DEST"/
git -C "$DEST" init --branch "grok/${APP}-finalisation-20260927"
git -C "$DEST" add -A
git -C "$DEST" -c user.name="${GIT_AUTHOR_NAME:-PhabLab export}" -c user.email="${GIT_AUTHOR_EMAIL:-phablab@example.com}" commit -m "feat: standalone ${APP}"
echo "Dépôt local prêt: $DEST"
echo "Création distante, seulement si vous avez le droit, sans --force :"
echo "  gh repo create cdriccarboni/${APP} --private --source \"$DEST\" --remote origin --push"

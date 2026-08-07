#!/usr/bin/env bash
#
# Planova — günlük veritabanı yedeği
#
# Kurulum (sunucuda):
#   chmod +x ~/planova/deploy/backup.sh
#   # GCS'e de yüklemek için (önerilir) bir bucket oluştur:
#   #   gcloud storage buckets create gs://planova-yedek --location=europe-west3
#   #   gcloud storage buckets update gs://planova-yedek --lifecycle-file=deploy/gcs-lifecycle.json
#   crontab -e
#   # her gece 03:00'te:
#   0 3 * * * GCS_BUCKET=gs://planova-yedek $HOME/planova/deploy/backup.sh >> $HOME/planova-backup.log 2>&1
#
# GERİ YÜKLEME:
#   cat planova-YYYYMMDD-HHMMSS.dump | docker compose -f deploy/docker-compose.prod.yml \
#     --env-file .env.production exec -T postgres \
#     pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner
#
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$HOME/planova}"
COMPOSE_FILE="$PROJECT_DIR/deploy/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env.production"
BACKUP_DIR="${BACKUP_DIR:-$HOME/planova-backups}"
GCS_BUCKET="${GCS_BUCKET:-}"          # boşsa yalnızca yerel yedek alınır
KEEP_LOCAL_DAYS="${KEEP_LOCAL_DAYS:-7}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

[ -f "$ENV_FILE" ] || { log "HATA: $ENV_FILE bulunamadı"; exit 1; }

# .env.production bir shell scripti DEĞİL (ör. MAIL_FROM içindeki "<" bash'i bozar),
# bu yüzden source etmiyoruz; yalnızca gereken iki değeri okuyoruz.
read_env() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  log "HATA: POSTGRES_USER/POSTGRES_DB $ENV_FILE içinde bulunamadı"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/planova-$STAMP.dump"

log "Yedek alınıyor: $FILE"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc --no-owner --no-privileges > "$FILE"

# Boş/bozuk dump'ı yedek sanmayalım
if [ ! -s "$FILE" ]; then
  log "HATA: dump boş, siliniyor"
  rm -f "$FILE"
  exit 1
fi
log "Yerel yedek tamam ($(du -h "$FILE" | cut -f1))"

if [ -n "$GCS_BUCKET" ]; then
  log "GCS'e yükleniyor: $GCS_BUCKET"
  gcloud storage cp "$FILE" "$GCS_BUCKET/" --quiet
  log "GCS yüklemesi tamam"
else
  log "UYARI: GCS_BUCKET tanımlı değil — yedek yalnızca bu sunucuda duruyor."
fi

# Eski yerel yedekleri temizle (GCS'teki saklama süresini lifecycle kuralı yönetir)
find "$BACKUP_DIR" -name 'planova-*.dump' -mtime "+$KEEP_LOCAL_DAYS" -delete
log "Bitti."

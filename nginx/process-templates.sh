#!/bin/bash
# Smart Screen — Nginx config template processor
# Replaces ${VAR} placeholders in nginx conf.d templates with values from environment.
# Run this before starting nginx, or use it as an entrypoint script.

set -e

CONF_DIR="${1:-/etc/nginx/conf.d}"
TEMPLATE_DIR="${2:-/etc/nginx/conf.d}"

for template in "$TEMPLATE_DIR"/*.conf; {
  [ -f "$template" ] || continue
  envsubst '${DASHBOARD_DOMAIN} ${ADMIN_DOMAIN} ${API_DOMAIN} ${PLAYER_DOMAIN} ${MARKETING_DOMAIN}' < "$template" > "${template}.tmp"
  mv "${template}.tmp" "$template"
}

echo "Nginx config templates processed."

#!/bin/bash
cd /home/gpack/Cloud-Screen
# Remove any existing ENCRYPTION_KEY line
sed -i '/ENCRYPTION_KEY/d' .env
# Generate and add
KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=${KEY}" >> .env
echo "Added ENCRYPTION_KEY=${KEY}"

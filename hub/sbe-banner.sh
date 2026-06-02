#!/data/data/com.termux/files/usr/bin/bash
# Bannière SBE TikTok — affiche URL + QR code à chaque lancement Termux

IP=$(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}')
[ -z "$IP" ] && IP="(pas connecté au WiFi)"
URL="http://${IP}:8088"

echo ""
echo "═══════════════════════════════════════════"
echo "  📋 SBE TIKTOK · HUB"
echo "═══════════════════════════════════════════"
echo ""
echo "  🌐  $URL"
echo "  📱  localhost:8088  (sur ce téléphone)"
echo ""
if [ "$IP" != "(pas connecté au WiFi)" ]; then
  echo "$URL" | qrencode -t ANSIUTF8 -m 1 2>/dev/null | sed 's/^/  /'
  echo ""
  echo "  ↑ Scanne ce QR depuis ta tablette pour ouvrir"
fi
echo ""
# Vérifie l'état du serveur
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8088/ 2>/dev/null | grep -q "200"; then
  echo "  ✓ Serveur actif"
else
  echo "  ⚠ Serveur arrêté — relance avec : bash ~/sbe-start.sh"
fi
echo ""

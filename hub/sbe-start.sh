#!/data/data/com.termux/files/usr/bin/bash
# SBE Hub Launcher
# Démarre le serveur local (port 8088) + le watcher d'auto-organisation.
# À exécuter au boot ou après reboot du téléphone.

HOME_DIR=/data/data/com.termux/files/home

# Tue d'anciennes instances pour éviter doublons
pkill -f "sbe-server.js" 2>/dev/null
pkill -f "sbe-watch.js" 2>/dev/null
sleep 1

# Démarre serveur (landing + dashboard + editor + PNGs)
nohup node "$HOME_DIR/sbe-server.js" > "$HOME_DIR/sbe-server.log" 2>&1 &

# Démarre watcher (auto-organise les nouveaux PNG dans Downloads)
nohup node "$HOME_DIR/sbe-watch.js" > "$HOME_DIR/sbe-watch.log" 2>&1 &

sleep 2

echo "═══════════════════════════════════════════"
echo "  SBE HUB · prêt"
echo "═══════════════════════════════════════════"
echo ""
echo "  🏠 Accueil    : http://localhost:8088"
echo "  📋 Dashboard  : http://localhost:8088/dashboard"
echo "  🎨 Éditeurs   : http://localhost:8088/editor"
echo ""
echo "  Watcher actif : tout PNG SBE_*.png qui apparaît"
echo "                  dans Downloads est auto-classé"
echo ""
echo "  Pour rafraîchir le dashboard manuellement :"
echo "    node ~/sbe-organize.js"
echo ""

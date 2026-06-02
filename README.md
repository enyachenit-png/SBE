# SBE — Sauvegarde complète

Backup de tout le travail SBE (boîte d'Enya, diagnostic cognitif étudiants).

## 📖 Ebook Méthode ARCHE — accessible en ligne

➡️ **https://enyachenit-png.github.io/SBE/**

Le fichier `index.html` à la racine est l'ebook complet, servi tel quel par GitHub Pages.

## Structure du repo

| Dossier | Contenu |
|---|---|
| `index.html` | Ebook Méthode ARCHE (servi par GitHub Pages) |
| `editors/` | 15 fichiers HTML éditeurs de carrousels (L1, L2, Wake Up, spéciaux, ebook source). À ouvrir dans un navigateur → bouton "Tout télécharger" pour générer les PNG TikTok. |
| `hub/` | Scripts du SBE Hub local (serveur Node, organize, watcher, launcher). À placer dans `~` sur un nouveau device. |
| `carousels/` | Métadonnées de tous les carrousels publiés (titres, descriptions, hashtags, sources). **Sans les PNG** : ils sont regenerables depuis les éditeurs. |

## Restauration sur un nouveau téléphone / terminal

1. Cloner ce repo : `git clone https://github.com/enyachenit-png/SBE.git`
2. Copier les scripts hub : `cp SBE/hub/sbe-*.js SBE/hub/sbe-*.sh ~/`
3. Copier les éditeurs dans Downloads : `cp SBE/editors/SBE_*.html ~/storage/shared/Download/`
4. Lancer le hub : `bash ~/sbe-start.sh` (port 8088)
5. Rouvrir chaque éditeur depuis le dashboard et cliquer "Tout télécharger" pour regénérer les PNG dans la galerie.

Les textes (titles/descriptions/hashtags) dans `carousels/` permettent de retrouver le contenu publié même si les PNG sont perdus.

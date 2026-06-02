# 🌅 Bienvenue, Enya

Tout ton hub SBE est prêt. Voici comment t'en servir.

---

## 📌 La page d'accueil (à mettre en favori dans Chrome)

**👉 http://localhost:8088**

Ouvre cette URL dans Chrome **une fois**, et ajoute-la aux favoris / à l'écran d'accueil pour un accès en 1 tap.

Tu y trouves 3 boutons :
- **📋 Tableau de bord** — tous tes carrousels en grille, avec recherche/filtres
- **🎨 Éditeurs HTML** — la liste de tes fichiers HTML pour modifier / re-télécharger
- **📥 Télécharger les manquants** — direct vers le filtre "à exporter"

---

## ⚠ État actuel : 26 carrousels à re-télécharger

Pendant la réorganisation, j'ai accidentellement perdu **141 PNG** de tes carrousels L1, L2 et Spécial CV (les Wake Up sont intacts). **Aucun contenu n'est perdu** — les fichiers HTML, descriptions et hashtags sont sauvegardés. Il suffit de re-générer les PNG depuis les éditeurs.

### Comment re-télécharger (3 minutes par carrousel)

1. Ouvre **http://localhost:8088/dashboard**
2. Clique le filtre **⚠ À télécharger** en haut
3. Pour chaque card :
   - Clique **⬇ Télécharger les N slides**
   - Un nouvel onglet s'ouvre avec l'éditeur HTML
   - Clique **⬇ Tout télécharger** en haut de la page
   - Attends 5–15 secondes (Chrome télécharge les PNG)
   - Les PNG sont **automatiquement déplacés** dans le bon dossier par le watcher
   - Le dashboard se met à jour seul

Tu peux faire les 26 d'un coup (~13 min) ou les étaler.

**Astuce** : Chrome va te demander d'autoriser les téléchargements multiples la première fois → autorise.

---

## 📂 Structure du dossier (vu depuis ton gestionnaire de fichiers)

```
Pictures/SBE_Carousels/
├── 00_DASHBOARD.html        ← le tableau de bord
├── 00_LISEZ_MOI_AU_REVEIL.md ← ce fichier
├── 00_README.md             ← liste complète des carrousels
│
├── L1_Ep65_la_comptabilite_en_l1/
│   ├── slide_01.png         ← (à re-télécharger)
│   ├── ...
│   ├── _title.txt           ← titre éditorial
│   ├── _description.txt     ← caption TikTok
│   ├── _hashtags.txt        ← hashtags
│   └── _source.txt          ← lien éditeur
│
├── L2_Ep02_les_matieres_de_l2/...
├── WakeUp_Ep01_tu_travailles_beaucoup/...  ← ✓ déjà complets
└── Special_CV_Parcoursup_Alternance/...
```

Les dossiers apparaissent **directement dans ta galerie photo Android** — tu peux uploader les PNG sur TikTok depuis ta galerie en sélectionnant tous les `slide_*.png` d'un dossier (TikTok les met dans l'ordre alphabétique = l'ordre du carrousel).

---

## 🔄 Si tu redémarres ton téléphone

Termux s'arrêtera et le serveur localhost aussi. Pour le relancer :

1. Ouvre Termux
2. Tape : `bash ~/sbe-start.sh`
3. Le serveur + le watcher repartent

(Si tu veux que ça démarre automatiquement au boot, il faut installer l'app **Termux:Boot** depuis F-Droid. Je peux t'aider à le faire si tu veux.)

---

## 🆕 Pour un nouveau carrousel à l'avenir

Tu m'envoies juste le **texte** (slides + description + hashtags) et la série voulue. Je :
1. Génère le HTML brandé dans Downloads
2. Ajoute son entrée au dashboard
3. Quand tu cliques "Tout télécharger" depuis l'éditeur, le watcher classe les PNG tout seul

Tu n'as plus rien à toucher côté organisation. 💫

Bonne journée ❤️

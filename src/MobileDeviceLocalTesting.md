
# 🔌 Mise en place d'ADB sur Windows pour tester un site local sur tablette Android

## 1️⃣ Installer ADB sur Windows

1. Télécharger **Android SDK Platform Tools** depuis Google :  
   - Site officiel : https://developer.android.com/studio/releases/platform-tools

2. Dézipper le dossier quelque part sur ton PC, par exemple :
C:\platform-tools

3. Ajouter le chemin au PATH Windows (optionnel mais pratique) :  
   - Ouvrir Paramètres → Système → Variables d’environnement → Path  
   - Ajouter : C:\platform-tools  
   - Valider et redémarrer le terminal

4. Vérifier l’installation :
```bash
adb version
```

## 2️⃣ Activer le debug USB sur la tablette Android

1. Sur la tablette : Paramètres → À propos du téléphone → Numéro de build  
   - Tapoter plusieurs fois pour activer le mode développeur

2. Activer Options développeur → Débogage USB

3. Connecter la tablette au PC via USB  
   - Windows installera les pilotes nécessaires

4. Autoriser la connexion sur la tablette  
   - Lors du premier branchement, cocher “Toujours autoriser”

## 3️⃣ Vérifier la connexion

```bash
adb devices
```

- Doit afficher un appareil listé, par exemple :
```
List of devices attached
0123456789ABCDEF	device
```

## 4️⃣ Lancer Vite sur le PC

```bash
vite --host
```

- Par défaut sur le port 5173  
- URL : http://localhost:5173

## 5️⃣ Créer le port forwarding USB

```bash
adb forward tcp:5173 tcp:5173
# ou en VM
adbforward tcp:5173 tcp:192.168.1.17:5173
```

- La tablette peut accéder au site via http://127.0.0.1:5173

## 6️⃣ Tester sur la tablette

- Ouvrir Chrome / navigateur Android  
- Accéder à http://127.0.0.1:5173  
- Vérifier que le site charge, que le multi-touch et HMR fonctionnent

## 7️⃣ Points importants / sécurité

- La tablette ne peut accéder qu’au port forwardé  
- Debug USB activé seulement pour dev  
- Toujours utiliser ADB officiel Google  
- Révoquer les autorisations USB après usage : Options développeur → Révoquer autorisations de débogage USB

## 8️⃣ Commandes utiles ADB

```bash
# Voir appareils connectés
adb devices

# Stopper serveur ADB
adb kill-server

# Lancer serveur ADB
adb start-server

# Forward un autre port
adb forward tcp:<port-tablette> tcp:<port-PC>
```

## 🔹 Résultat attendu

- Tablette exécute tout côté navigateur : React, Web Workers, WebAssembly  
- Appels API passent via proxy Vite  
- Multi-touch et pointer events fonctionnent  
- Aucun risque d’accès réseau ou système non autorisé sur le PC


# Versions Android
| Version | Nom de release | Date de sortie | Fin de support estimée | Fonctionnalités spécifiques |
|---------|----------------|----------------|-------------------------|-----------------------------|
| 1.0 | (—) | 23 septembre 2008 | ~2010 | Première version Android – navigateur web, Gmail, maps, notifications |
| 1.1 | (—) | 9 février 2009 | ~2010 | Améliorations des apps système |
| 1.5 | Cupcake | 30 avril 2009 | ~2011 | Clavier à l’écran, enregistrement vidéo |
| 1.6 | Donut | 15 septembre 2009 | ~2011 | Support WVGA, barre de recherche unifiée |
| 2.0 / 2.1 | Eclair | 26 octobre 2009 / 12 janvier 2010 | ~2012 | Multitouch, Bluetooth 2.1, Google Maps Navigation |
| 2.2 | Froyo | 20 mai 2010 | ~2012 | Vitesse améliorée, hotspot Wi‑Fi |
| 2.3 | Gingerbread | 6 décembre 2010 | ~2013 | UI simplifiée, NFC |
| 3.x | Honeycomb | 22 février 2011 | ~2013 | Optimisé pour tablettes |
| 4.0 | Ice Cream Sandwich | 18 octobre 2011 | ~2014 | Unification mobile/tablette |
| 4.1–4.3 | Jelly Bean | 9 juillet 2012 | ~2015 | Project Butter, notifications enrichies |
| 4.4 | KitKat | 31 octobre 2013 | ~2016 | Optimisations mémoire |
| 5.x | Lollipop | 12 novembre 2014 | ~2017 | Material Design |
| 6.0 | Marshmallow | 5 octobre 2015 | ~2018 | Permissions app repensées |
| 7.x | Nougat | 22 août 2016 | ~2019 | Multi‑fenêtre, notifications directes |
| 8.x | Oreo | 21 août 2017 | ~2020 | Canaux de notification, picture‑in‑picture |
| 9 | Pie | 6 août 2018 | ~2021 | Gestes navigation, Adaptive Battery |
| 10 | (—) | 3 septembre 2019 | ~2022 | Mode sombre, privacy améliorée |
| 11 | (—) | 8 septembre 2020 | ~2023 | Bubbles, amélioration vie privée |
| 12 | Snow Cone | 4 octobre 2021 | 3 mars 2025 (estimé) | UI repensé, notifications redesign, privacy dashboard |
| 12L | Snow Cone v2 | 7 mars 2022 | 3 mars 2025 | Optimisations grands écrans |
| 13 | Tiramisu | 15 août 2022 | Actif | Theming amélioré, privacy enhancements |
| 14 | Upside Down Cake | 4 octobre 2023 | Actif | Focus sur adaptabilité grands écrans |
| 15 | Vanilla Ice Cream | 3 septembre 2024 | Actif | Améliorations UI, sécurité, performance |
| 16 | Baklava | 10 juin 2025 | Actif | Notifications Live Updates, protections avancées, multitâche amélioré |

[Android Releases – Versions et nouveautés sur Android Developers](https://developer.android.com/about/versions)

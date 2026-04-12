# Comment extraire les icônes qui m'intéressent de Pokémon Home ?

## Extraire sprites de Pokémon Home Switch :

- Mettre à jour Pokémon Home sur ma Nintendo Switch (v1)
- Booter dans Hekate (avec TegramRcm), pour lancer Atmosphere Sys-MMC (et *pas* Emu-MMC)
- Lancer le menu homebrew (lancer Pokémon Home en maintenant R)
- Lancer nxdumptool (nxdt_rw_poc), puis sélectionner :
	- User titles menu
	- Pokemon Home
	- nca / nca fs dump options
	- dump update
	- Program #0
	- FS Section #2: Patch RomFS
- Régler les options :
	- use base/patch: Application v0
	- write raw section: no
	- use layeredfs dir: no
	- output storage: sdmc
- Cliquer sur "browse nca fs section", puis naviguer dans bin/pokemon
- Cliquer sur R pour highlight le dossier "compress_capture_pokemon"
- Cliquer sur Y pour dump le dossier
- Reboot dans Hekate
- Tools, USB tools, SD card pour accéder à la carte SD depuis le PC
- Copier l'export sur PC : il contient des fichiers .bntx.gz
- Utiliser NanaZip pour extraire tous les fichiers d'un coup
- Utiliser Toolbox-Latest (dans mon dossier Consoles hackées) et cliquer sur Tools > Textures > Batch All (BNTX)
- Choisir .png
- Sélectionner tous les .bntx extraits précédemment, puis sélectionner le dossier dans lequel les exporter en PNG
- Valider et laisser faire
- Voilà !
- Bonus : utiliser Beyond Compare pour comparer le dossier avec les nouveaux PNG et le dossier "\\wsl.localhost\Ubuntu\home\remis\WebDev\remiscanfr\www\shinydex\images\pokemon-sprites\home" pour voir lesquels sont différents. Double clic pour voir les previews !
	- Diffs no orphans > tout copier vers la droite
	- Orphans > copier au cas par cas (ignorer les œufs, les casquettes de Pikachu)

## Extraire icônes de Pokémon Home mobile :

- Mettre à jour Pokémon Home sur mon téléphone
- L'ouvrir et télécharger les données dans l'appli au démarrage
- Branche le téléphone au PC en USB
- Aller dans Android/data/jp.pokemon.pokemonhome/files/tyranitar (un dossier plein de .aba)
- Copier ce dossier sur mon PC
- Copier/coller ABA_Decryptor.exe dans le dossier copié
- Lancer ABA_Decryptor.exe, il va décrypter les .aba et en faire des .unity3d
- Ouvrir le dossier avec AssetStudio
- Filtrer par Texture2D et Sprite
- Extraire les icônes intéressantes (balls, icônes des jeux, origin marks, etc)
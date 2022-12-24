/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! ÉLÉMENTS GLOBAUX !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/*<?php themeSheetStart(); ?>*/
:root[data-theme="light"] {
  color-scheme: light;
  --bg-color: rgb(224, 224, 224);
  --accent-color: rgb(64, 81, 177);
  --nav-bg-color: rgb(235, 235, 235);
  --nav-text-color: rgb(100, 100, 100);
  --nav-bubble-color: rgb(179, 186, 224);
  --text-color: rgb(33, 33, 33);
  --text-color-soft: rgb(0, 0, 0);
  --card-bg-color: rgb(245, 245, 245);
  --card-sprite-bg-color: white;
  --card-infos-text-color: rgba(0, 0, 0, 0.54);
  --notif-bg-color: rgb(245, 245, 245);
  --sprite-viewer-bg-color: rgb(255, 255, 255);
  --danger-color: hsl(0, 40%, 50%);
  --success-color: hsl(120, 73%, 40%);
  --failure-color: hsl(0, 53%, 40%);
  --radio-disabled-color: rgba(100, 100, 100, .2);
  --radio-off-color: rgba(100, 100, 100, .3);
  --radio-checked-bg-color: white;
  --radio-check-color: var(--accent-color);
  --checkbox-check-color: white;
  --switch-unchecked-bg-color: hsl(231, 0%, 50%);
  --input-bg-color: white;
  --progress-bar-color: var(--accent-color);
  --card-edit-bg-color: rgba(240, 240, 240, .7);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg-color: rgb(34, 34, 34);
  --accent-color: hsl(217, 89%, 75%);
  --nav-bg-color: rgb(48, 48, 48);
  --nav-text-color: rgb(162, 166, 173);
  --nav-bubble-color: rgb(65, 74, 88);
  --text-color: rgb(255, 255, 255);
  --text-color-soft: rgb(193, 193, 193);
  --card-bg-color: rgb(42, 42, 42);
  --card-sprite-bg-color: rgba(55, 55, 55);
  --card-infos-text-color: rgb(200, 200, 200);
  --notif-bg-color: rgb(45, 45, 45);
  --sprite-viewer-bg-color: rgb(0, 0, 0);
  --danger-color: hsl(0, 40%, 50%);
  --success-color: hsl(120, 73%, 75%);
  --failure-color: hsl(0, 53%, 75%);
  --radio-disabled-color: rgba(193, 193, 193, .3);
  --radio-off-color: rgba(193, 193, 193, .2);
  --radio-checked-bg-color: var(--accent-color);
  --radio-check-color: var(--nav-bg-color);
  --checkbox-check-color: var(--nav-bg-color);
  --switch-unchecked-bg-color: hsla(217, 0%, 55%);
  --input-bg-color: hsl(0, 0%, 90%);
  --progress-bar-color: white;
  --card-edit-bg-color: hsla(0, 0%, 7%, .7);
}
/*<?php themeSheetEnd(closeComment: true); ?>*/

:root {
  --nav-text-color-on: var(--accent-color);
  --text-color-inverse: var(--bg-color);
  --fab-color: var(--accent-color);
  --radio-on-color: var(--accent-color);
  --checkbox-checked-bg-color: var(--accent-color);
  --button-color: var(--accent-color);
  --button-ghost-color: var(--accent-color);
}

html {
  --link-iconsheet: url(/shinydex/images/iconsheet.png);
  --link-pokemonsheet: url(/shinydex/images/pokemonsheet.webp);
  --link-pokesprite: url(/shinydex/ext/pokesprite.png);
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  --drawer-width: 270px;
  --sprite-size: 112px;
  --tap-safe-size: 44px;

  /* Élévation */
  --z-sprite-viewer: 60;
  --z-search-bar: 50;
  --z-menu-filtres: 50;
  --z-obfuscator: 40;
  --z-section-titre: 35;
  --z-nav: 30;
  --z-notification: 20;
  --z-fab: 10;
}

p {
  margin: 0;
}
p + p {
  margin-top: 16px;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

body {
  display: grid;
  grid-template-rows: 1fr 56px;
  grid-template-columns: 1fr;
  background-color: var(--bg-color);
  color: var(--text-color);
  user-select: none;
  margin: 0;
  font-family: Roboto, system-ui;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! BARRE DE NAVIGATION !!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

nav {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  display: grid;
  --nombre-sections: 5;
  grid-template-columns: repeat(var(--nombre-sections), 1fr);
  grid-template-columns: 1fr 1fr 0.6fr 1fr 1fr;
  background-color: var(--nav-bg-color);
  z-index: var(--z-nav);
}

.search-button {
  grid-column: 3;
  grid-row: 1;
}

.nav-link {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--nav-text-color);
  text-decoration: none;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  outline-offset: -3px;
}

.nav-link>* {
  z-index: 1;
}

@keyframes bulle-nav {
  0% { opacity: 1; transform: scale(0); }
  90% { opacity: .4; }
  100% { opacity: 0; transform: scale(1); }
}

.nav-link::before {
  content: '';
  display: block;
  position: absolute;
  transform: scale(0);
  transform-origin: var(--transform-origin, center center);
  --size: calc(90vw / var(--nombre-sections));
  width: var(--size);
  height: var(--size);
  background-color: var(--nav-bubble-color);
  border-radius: 50%;
  z-index: 0;
}

.nav-link.only-pc {
  display: none;
}

.nav-link.bubbly::before {
  animation: bulle-nav .3s var(--easing-decelerate);
}

.on.nav-link,
body[data-section-actuelle~="mes-chromatiques"] .nav-link[data-section="mes-chromatiques"],
body[data-section-actuelle~="pokedex"] .nav-link[data-section="pokedex"],
body[data-section-actuelle~="chasses-en-cours"] .nav-link[data-section="chasses-en-cours"],
body[data-section-actuelle~="partage"] .nav-link[data-section="partage"] {
  --nav-text-color: var(--nav-text-color-on);
}

.nav-link shiny-stars {
  --size: 1.2em;
}

.search-button > i {
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  background-color: var(--nav-text-color);
  color: var(--nav-bg-color);
}

.lien-section,
.bouton-retour {
  cursor: pointer;
}

.lien-section > sync-progress,
.sous-titre > sync-line {
  position: absolute;
}

nav > a > span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! SECTIONS PRINCIPALES !!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

main {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  overflow-x: hidden;
  overflow-y: hidden;
  position: relative;
  height: 100%;
}

section {
  display: none;
  overflow-anchor: none;
  height: 100%;
  overflow: hidden;
}

main > section {
  grid-template-rows: 56px auto;
}

main > section.on,
body[data-section-actuelle~="mes-chromatiques"] #mes-chromatiques,
body[data-section-actuelle~="pokedex"] #pokedex,
body[data-section-actuelle~="chasses-en-cours"] #chasses-en-cours,
body[data-section-actuelle~="corbeille"] #corbeille,
body[data-section-actuelle~="partage"] #partage,
body[data-section-actuelle~="chromatiques-ami"] #chromatiques-ami,
body[data-section-actuelle~="parametres"] #parametres,
body[data-section-actuelle~="a-propos"] #a-propos,
body[data-section-actuelle~="sprite-viewer"] #sprite-viewer,
body[data-section-actuelle~="obfuscator"] #obfuscator {
  display: grid;
}

h1 {
  all: unset;
}

.search-header,
.section-titre {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  font-size: 1.5rem;
  font-weight: 400;
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: var(--z-section-titre);
  background-color: var(--bg-color);
}

.section-titre>* {
  z-index: 1;
}

.spacer {
  flex-grow: 1;
}

#parametres .spacer {
  min-height: 48px;
}

.search-header,
.section-titre.with-button {
  padding-left: 0;
}

.titre-icones {
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
}

.icone + .icone,
#install-bouton + .icone {
  margin-left: 12px;
}

.icone.bouton-retour {
  width: 56px;
  height: 56px;
}

.bouton-retour,
.reset-icon {
  outline-offset: -3px;
}

.compteur {
	display: flex;
	justify-content: center;
	align-items: center;
  position: relative;
	font-size: 1.25rem;
	min-width: 35px;
  height: 35px;
  box-sizing: border-box;
  margin-left: 1ch;
  padding: 0 4px;
	border-radius: 35px;
  background: var(--accent-color);
  color: var(--text-color-inverse);
	letter-spacing: 0;
}

#pokedex .compteur {
  font-size: .95rem;
}

#pokedex .compteur > .caught {
  opacity: 1;
  font-size: 1.25rem;
}

#pokedex .compteur > span {
  padding: 0 0.2em;
  opacity: .8;
}

.section-contenu {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  padding: 8px;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
  scrollbar-gutter: stable;
  container-type: inline-size;
}

body[data-section-actuelle~="obfuscator"] .section-contenu {
  overflow-y: hidden;
}


/*
 * FAB
 */

@keyframes fab-apparition {
  0% { transform: translate3D(0, var(--decalage, 0), 0) scale(0); }
  100% { transform: translate3D(0, var(--decalage, 0), 0) scale(1); }
}

.fab {
  display: none;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  position: fixed;
  z-index: var(--z-fab);
  bottom: 56px;
  right: 0;
  margin: 15px;
  padding: 0;
  box-shadow: 0 4px 5px 0 rgba(0,0,0,.14),
              0 1px 10px 0 rgba(0,0,0,.12),
              0 2px 4px -1px rgba(0,0,0,.2);
  animation: fab-apparition .2s var(--easing-standard) .2s;
  animation-fill-mode: backwards;
  transform: translate3D(0, var(--decalage, 0), 0) scale(1);
  transition: transform .2s var(--easing-accelerate);
  --decalage: 0;
  color: var(--text-color-inverse);
}

.fab.notif {
  --decalage: -56px;
  transition: transform .15s var(--easing-decelerate);
}

body[data-section-actuelle~="mes-chromatiques"] .fab,
body[data-section-actuelle~="pokedex"] .fab,
body[data-section-actuelle~="chasses-en-cours"]:not([data-section-actuelle~="corbeille"]) .fab,
body[data-section-actuelle~="partage"] .fab {
  display: flex;
}

#mes-chromatiques > .section-contenu,
#pokedex > .section-contenu,
#chasses-en-cours > .section-contenu,
#partage > .section-contenu {
  padding-bottom: calc(56px + 2 * 15px - 6px);
}

.fab.mini {
  animation: none;
  width: 42px;
  height: 42px;
  grid-column: unset;
  grid-row: unset;
  position: relative;
  right: unset;
  bottom: unset;
  margin: 0;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! CARTE D'UN POKÉMON !!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

pokemon-card + pokemon-card {
  content-visibility: auto;
  contain-intrinsic-size: 10px 126px;
}

.defer-loader {
  border: 1px solid var(--card-bg-color);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  order: 999999999;
  margin: 0 0 6px;
  padding: 6px;
  color: var(--text-color-soft);
  /*--root-margin: 126px;
  transform: translateY(calc(-1 * var(--root-margin)));*/
}

.defer-loader>load-spinner {
  --size: 2em;
  /*transform: translateY(var(--root-margin));*/
}

#chasses-en-cours .defer-loader {
  order: -1;
}

.defered .defer-loader {
  display: none;
}

.vide {
  height: 100%;
}

.message-vide-filtres,
.message-vide {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content min-content 1fr;
  font-size: 1.125rem;
  color: var(--radio-off-color);
  flex-grow: 1;
  text-align: center;
  width: 60%;
  gap: 8px;
  align-self: center;
  justify-self: center;
}

.message-vide-filtres>.material-icons,
.message-vide>.material-icons {
  font-size: 2.625rem;
  grid-row: 2 / 3;
}

.message-vide-filtres>span,
.message-vide>span {
  grid-row: 3 / 4;
}

section:not(.vide-filtres) .message-vide-filtres,
section:not(.vide) .message-vide {
  display: none;
}

section.vide .defer-loader {
  display: none;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! MENU DES FILTRES !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

.menu-filtres>.section-titre {
  padding: 0 0 0 8px;
}
.menu-filtres>.section-titre::before {
  display: none;
}

.sous-titre {
  width: 100%;
  font-size: 1.125rem;
  color: var(--text-color-soft);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin-bottom: 16px;
}

/*body:not([data-section-actuelle="pokedex"]) .sous-titre:not(:nth-child(2)) {
  margin-top: 16px;
}*/

.sous-titre:not(:first-child) {
  margin-top: 16px;
}

.sous-titre::before {
  content: '';
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-color-soft);
  position: absolute;
  z-index: 0;
  opacity: .3;
}

.sous-titre>span {
  --bg: var(--bg-color);
  background-color: var(--bg);
  z-index: 1;
  padding: 0 8px;
  margin: 0 32px;
}

/*.menu-filtres .sous-titre>span {
  --bg: var(--nav-bg-color);
}*/

.reverse-order__container {
  width: 24px;
  height: 24px;
}

.reverse-order {
  all: unset;
  cursor: pointer;
  position: relative;
  width: 24px;
  height: 24px;
}

body[data-reversed=true] .reverse-order {
  transform: rotate(180deg);
}

.reverse-order::before {
  content: '';
  display: block;
  --size: 44px;
  width: var(--size);
  height: var(--size);
  position: absolute;
  top: calc(-.5 * (var(--size) - 24px));
  left: calc(-.5 * (var(--size) - 24px));
}

.cote-a-cote {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.liste-options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

fieldset.search-hints,
fieldset.liste-options {
  margin: 0;
  padding: 0;
  border: 0;
}

:not(.cote-a-cote)>.liste-options + .liste-options {
  margin-top: 8px;
}

.options-search-espece {
  align-items: center;
  padding-bottom: 16px;
}

.titre-options {
  flex-basis: 100%;
  margin: 0 8px 8px;
}

.options-search-espece>.titre-options {
  flex-basis: auto;
}

label.checkbox.filtre-jeu {
  padding-right: 2px;
}

body:not([data-section-actuelle="mes-chromatiques"]) .only-mes-chromatiques,
body:not([data-section-actuelle="pokedex"]) .only-pokedex {
  display: none;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! POKÉDEX !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

.pokedex-gen {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14);
  margin-bottom: 6px;
  padding: 5px 0;
  background-color: var(--card-bg-color);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
}

.pokedex-gen + .pokedex-gen {
  content-visibility: auto;
  contain-intrinsic-size: 10px 1000px;
}

.pkmnicon,
.pokedex-gen>.pkspr {
  background-color: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;

  position: relative;
  margin: 0;
}

.pokedex-gen > .pkmnicon:focus,
.pokedex-gen > .got.pkmnicon,
.pokedex-gen>.pkspr:focus,
.pokedex-gen>.got.pkspr {
  z-index: 1;
}

.pokedex-gen > :not(.got).pkmnicon::after,
.pokedex-gen>:not(.got).pkspr::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  opacity: .5;
  background-color: var(--card-bg-color);
}

.pokedex-gen > :not(.got).pkmnicon:hover::after,
.pokedex-gen>:not(.got).pkspr:hover::after {
  opacity: .1;
}

.section-titre>load-spinner {
  transform: scale(.4);
  transform-origin: right center;
}

@keyframes apparition2 {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

nav.disabled {
  pointer-events: none;
  filter: brightness(0.4) grayscale(.5);
}





/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! CHASSES EN COURS !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

#chasses-en-cours>.section-contenu {
  flex-direction: column-reverse;
}

hunt-card + hunt-card {
  content-visibility: auto;
  contain-intrinsic-size: 10px 126px;
}

.form-element {
  grid-column: 1 / 3;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.bouton-hunt-caught,
.bouton-hunt-submit {
  flex-grow: 1;
  margin: 0;
}

.caught .bouton-hunt-caught {
  background-color: transparent;
  border: 2px solid var(--button-ghost-color);
  box-sizing: border-box;
  box-shadow: none;
}

.bouton-hunt-remove {
  margin: 0;
}

.hunt-card.edit .bouton-hunt-remove:not(.bouton-hunt-edit),
.hunt-card:not(.edit) .bouton-hunt-edit {
  display: none;
}

.hunt-card>.sous-titre,
.hunt-card>.liste-options,
.hunt-card>.titre-options,
.hunt-card>.cote-a-cote {
  grid-column: 1 / 3;
}

.hunt-card .liste-options + .titre-options,
.hunt-card .cote-a-cote + .liste-options,
.hunt-card .cote-a-cote + .cote-a-cote {
  margin-top: 16px;
}

.hunt-card .sous-titre>span {
  --bg: var(--card-bg-color);
}

:not(.caught).hunt-card>.caught {
  display: none;
}

.hunt-card .on-top {
  grid-column: 2 / 3;
  display: grid;
  grid-template-rows: 16px auto 25px 16px auto 8px;;
  grid-template-columns: 8px auto 1fr;
  position: relative;
  top: -10px;
}

.hunt-card .cote-a-cote {
  gap: 8px;
}

.hunt-card .cote-a-cote .liste-options {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 25px;
}

.on-top>.titre-options {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
}

.on-top>.liste-options {
  grid-row: 3 / 4;
  grid-column: 2 / 3;
}

.jeu-methode {
  grid-column: 1 / 3;
  display: grid;
  grid-template-columns: 0 32px 8px auto 8px auto 1fr;
}

.on-top>.jeu-methode {
  grid-column: 2 / 3;
  grid-row: 5 / 6;
}

.jeu-methode>.icones {
  grid-column: 2 / 3;
  align-self: end;
}

.jeu-methode>.option-jeu,
.jeu-methode>.option-methode {
  grid-column: 4 / 5;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 25px;
}

.jeu-methode>.option-methode {
  grid-column: 6 / 7;
}

.bouton-compteur {
  box-sizing: border-box;
  width: 42px;
  height: 42px;
}

.form-element.boutons {
  margin-top: 8px;
}

.hunt-card .cote-a-cote .liste-options.ball {
  display: grid;
  grid-template-columns: 32px 1fr;
}

.liste-options.ball>.titre-options {
  grid-column: 1 / 3;
}

.liste-options.ball>.pkspr {
  align-self: center;
}

.bouton-hunt-submit-loading {
  flex-basis: 100%;
  margin-top: 16px;
}

.hunt-card:not([data-methode="Raid Dynamax"]):not([data-methode="Œuf"]) .options-DO {
  display: none;
}

.hunt-card:not([data-methode="Raid Dynamax"]) .raid,
.hunt-card:not([data-methode="Œuf"]) .oeuf {
  display: none;
}

.hunt-card[data-methode="Masuda"] .options-horsChasse,
.hunt-card[data-methode="Pokéradar"] .options-horsChasse,
.hunt-card[data-methode="Pêche à la chaîne"] .options-horsChasse,
.hunt-card[data-methode="Chaîne au Navi-Dex"] .options-horsChasse,
.hunt-card[data-methode="Chaîne SOS"] .options-horsChasse,
.hunt-card[data-methode="Ultra-Brèche"] .options-horsChasse,
.hunt-card[data-methode="Chaîne de captures"] .options-horsChasse,
.hunt-card[data-methode="Raid Dynamax"] .options-horsChasse,
.hunt-card[data-methode="Sauvage (évènement)"] .options-horsChasse,
.hunt-card[data-methode="Sauvage (garanti)"] .options-horsChasse,
.hunt-card[data-methode="Glitch"] .options-horsChasse,
.hunt-card[data-methode="Distribution"] .options-horsChasse,
.hunt-card[data-methode="Échangé"] .options-horsChasse,
.hunt-card[data-methode="Échangé (GTS)"] .options-horsChasse,
.hunt-card[data-methode="Échange miracle"] .options-horsChasse,
.hunt-card[data-methode="Échangé (œuf)"] .options-horsChasse {
  display: none;
}

.hunt-card:not([data-methode="Glitch"]):not([data-methode="Distribution"]):not([data-methode="Échangé"]):not([data-methode="Échangé (GTS)"]):not([data-methode="Échange miracle"]):not([data-methode="Échangé (œuf)"]) .options-legit {
  display: none;
}

.hunt-card[data-methode="Ultra-Brèche"] .options-compteur {
  display: none;
}

.hunt-card:not([data-methode="Ultra-Brèche"]) .options-compteur-breche {
  display: none;
}

.hunt-card:not([data-methode="Chaîne de captures"]) .options-compteur-chaine-letsgo {
  display: none;
}

.hunt-card:not([data-jeu="Légendes Arceus"]) .options-bonus-legends-arceus {
  display: none;
}

.hunt-card:not([data-jeu="Épée"]):not([data-jeu="Bouclier"]):not([data-jeu="Légendes Arceus"]) .options-gene {
  display: none;
}

.hunt-card:not([data-jeu="Épée"]):not([data-jeu="Bouclier"]) :is([id~="gene-gigamax"], [for~="gene-gigamax"]) {
  display: none;
}

.hunt-card:not([data-jeu="Légendes Arceus"]) :is([id~="gene-alpha"], [for~="gene-alpha"]) {
  display: none;
}

.options-compteur-chaine-letsgo.titre-options {
  grid-column: 1 / 2;
  white-space: nowrap;
  align-self: center;
  margin-top: 0;
}

.options-compteur-chaine-letsgo.liste-options {
  grid-column: 2 / 3;
  align-self: center;
}

.options-compteur-chaine-letsgo.liste-options>label {
  margin-bottom: 0;
}

label.radio.checkmark,
label.radio.DO,
label.radio.hacked,
label.radio.horsChasse {
  grid-template-columns: 25px 12px auto;
  align-items: center;
}

label.radio.charm {
  grid-template-columns: 25px 22px auto;
  align-items: center;
}

label.radio>.charm {
  margin: 0;
}

.checkmark>.icones,
.DO>.icones,
.charm>.icones,
.hacked>.icones,
.horsChasse>.icones {
  grid-column: 2 / 3;
}

.checkmark>.texte,
.DO>.texte,
.charm>.texte,
.hacked>.texte,
.horsChasse>.texte {
  grid-column: 3 / 4;
}

select[id$="-forme"] {
  width: 16ch;
}

select[id$="-methode"] {
  width: 12ch;
}

.hunt-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
  justify-content: center;
  align-items: center;
  background: var(--card-bg-color);
  z-index: 2;
  border-radius: 10px;
}

.hunt-card[data-loading]>.hunt-loader {
  display: flex;
}

.hunt-loader>load-spinner {
  --bg-color: var(--card-bg-color);
  margin: auto;
  --size: 3em;
}

.hunt-loader>.material-icons {
  position: absolute;
  opacity: .5;
  z-index: 2;
}

.hunt-card[data-loading='cloud_upload']>.hunt-loader>.material-icons::before {
  content: 'cloud_upload';
}

.hunt-card[data-loading='delete_forever']>.hunt-loader>.material-icons::before {
  content: 'delete_forever';
}

.hunt-card[data-loading] .titre-options,
.hunt-card[data-loading] .liste-options,
.hunt-card[data-loading] .cote-a-cote,
.hunt-card[data-loading] .form-element,
.hunt-card[data-loading] .sous-titre {
  display: none;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! PARAMÈTRES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

#parametres {
  min-height: 100%;
}

#a-propos>.section-contenu,
#parametres>.section-contenu {
  margin: 0 auto 8px auto;
  padding: 15px 30px 8px;
  text-align: justify;
  box-sizing: border-box;
  width: 100%;
  max-width: 65ch;
  color: var(--text-color-soft);
}

#parametres .sous-titre,
#a-propos .sous-titre {
  font-size: 1rem;
}

#parametres p + .sous-titre,
#a-propos p + .sous-titre {
  margin-top: 48px;
}

.un-parametre {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 5%;
  align-items: center;
  width: 100%;
  min-height: 32px;
  margin: 0 auto;
}

.un-parametre.theme>.param {
  grid-template-columns: auto auto auto;
  gap: 10px;
}

.un-parametre + .un-parametre {
  margin-top: 15px;
}

.param-nom {
  font-weight: 500;
  line-height: 1em;
  display: block;
  text-align: left;
  box-sizing: border-box;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

.param-nom,
.param-nom>label {
  color: var(--text-color-soft);
}

.param-description {
  line-height: 1em;
  grid-row: 2 / 3;
  opacity: .7;
  text-align: left;
}

.param {
  display: grid;
}

.un-parametre>label,
.un-parametre>input,
.un-parametre>input-switch,
.un-parametre>.param {
  grid-row: 1 / 3;
  grid-column: 2 / 3;
}

.param button,
.param label.ghost {
  margin: 0;
}

.bouton-recherche-maj {
  margin-top: 0;
}

#parametres:not([data-online-backup]) .if-backup,
#parametres:not([data-online-sharing]) .if-sharing {
  display: none;
}

#parametres[data-online-backup] .no-backup,
#parametres[data-online-sharing] .no-sharing {
  display: none;
}

.info-backup {
  display: none;
  font-size: .8rem;
  color: var(--bg-color);
  background-color: var(--color);
  padding: .2em .5em;
  margin-left: .2em;
  border-radius: 20px;
}

.info-backup.success {
  --color: var(--success-color);
}

.info-backup.failure {
  --color: var(--failure-color);
}

#parametres[data-online-backup][data-last-sync=success] .success,
#parametres[data-online-backup][data-last-sync=failure] .failure {
  display: inline;
}

#pick-import-file {
  width: .1px;
	height: .1px;
	opacity: 0;
	overflow: hidden;
	position: absolute;
	z-index: -1;
}

.account-warning {
  border: 1px solid var(--success-color);
  border-radius: 10px;
  padding: 8px;
  grid-template-columns: auto;
  box-sizing: border-box;
}

.un-parametre.theme input[type="radio"] + label {
  margin: 0;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! À PROPOS DU SHINYDEX !!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

.app-icon {
  border-radius: 50%;
  margin: 0 auto;
  margin-bottom: 15px;
}

.sources-titre {
  font-weight: 500;
  position: relative;
  left: -15px;
  display: block;
  margin-bottom: 10px;
}

.sources {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.lien-source {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
	text-decoration: none;
  color: var(--button-ghost-color);
  height: 2em;
}
.lien-source + .lien-source {
  margin-top: 5px;
}
.lien-source i {
  margin-right: 5px;
}

.version {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  opacity: .7;
  margin-right: -15px;
  font-size: .8rem;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! SPRITE VIEWER !!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

#sprite-viewer,
#obfuscator {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
}

#sprite-viewer {
  background-color: var(--sprite-viewer-bg-color);
  z-index: var(--z-sprite-viewer);
}

#obfuscator {
  background-color: var(--bg-color);
  z-index: var(--z-obfuscator);
}



/*
 * Notification
 */

.bottom-bar {
  box-shadow: 0 -1px 3px rgba(0, 0, 0, .1);
}

.notification {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: calc(2 * 56px);
  padding-bottom: 56px;
  background-color: var(--notif-bg-color);
  z-index: var(--z-notification);
  color: var(--text-color);
  box-sizing: border-box;
  transform: translate3D(0, calc(2 * 56px), 0);
  transition: transform .2s var(--easing-accelerate);
}

.notification.off {
  opacity: 0;
  pointer-events: none;
}

.notification.installing,
.notification.on {
  transform: translate3D(0, 0, 0);
  transition: transform .15s var(--easing-decelerate);
}

.notif-bouton,
.notif-texte {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto 20px;
}

.notif-bouton {
  cursor: pointer;
  text-transform: uppercase;
}

.notif-bouton span {
  margin-right: 5px;
  font-weight: 500;
}

.progression-maj {
  display: block;
  position: absolute;
  top: -3px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--progress-bar-color);
  transform-origin: center left;
  --progression: 0;
  transform: scaleX(0);
}

.installing .progression-maj {
  transform: scaleX(var(--progression));
}

.notification>load-spinner {
  --size: 3em;
  --bg-color: var(--notif-bg-color);
  position: absolute;
  right: 6px;
  place-self: center;
}

:not(.installing):not(.loading).notification>load-spinner {
  display: none;
}

.installing .notif-bouton {
  display: none;
}

.notification.loading .material-icons {
  display: none;
}


/*
 * Bouton installer
 */

#install-bouton {
  /*position: absolute;
  bottom: calc(0.5*(56px - 30px));
  right: 20px;*/
  display: none;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: var(--bg-color);
  height: 30px;
  border-radius: 30px;
  padding: 0 8px;
  cursor: pointer;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  position: fixed;
  bottom: calc(56px + 28px);
  left: 16px;
}

#install-bouton>span {
  text-transform: uppercase;
  margin-left: 5px;
  font-weight: 500;
}

/*.on#install-bouton {
  display: flex;
}*/




@media (min-width: 1140px) {
  html {
    --z-notification: 32;
  }

  body {
    grid-template-rows: 1fr;
    grid-template-columns: 112px 1fr;
  }

  nav {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    --nombre-sections: 4;
    grid-template-rows: 56px repeat(var(--nombre-sections), 84px);
    grid-template-columns: auto;
    --nav-bg-color: var(--bg-color);
  }

  nav.bottom-bar {
    box-shadow: none;
  }

  .search-button {
    grid-column: 1;
  }

  .nav-link {
    align-items: center;
    /*overflow: visible;*/
  }

  .nav-link.only-pc {
    display: flex;
  }

  .nav-link.only-mobile {
    display: none;
  }

  .nav-link::before {
    --size: 112px;
  }

  .nav-link[data-section="pokedex"] {
    display: none;
  }

  nav > a > span {
    text-align: center;
  }

  /*body[data-section-actuelle=parametres] .nav-link[data-section=parametres]::before {
    animation: bulle-nav .3s var(--easing-decelerate);
  }*/

  main {
    grid-column: 2 / 3;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 1fr;
    overflow-y: hidden;
    padding: 0 8px;
  }

  #mes-chromatiques {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }

  #pokedex {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }

  body[data-section-actuelle~="mes-chromatiques"] #pokedex,
  body[data-section-actuelle~="pokedex"] #mes-chromatiques,
  body[data-section-actuelle~="parametres"] #a-propos,
  body[data-section-actuelle~="a-propos"] #parametres {
    display: grid;
  }

  body[data-section-actuelle~="pokedex"] .nav-link[data-section="mes-chromatiques"],
  body[data-section-actuelle~="parametres"] .nav-link[data-section="parametres"],
  body[data-section-actuelle~="a-propos"] .nav-link[data-section="parametres"] {
    --nav-text-color: var(--nav-text-color-on);
  }

  .titre-icones {
    display: none;
  }

  #pokedex .defer {
    display: flex;
  }

  #mes-chromatiques > .section-contenu,
  #pokedex > .section-contenu,
  #chasses-en-cours > .section-contenu,
  #partage > .section-contenu {
    padding-bottom: 0;
  }

  #pokedex .defer-loader {
    display: none;
  }

  #chasses-en-cours>.section-contenu {
    justify-content: flex-end;
    align-items: center;
  }

  body[data-section-actuelle~="parametres"] main {
    grid-template-columns: 1fr 1fr;
  }

  #parametres {
    grid-column: 1;
    grid-row: 1 / 2;
  }

  #a-propos {
    grid-column: 2;
    grid-row: 1 / 2;
  }

  .section-titre .bouton-retour {
    display: none;
  }

  .section-titre.with-button {
    padding-left: 16px;
  }

  .fab {
    bottom: 0;
    right: unset;
    left: 14px;
    --z-fab: 30;
  }

  .notification {
    padding-bottom: 0;
    height: 56px;
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    left: 16px;
    bottom: 16px;
    width: 50%;
    max-width: 500px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 5px 0 rgba(0,0,0,.14), 
                0 1px 10px 0 rgba(0,0,0,.12), 
                0 2px 4px -1px rgba(0,0,0,.2);
  }

  .fab.notif {
    --decalage: calc(-56px - 16px);
  }

  .progression-maj {
    top: 0;
  }
}
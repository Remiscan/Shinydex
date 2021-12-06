/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! ÉLÉMENTS GLOBAUX !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/*<?php ob_start();?>*/
:root[data-theme="light"] {
  color-scheme: light;
  --bg-color: rgb(224, 224, 224);
  --nav-bg-color: rgb(235, 235, 235);
  --nav-text-color: rgb(100, 100, 100);
  --nav-text-color-on: rgb(64, 81, 177);
  --nav-bubble-color: rgb(179, 186, 224);
  --text-color: rgb(33, 33, 33);
  --text-color-soft: rgb(0, 0, 0);
  --card-bg-color: rgb(245, 245, 245);
  --card-sprite-bg-color: white;
  --card-infos-text-color: rgba(0, 0, 0, 0.54);
  --notif-bg-color: rgb(245, 245, 245);
  --sprite-viewer-bg-color: rgb(255, 255, 255);
  --fab-color: hsl(231, 40%, 50%);
  --danger-color: hsl(0, 40%, 50%);
  --success-color: hsl(120, 73%, 40%);
  --failure-color: hsl(0, 53%, 40%);
  --radio-disabled-color: rgba(100, 100, 100, .2);
  --radio-off-color: rgba(100, 100, 100, .3);
  --radio-on-color: var(--fab-color);
  --radio-checked-bg-color: white;
  --radio-check-color: var(--fab-color);
  --checkbox-checked-bg-color: var(--fab-color);
  --checkbox-check-color: white;
  --switch-unchecked-bg-color: hsla(231, 0%, 50%, .7);
  --input-bg-color: white;
  --progress-bar-color: var(--fab-color);
  --button-color: var(--fab-color);
  --button-ghost-color: var(--button-color);
  --loading-bar-color: hsl(0, 0%, 37%);
  --card-edit-bg-color: rgba(240, 240, 240, .7);
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg-color: rgb(34, 34, 34);
  --nav-bg-color: rgb(48, 48, 48);
  --nav-text-color: rgb(162, 166, 173);
  --nav-text-color-on: hsl(217, 89%, 75%);
  --nav-bubble-color: rgb(65, 74, 88);
  --text-color: rgb(255, 255, 255);
  --text-color-soft: rgb(193, 193, 193);
  --card-bg-color: rgb(42, 42, 42);
  --card-sprite-bg-color: rgba(55, 55, 55);
  --card-infos-text-color: rgb(200, 200, 200);
  --notif-bg-color: rgb(45, 45, 45);
  --sprite-viewer-bg-color: rgb(0, 0, 0);
  --fab-color: hsl(231, 40%, 50%);
  --danger-color: hsl(0, 40%, 50%);
  --success-color: hsl(120, 73%, 75%);
  --failure-color: hsl(0, 53%, 75%);
  --radio-disabled-color: rgba(193, 193, 193, .3);
  --radio-off-color: rgba(193, 193, 193, .2);
  --radio-on-color: var(--fab-color);
  --radio-checked-bg-color: var(--nav-text-color-on);
  --radio-check-color: var(--nav-bg-color);
  --checkbox-checked-bg-color: var(--nav-text-color-on);
  --checkbox-check-color: var(--nav-bg-color);
  --switch-unchecked-bg-color: hsla(217, 0%, 75%, .5);
  --input-bg-color: hsl(0, 0%, 90%);
  --progress-bar-color: white;
  --button-color: var(--fab-color);
  --button-ghost-color: var(--nav-text-color-on);
  --loading-bar-color: hsl(0, 0%, 7%);
  --card-edit-bg-color: hsla(0, 0%, 7%, .7);
}
/*<?php $body = ob_get_clean();
require_once $_SERVER['DOCUMENT_ROOT'] . '/_common/components/theme-selector/build-css.php';
echo buildThemesStylesheet($body); ?>*/

html {
  --link-iconsheet: url(/shinydex/images/iconsheet.png);
  --link-pokesprite: url(/shinydex/ext/pokesprite.png);
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  --drawer-width: 270px;
  --sprite-size: 112px;

  /* Élévation */
  --z-sprite-viewer: 60;
  --z-menu-filtres: 50;
  --z-obfuscator: 40;
  --z-section-titre: 35;
  --z-loading-bar: 31;
  --z-nav: 30;
  --z-notification: 20;
  --z-fab: 10;
}

p {
  font-size: 14px;
  line-height: 24px;
  font-weight: 400;
  margin: 0;
}
p + p {
  margin-top: 16px;
}

/* Empêcher le contour bizarre que Chrome ajoute autour d'éléments en focus */
* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
*:active, 
*:focus {
	outline-style: none;
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

::-webkit-scrollbar {
  width: 0;
}
@supports (scrollbar-width: 0) {
  * {
    scrollbar-width: 0;
  }
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

.nav-link {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--nav-text-color);
  font-size: 13px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
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

shiny-stars {
  display: inline-grid;
  --color: currentColor;
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

.lien-section>sync-progress,
.sous-titre>sync-line {
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

.section-titre {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  font-size: 25px;
  font-weight: 400;
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: var(--z-section-titre);
}

.section-titre>* {
  z-index: 1;
}

.section-titre::before {
  content: '';
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--bg-color);
  opacity: .95;
  z-index: 0;
}

.spacer {
  flex-grow: 1;
}

#parametres .spacer {
  min-height: 48px;
}

.section-titre.with-button {
  padding-left: 0;
}

.titre-icones {
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
}

.icone {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  display: flex;
  justify-content: center;
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

.compteur {
	display: flex;
	justify-content: center;
	align-items: center;
  position: relative;
	font-size: 20px;
	min-width: 35px;
  height: 35px;
  box-sizing: border-box;
  margin-left: 1ch;
  padding: 0 4px;
	border-radius: 35px;
  background: var(--fab-color);
  color: white;
	letter-spacing: 0;
}

#pokedex .compteur {
  color: rgb(255, 255, 255, .7);
  font-size: 15px;
}

#pokedex .compteur > .caught {
  color: white;
  font-size: 20px;
}

#pokedex .compteur > span {
  padding: 0 0.2em;
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
}


/*
 * FAB
 */

input[type=file] + label,
button {
  all: unset;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--button-color);
  height: 32px;
  width: fit-content;
  padding: 0 16px;
  border-radius: 32px;
  margin: 8px auto;
  box-shadow: 0 4px 5px 0 rgba(0,0,0,.14),
              0 1px 10px 0 rgba(0,0,0,.12),
              0 2px 4px -1px rgba(0,0,0,.2);
  color: white;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 500;
}

input[type=file] + label.ghost,
button.ghost {
  background-color: transparent;
  color: var(--text-color);
  border: 2px solid var(--button-ghost-color);
  box-sizing: border-box;
  box-shadow: none;
}

button:disabled {
  opacity: .5;
  filter: grayscale(1);
  cursor: not-allowed;
}

button.danger.ghost {
  border-color: var(--danger-color);
}

button:not(.ghost).danger {
  background-color: var(--danger-color);
}

button>.material-icons + span {
  margin-left: 5px;
}

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

pokemon-card,
.pokemon-card {
  width: 100%;
  max-width: 500px;
  height: 120px;
  min-height: 120px;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14);
  margin: 0 auto 6px;
  background-color: var(--card-bg-color);
  display: grid;
  grid-template-columns: 120px 1fr auto;
  grid-template-rows: 1fr;
  position: relative;
  order: var(--order, 0);

}

pokemon-card + pokemon-card {
  content-visibility: auto;
  contain-intrinsic-size: 10px 126px;
}

pokemon-card pokemon-sprite,
hunt-card pokemon-sprite,
.edit-icon {
  grid-column: 1;
  grid-row: 1;
  width: 112px;
  height: 112px;
  background-color: var(--card-sprite-bg-color);
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.edit-icon {
  display: grid;
  background-color: var(--card-edit-bg-color);
  position: relative;
  opacity: 0;
}

.edit-icon>.material-icons {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  background-color: var(--card-sprite-bg-color);
  border-radius: 50%;
}

.edit-icon svg {
  width: 50px;
  height: 50px;
  position: absolute;
  overflow: visible;
}

.edit-icon circle {
  --diametre: 50;
  fill: transparent;
  stroke: var(--progress-bar-color);
  stroke-width: 2;
  --perimetre: calc(3.14 * var(--diametre));
  stroke-dasharray: var(--perimetre);
  stroke-dashoffset: var(--perimetre);
  transform: rotate(-90deg);
  transform-origin: center;
}

.pokemon-infos {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  display: grid;
  grid-template-rows: 15px auto 1fr auto 15px;
}

.pokemon-infos__nom {
  grid-row: 2 / 3;
  display: grid;
  grid-template-rows: 32px auto;
  grid-template-columns: 32px auto;
  position: relative;
  left: -16px;
}

.pokemon-ball {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  transition: all .2s var(--easing-decelerate);
  transform: translate(0) rotate(0);
}

pokemon-card[open] .pokemon-ball {
  transition: all .11s var(--easing-accelerate);
  transform: translate(15px) rotate(120deg);
}

.pokemon-espece {
  grid-row: 2 / 3;
  grid-column: 2 / 3;
  font-size: 15px;
  font-weight: 300;
  text-transform: capitalize;
  opacity: .8;
  display: flex;
  justify-content: start;
  align-items: center;
  position: relative;
  left: 25px;
  top: -6px;
}

.pokemon-surnom,
.no-surnom>.pokemon-espece {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  font-size: 24px;
  font-weight: 300;
  opacity: 1;
  display: flex;
  justify-content: start;
  align-items: center;
  text-shadow: 1px 1px var(--card-bg-color);
  position: relative;
  left: 0;
  top: 0;
}

.no-surnom>.pokemon-surnom {
  display: none;
}

.pokemon-infos__capture {
  grid-row: 4 / 5;
  color: var(--card-infos-text-color);
  font-size: 13px;
  display: grid;
  grid-template-areas:
      "icone methode compteur"
      "icone date compteur";
  grid-template-columns: 32px auto 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 0 5px;
  margin-left: 15px;
}

.pokemon-infos__capture.no-date {
  grid-template-rows: 1fr 0;
}

.pokemon-infos__capture>.icones.jeu {
	grid-area: icone;
}
.pokemon-infos__capture>.capture-methode {
  grid-area: methode;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.pokemon-infos__capture>.capture-date {
  grid-area: date;
  display: flex;
  align-items: center;
}
.pokemon-infos__capture>.methode-compteur {
  grid-area: compteur;
  align-self: start;
}
.methode-compteur>.oeuf {
  transform: translateY(2px);
}
.pokemon-infos__capture>.gigamax {
  grid-area: compteur;
  align-self: center;
}

.pokemon-icones {
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-end;
  margin: 10px;
}

.pokemon-notes {
  grid-row: 1 / 2;
  grid-column: 2 / 4;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  font-size: 13px;
  text-align: justify;
  line-height: 20px;
  color: var(--text-color);
  background-color: var(--card-bg-color);
  padding: 10px;
  z-index: 4;
  opacity: 0;
  transform: translate3d(100px, 0, 0);
  pointer-events: none;
  transition: all .1s var(--easing-accelerate);
  overflow: hidden;
}
pokemon-card[open]>.pokemon-notes {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition: all .1s var(--easing-decelerate);
}

.pokemon-notes__texte {
  margin: auto;
}

.filtered,
.off,
section:not(.defered) .defer,
.icones.explain.offborn,
.icones.explain.off {
  display: none;
}

@keyframes start-card {
  0% { opacity: 0; transform: translate3D(0, 120px, 0); }
  100% { opacity: 1; transform: translate3D(0, 0, 0); }
}

#mes-chromatiques.start pokemon-card:not(.defer) {
  animation: start-card .8s var(--easing-decelerate);
  animation-fill-mode: backwards;
  animation-delay: calc(var(--order) * .08s + .2s);
}



/* Icônes */

.icones.explain.oeuf {
  margin: 0;
  margin-right: 3px;
}



/* Shiny rate */

.shiny-rate {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: 20px;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  position: relative;
  --hue-min: 30;
  --hue-max: 170;
  background: hsl(calc(var(--hue-min) + var(--coeff) * (var(--hue-max) - var(--hue-min))), 50%, 50%);
}
.full-odds {
  background: repeating-linear-gradient(-45deg, 
    hsl(2,80%,50%) 0, 
    hsl(24,100%,50%) 5px, 
    hsl(39,100%,50%) 10px, 
    hsl(70,100%,50%) 15px, 
    hsl(158,100%,50%) 20px, 
    hsl(230,70%,50%) 25px, 
    hsl(252,100%,70%) 30px, 
    hsl(2,80%,50%) 35px
  );
}
.charm-odds {
  background: repeating-linear-gradient(-45deg, 
    mediumslateblue 0, 
    cyan 5px, 
    white 10px, 
    cyan 15px, 
    mediumslateblue 20px
  );
}
.one-odds {
  background: white;
}
.shiny-rate::before {
  content: '';
  display: block;
  position: absolute;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background-color: var(--card-bg-color);
  opacity: 1;
  top: 2px;
  left: 2px;
  border-radius: 20px;
}
.shiny-rate.with-charm {
  grid-template-columns: 13px auto;
}
.shiny-rate>div {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
}
.shiny-rate:not(.with-charm)>.shiny-charm {
  display: none;
}
.shiny-charm {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}
.shiny-charm>.charm {
  top: -2px;
  position: relative;
  margin-left: -6px !important; /* Compense le placement décrit dans iconsheet.css */
  margin-right: -3px !important;
}
.shiny-rate-text {
  color: var(--card_supporting_text_color);
  font-size: 13px;
}
.numerator.shiny-rate-text {
  font-size: 8px;
  position: absolute;
  top: 0;
  left: 0;
}
.separator.shiny-rate-text {
  opacity: .6;
  margin: 0 1px 0 3px;
  font-size: 16px;
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

.message-vide {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content min-content 1fr;
  font-size: 18px;
  color: var(--radio-off-color);
  flex-grow: 1;
  text-align: center;
  width: 60%;
  gap: 8px;
  align-self: center;
  justify-self: center;
}

.message-vide>.material-icons {
  font-size: 42px;
  grid-row: 2 / 3;
}

.message-vide>span {
  grid-row: 3 / 4;
}

section:not(.vide) .message-vide {
  display: none;
}

section.vide .defer-loader {
  display: none;
}



/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! MENU DES FILTRES !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

.menu-filtres {
  display: grid;
  grid-template-rows: 56px auto auto auto auto;
  grid-template-columns: 1fr;
  width: 100%;
  height: auto;
  min-height: 100px;
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0 8px 8px;
  box-sizing: border-box;
  background-color: var(--nav-bg-color);
  border-radius: 10px 10px 0 0;
  transform: translate3d(0, 100px, 0);
  opacity: 0;
  transition: all .1s var(--easing-standard);
  z-index: var(--z-menu-filtres);
  pointer-events: none;
}

.on.menu-filtres {
  transform: translate3d(0, 0, 0);
  opacity: 1;
  pointer-events: auto;
}

.menu-filtres>.section-titre {
  padding: 0 0 0 8px;
}
.menu-filtres>.section-titre::before {
  display: none;
}

.sous-titre {
  width: 100%;
  font-size: 18px;
  color: var(--text-color-soft);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin-bottom: 16px;
}

body:not([data-section-actuelle="pokedex"]) .sous-titre:not(:nth-child(2)) {
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

.menu-filtres .sous-titre>span {
  --bg: var(--nav-bg-color);
}

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

@keyframes apparition {
  0% { opacity: 0; }
  100% { opacity: .3; }
}

#obfuscator {
  opacity: .3;
  z-index: var(--z-obfuscator);
  animation: apparition .2s var(--easing-standard);
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

.pokedex-gen>.pkspr {
  position: relative;
  margin: 0 var(--side-margin);
  --side-margin: -2px;
}

.pokedex-gen>.got.pkspr {
  z-index: 1;
  /*--border-color: var(--text-color);
  --border-size: 1px;
  filter: drop-shadow(var(--border-size) 0 0 var(--border-color))
          drop-shadow(0 var(--border-size) 0 var(--border-color))
          drop-shadow(calc(-1 * var(--border-size)) 0 0 var(--border-color))
          drop-shadow(0 calc(-1 * var(--border-size)) 0 var(--border-color));*/
}

.pokedex-gen>:not(.got).pkspr::after {
  content: '';
  display: block;
  width: calc(100% + 2 * var(--side-margin));
  height: 100%;
  position: absolute;
  top: 0;
  left: calc(-1 * var(--side-margin));
  /*opacity: .6;*/
  opacity: .7;
  background-color: var(--card-bg-color);
}

.section-titre>load-spinner {
  transform: scale(.4);
  transform-origin: right center;
}

@keyframes apparition2 {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.loading-bar {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  display: grid;
  place-items: center;
  z-index: var(--z-loading-bar);
  --bg-color: var(--loading-bar-color);
  background-color: var(--bg-color);
  animation: apparition2 .05s linear .2s;
  animation-fill-mode: backwards;
}

.loading-bar>load-spinner {
  --size: 3em;
}

.loading-bar>load-spinner,
.loading-bar>.bouton-retour {
  grid-area: 1 / 1;
  z-index: 1;
}

body:not([data-viewer-loading]):not([data-loading]) .loading-bar {
  display: none;
}

body[data-viewer-loading] nav,
body[data-viewer-open] nav,
body[data-viewer-loading] .fab,
body[data-viewer-open] .fab,
nav.disabled,
body[data-hunt-uploading] nav,
body[data-hunt-uploading] .bouton-hunt-submit {
  pointer-events: none;
  filter: brightness(0.4) grayscale(.5);
}

body[data-hunt-uploading] .loading-bar>.bouton-retour {
  display: none;
}


/*
 * Sprite viewer
 */





/*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!! CHASSES EN COURS !!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

#chasses-en-cours>.section-contenu {
  flex-direction: column-reverse;
}

.hunt-card {
  height: auto;
  grid-template-columns: 120px 1fr;
  grid-template-rows: auto 1fr;
  order: 0;
  padding: 8px;
  box-sizing: border-box;
}

.hunt-card + .hunt-card {
  content-visibility: auto;
  contain-intrinsic-size: 10px 126px;
}

.hunt-card>pokemon-sprite {
  border-radius: 0 0 10px 0;
  grid-row: 1 / 2;
  position: relative;
  top: -8px;
  left: -8px;
}

.hunt-edit {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 13px;
  color: var(--text-color-soft);
  padding: 2px 4px;
  background-color: var(--danger-color);
  border-radius: 0 0 0 5px;
  z-index: 3;
}

.hunt-card:not(.edit)>.hunt-edit {
  display: none;
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

.hunt-card:not([data-methode="Raid Dynamax"]):not([data-methode="Œuf"]) .options-monjeu {
  display: none;
}

.hunt-card:not([data-methode="Raid Dynamax"]) .raid,
.hunt-card:not([data-methode="Œuf"]) .oeuf {
  display: none;
}

.hunt-card[data-methode="Masuda"] .options-aupif,
.hunt-card[data-methode="Pokéradar"] .options-aupif,
.hunt-card[data-methode="Pêche à la chaîne"] .options-aupif,
.hunt-card[data-methode="Chaîne au Navi-Dex"] .options-aupif,
.hunt-card[data-methode="Chaîne SOS"] .options-aupif,
.hunt-card[data-methode="Ultra-Brèche"] .options-aupif,
.hunt-card[data-methode="Chaîne de captures"] .options-aupif,
.hunt-card[data-methode="Raid Dynamax"] .options-aupif,
.hunt-card[data-methode="Sauvage (évènement)"] .options-aupif,
.hunt-card[data-methode="Sauvage (garanti)"] .options-aupif,
.hunt-card[data-methode="Glitch"] .options-aupif,
.hunt-card[data-methode="Distribution"] .options-aupif,
.hunt-card[data-methode="Échangé"] .options-aupif,
.hunt-card[data-methode="Échangé (GTS)"] .options-aupif,
.hunt-card[data-methode="Échange miracle"] .options-aupif,
.hunt-card[data-methode="Échangé (œuf)"] .options-aupif {
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

label.radio.origin-icon,
label.radio.monjeu,
label.radio.hacked,
label.radio.aupif {
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

.origin-icon>.icones,
.monjeu>.icones,
.charm>.icones,
.hacked>.icones,
.aupif>.icones {
  grid-column: 2 / 3;
}

.origin-icon>.texte,
.monjeu>.texte,
.charm>.texte,
.hacked>.texte,
.aupif>.texte {
  grid-column: 3 / 4;
}

label {
  color: var(--text-color);
}

input[type=text],
input[type=date],
input[type=password],
select {
  text-transform: capitalize;
  background-color: var(--input-bg-color);
  color: black;
  border: none;
  border-radius: 5px;
  padding: 2px 4px;
  box-shadow: inset 0 1px 2px 0px rgba(0, 0, 0, .15),
              0 0 0 1px var(--radio-disabled-color);
  font-size: 14px;
  font-family: inherit;
}

input[type=text] + select {
  margin-left: 8px;
  padding: .5rem;
}

.liste-options>input[type=text] {
  padding: .5rem;
}

select[id$="-forme"] {
  width: 16ch;
}

select[id$="-methode"] {
  width: 12ch;
}

input[type=number] {
  all: unset;
  font-size: 24px;
  text-align: center;
}

input[type=password] {
  height: 25px;
  box-sizing: border-box;
}

textarea {
  background-color: var(--input-bg-color);
  color: black;
  border: none;
  border-radius: 5px;
  padding: 2px 4px;
  box-shadow: inset 0 1px 2px 0px rgba(0, 0, 0, .15);
  font-size: 14px;
  font-family: inherit;
  width: 100%;
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
  max-width: 500px;
  color: var(--text-color-soft);
}

#parametres .sous-titre,
#a-propos .sous-titre {
  font-size: 1em;
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
  font-size: .8em;
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


/*
 * SWITCH ON/OFF (ex: Paramètres)
 */

input[type=checkbox] {
	height: 0;
  width: 0;
  margin: 0;
  opacity: 0;
  pointer-events: 0;
  position: absolute;
}

label.switch {
  display: block;
  --height: 1.625rem;
	width: calc(var(--height) * 2);
  height: var(--height);
  --padding: .1875rem;
  position: relative;
  cursor: pointer;
  border-radius: var(--height);
  background-color: var(--switch-unchecked-bg-color);
  overflow: hidden;
}

label.switch::before {
	content: '';
	display: block;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: var(--checkbox-checked-bg-color);
	opacity: 0;
  transition: opacity .2s var(--easing-decelerate);
}

label.switch::after {
  content: '';
  display: block;
  width: calc(var(--height) - 2 * var(--padding));
	height: calc(var(--height) - 2 * var(--padding));
	position: absolute;
	top: var(--padding);
	left: var(--padding);
  background-color: var(--bg-color);
	border-radius: var(--height);
  transition: transform .2s var(--easing-decelerate);
}

input:checked + label.switch::before {
  opacity: 1;
}

input:checked + label.switch::after {
	transform: translateX(calc(2.875rem - 100%));
}


/*
 * INPUT TYPE RADIO (ex: Choix des filtres)
 */

input[type=radio] {
	height: 0;
  width: 0;
  margin: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

label.radio {
  display: grid;
  grid-template-columns: 25px auto;
  gap: 0 5px;
  min-height: 24px;
  padding: 2px;
  padding-right: 7px;
  margin: 0 0 8px 8px;
  position: relative;
  cursor: pointer;
  border-radius: 24px;
  border: 2px solid var(--radio-off-color);
  overflow: hidden;
}

label.radio>span {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  margin: auto;
  font-size: 14px;
}

label.radio::before {
	content: '';
  display: flex;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
	width: 20px;
	height: 20px;
  background-color: var(--input-bg-color);
  border-radius: 20px;
  margin: auto;
  box-shadow: inset 0 0 2px 1px rgba(0, 0, 0, .3);
}

label.radio::after {
  content: '';
  display: flex;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 10px;
	height: 10px;
	background-color: var(--radio-check-color);
  border-radius: 6px;
  opacity: 0;
  margin: auto;
}

input:checked + label.radio {
  border-color: var(--nav-text-color-on);
}

input:checked + label.radio::before {
  background-color: var(--radio-checked-bg-color);
}

input:checked + label.radio::after {
  opacity: 1;
}


/*
 * INPUT TYPE CHECKBOX (ex: Choix des filtres)
 */

label.checkbox {
  display: grid;
  grid-template-columns: 25px auto;
  gap: 0 5px;
  min-height: 24px;
  padding: 2px;
  padding-right: 7px;
  margin: 0 0 8px 8px;
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  border: 2px solid var(--radio-off-color);
  overflow: hidden;
}

label.checkbox>span {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  margin: auto;
  font-size: 14px;
}

label.checkbox::before {
	content: '';
  display: flex;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
	width: 20px;
  height: 20px;
  border-radius: 2px;
  background-color: var(--input-bg-color);
  margin: auto;
  box-shadow: inset 0 0 2px 1px rgba(0, 0, 0, .3);
}

label.checkbox::after {
  content: '';
  display: flex;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 8px;
  height: 14px;
  box-sizing: border-box;
  border-right: 3px solid var(--checkbox-check-color);
  border-bottom: 3px solid var(--checkbox-check-color);
  transform: translateY(-2px) rotate(45deg);
  opacity: 0;
  margin: auto;
}

input:checked + label.checkbox {
  border-color: var(--nav-text-color-on);
}

input:checked + label.checkbox::before {
  background-color: var(--checkbox-checked-bg-color);
}

input:checked + label.checkbox::after {
  opacity: 1;
}

.un-parametre.theme label.radio {
  margin: 0;
}

input:disabled + label.radio,
input:disabled + label.checkbox,
input:disabled + label.switch {
  opacity: .5;
  filter: grayscale(1);
  cursor: not-allowed;
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
  font-size: 14px;
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
  opacity: .2;
  margin-right: -15px;
  font-size: 12px;
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
  background-color: black;
  opacity: .3;
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
  font-size: 14px;
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
  font-size: 13px;
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
    grid-template-rows: repeat(var(--nombre-sections), 84px);
    grid-template-columns: auto;
    padding-top: 56px;
    --nav-bg-color: var(--bg-color);
  }

  nav.bottom-bar {
    box-shadow: none;
  }

  .nav-link {
    align-items: center;
    overflow: visible;
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

  body[data-section-actuelle~="parametres"] .nav-link[data-section="parametres"] {
    --nav-text-color: var(--nav-text-color-on);
  }

  main {
    grid-column: 2 / 3;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: calc(8px + 500px + 16px + 380px + 8px) 1fr;
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

  body[data-section-actuelle~="mes-chromatiques"] #pokedex {
    display: grid;
  }

  .titre-icones {
    display: none;
  }

  #pokedex .defer {
    display: flex;
  }

  #mes-chromatiques>.section-contenu,
  #pokedex>.section-contenu {
    padding-bottom: 0;
  }

  #pokedex .defer-loader {
    display: none;
  }

  #chasses-en-cours>.section-contenu {
    justify-content: flex-end;
    align-items: center;
  }

  body[data-section-actuelle~="parametres"] #a-propos {
    display: grid;
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

  pokemon-card {
    overflow: visible;
    margin: 0 0 6px 0;
  }

  .hunt-card>pokemon-sprite {
    border-radius: 10px 0 10px 0;
    z-index: 3;
  }

  .pokemon-notes {
    opacity: 1;
    position: absolute;
    top: 0;
    left: calc(100% + 16px);
    transform: none;
    border-radius: 10px;
    overflow: visible;
  }

  .pokemon-notes::before {
    content: '';
    display: block;
    position: absolute;
    width: 0;
    height: 0;
    border: 7px solid transparent;
    border-right: 7px solid var(--card-bg-color);
    top: calc(50% - 7px);
    left: -14px;
  }

  pokemon-card[open] .pokemon-ball {
    transform: translate(0) rotate(0);
  }

  .menu-filtres {
    width: 500px;
    left: 128px;
  }

  .loading-bar {
    grid-row: 1 / 2;
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
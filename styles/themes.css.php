/*<?php themeSheetStart(); ?>*/
:root[data-theme="light"] {
  color-scheme: light;
  --bg-color: rgb(224, 224, 224);
  --accent-color: rgb(64, 81, 177);
  --soft-accent-color : #c0caea;
  --nav-bg-color: rgb(235, 235, 235);
  --nav-text-color: rgb(100, 100, 100);
  --nav-bubble-color: rgb(179, 186, 224);
  --text-color: rgb(33, 33, 33);
  --text-color-soft: rgb(0, 0, 0);
  --card-bg-color: rgb(245, 245, 245);
  --card-sprite-bg-color: white;
  --card-menu-bg-color: rgba(255, 255, 255, .7);
  --card-infos-text-color: rgba(0, 0, 0, 0.54);
  --notif-bg-color: rgb(245, 245, 245);
  --sprite-viewer-bg-color: rgb(255, 255, 255);
  --danger-color: #b04041;
  --success-color: hsl(120, 73%, 40%);
  --soft-success-color: #b2e1ae;
  --failure-color: hsl(0, 53%, 40%);
  --radio-disabled-color: rgba(100, 100, 100, .2);
  --radio-off-color: rgba(100, 100, 100, .3);
  --radio-checked-bg-color: white;
  --radio-check-color: var(--accent-color);
  --switch-unchecked-bg-color: hsl(231, 0%, 50%);
  --button-hover-color: rgb(64, 81, 177, .15);
  --button-active-color: rgb(64, 81, 177, .2);
  --input-bg-color: white;
  --progress-bar-color: var(--accent-color);
  --card-edit-bg-color: rgba(240, 240, 240, .7);
  --dark-coeff: 0;
  --pkmnicon-opacity: .3;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg-color: rgb(34, 34, 34);
  --accent-color: hsl(217, 89%, 75%);
  --soft-accent-color: #212f45;
  --nav-bg-color: rgb(48, 48, 48);
  --nav-text-color: rgb(162, 166, 173);
  --nav-bubble-color: rgb(65, 74, 88);
  --text-color: rgb(255, 255, 255);
  --text-color-soft: rgb(193, 193, 193);
  --card-bg-color: rgb(42, 42, 42);
  --card-sprite-bg-color: rgba(55, 55, 55);
  --card-menu-bg-color: rgba(55, 55, 55, .7);
  --card-infos-text-color: rgb(200, 200, 200);
  --notif-bg-color: rgb(45, 45, 45);
  --sprite-viewer-bg-color: rgb(0, 0, 0);
  --danger-color: #f88788;
  --success-color: hsl(120, 73%, 75%);
  --soft-success-color: #244224;
  --failure-color: hsl(0, 53%, 75%);
  --radio-disabled-color: rgba(193, 193, 193, .3);
  --radio-off-color: rgba(193, 193, 193, .2);
  --radio-checked-bg-color: var(--accent-color);
  --radio-check-color: var(--nav-bg-color);
  --switch-unchecked-bg-color: hsla(217, 0%, 55%);
  --button-hover-color: hsl(217, 89%, 75%, .15);
  --button-active-color: hsl(217, 89%, 75%, .2);
  --input-bg-color: hsl(0, 0%, 90%);
  --progress-bar-color: white;
  --card-edit-bg-color: hsla(0, 0%, 7%, .7);
  --dark-coeff: 1;
  --pkmnicon-opacity: .5;
}
/*<?php themeSheetEnd(closeComment: true); ?>*/

:root {
  --nav-text-color-on: var(--accent-color);
  --text-color-inverse: var(--bg-color);
  --fab-color: var(--accent-color);
  --radio-on-color: var(--accent-color);
  --checkbox-checked-bg-color: var(--accent-color);
  --button-color: var(--accent-color);
}
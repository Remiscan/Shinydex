/*<?php echo '*'.'/';
require_once dirname(__DIR__, 2)."/colori/lib/dist/colori.php";
echo '/'.'*'; ?>*/

/*<?php themeSheetStart(); ?>*/
:root[data-theme="light"] {
  color-scheme: light;
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

  --primary: var(--primary-40);
  --on-primary: var(--primary-100);
  --primary-container: var(--primary-90);
  --on-primary-container: var(--primary-10);

  --secondary: var(--secondary-40);
  --on-secondary: var(--secondary-100);
  --secondary-container: var(--secondary-90);
  --on-secondary-container: var(--secondary-10);

  --tertiary: var(--tertiary-40);
  --on-tertiary: var(--tertiary-100);
  --tertiary-container: var(--tertiary-90);
  --on-tertiary-container: var(--tertiary-10);

  --error: var(--error-40);
  --on-error: var(--error-100);
  --error-container: var(--error-90);
  --on-error-container: var(--error-10);

  --success: var(--success-40);
  --on-success: var(--success-100);
  --success-container: var(--success-90);
  --on-success-container: var(--success-10);

  --background: var(--neutral-99);
  --on-background: var(--neutral-10);
  --surface: var(--neutral-99);
  --on-surface: var(--neutral-10);

  --surface-variant: var(--neutral-variant-90);
  --on-surface-variant: var(--neutral-variant-30);
  --outline: var(--neutral-variant-50);
  --outline-variant: var(--neutral-variant-80);

  --shadow: var(--neutral-0);
  --inverse-surface: var(--neutral-20);
  --inverse-on-surface: var(--neutral-95);
  --inverse-primary: var(--primary-80);
  --scrim: var(--neutral-0);
}

:root[data-theme="dark"] {
  color-scheme: dark;
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

  --primary: var(--primary-80);
  --on-primary: var(--primary-20);
  --primary-container: var(--primary-30);
  --on-primary-container: var(--primary-90);

  --secondary: var(--secondary-80);
  --on-secondary: var(--secondary-20);
  --secondary-container: var(--secondary-30);
  --on-secondary-container: var(--secondary-90);

  --tertiary: var(--tertiary-80);
  --on-tertiary: var(--tertiary-20);
  --tertiary-container: var(--tertiary-30);
  --on-tertiary-container: var(--tertiary-90);

  --error: var(--error-80);
  --on-error: var(--error-20);
  --error-container: var(--error-30);
  --on-error-container: var(--error-90);

  --success: var(--success-80);
  --on-success: var(--success-20);
  --success-container: var(--success-30);
  --on-success-container: var(--success-90);

  --background: var(--neutral-10);
  --on-background: var(--neutral-90);
  --surface: var(--neutral-10);
  --on-surface: var(--neutral-90);

  /*--surface-variant: var(--neutral-variant-30);*/
  --surface-variant: var(--neutral-variant-20);
  --on-surface-variant: var(--neutral-variant-80);
  --outline: var(--neutral-variant-60);
  --outline-variant: var(--neutral-variant-30);

  --shadow: var(--neutral-0);
  --inverse-surface: var(--neutral-90);
  --inverse-on-surface: var(--neutral-20);
  --inverse-primary: var(--primary-40);
  --scrim: var(--neutral-0);
}
/*<?php themeSheetEnd(closeComment: true); ?>*/

:root {
  --easing-standard: cubic-bezier(.2, 0, 0, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0, 1);
  --easing-accelerate: cubic-bezier(.3, 0, 1, 1);
  --easing-emphasized-standard: cubic-bezier(.3, 0, 0, 1);
  --easing-emphasized-decelerate: cubic-bezier(.05, .7, .1, 1);
  --easing-emphasized-accelerate: cubic-bezier(.3, 0, .8, .15);
  --elevation-1-opacity: .05;
  --elevation-2-opacity: .08;
  --elevation-3-opacity: .11;
  --elevation-4-opacity: .12;
  --elevation-5-opacity: .14;
  --elevation-1-shadow: 0px 1px 2px 0px rgb(var(--shadow), .3),
                        0px 1px 3px 1px rgb(var(--shadow), .15);
  --elevation-2-shadow: 0px 1px 2px 0px rgb(var(--shadow), .3),
                        0 2px 6px 2px rgb(var(--shadow), .15);
  --elevation-3-shadow: 0px 1px 3px 0px rgb(var(--shadow), .3),
                        0 4px 8px 3px rgb(var(--shadow), .15);
  --elevation-4-shadow: 0px 2px 3px 0px rgb(var(--shadow), .3),
                        0 6px 12px 4px rgb(var(--shadow), .15);
  --elevation-5-shadow: 0px 4px 4px 0px rgb(var(--shadow), .3),
                        0 8px 12px 6px rgb(var(--shadow), .15);
  --state-hover-opacity: .08;
  --state-focus-opacity: .12;
  --state-active-opacity: .12;
  --state-dragged-opacity: .16;
}

:root {
  --bg-color: rgb(var(--background));
  --accent-color: rgb(var(--primary));
  --soft-accent-color: rgb(var(--primary-container));
  --nav-text-color: rgb(var(--on-surface-variant));
  --nav-text-color-on: rgb(var(--on-surface));
  --nav-active-bg: rgb(var(--secondary-container));
  --nav-bubble-color: rgb(var(--primary));

  --text-color-inverse: var(--bg-color);
  --fab-color: var(--accent-color);
  --radio-on-color: var(--accent-color);
  --checkbox-checked-bg-color: var(--accent-color);
  --button-color: var(--accent-color);
}

.primary {
  --surface-tint: var(--primary);
  --state-tint: var(--on-primary);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.primary-container {
  --surface-tint: var(--primary-container);
  --state-tint: var(--on-primary-container);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.secondary {
  --surface-tint: var(--secondary);
  --state-tint: var(--on-secondary);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.secondary-container {
  --surface-tint: var(--secondary-container);
  --state-tint: var(--on-secondary-container);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.tertiary {
  --surface-tint: var(--tertiary);
  --state-tint: var(--on-tertiary);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.tertiary-container {
  --surface-tint: var(--tertiary-container);
  --state-tint: var(--on-tertiary-container);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.error {
  --surface-tint: var(--error);
  --state-tint: var(--on-error);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.error-container {
  --surface-tint: var(--error-container);
  --state-tint: var(--on-error-container);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.background {
  --surface-tint: var(--background);
  --state-tint: var(--on-background);
  background-color: rgb(var(--surface-tint));
  color: rgb(var(--state-tint));
}

.standard {
  --surface-color: var(--surface);
}

.variant {
  --surface-color: var(--surface-variant);
}

.surface {
  background-color: rgb(var(--surface-color, var(--surface)), var(--surface-opacity, 1));
  background-image: linear-gradient(to bottom, rgb(var(--state-tint, var(--on-primary)), var(--state-opacity, 0)) 0% 100%),
                    linear-gradient(to bottom, rgb(var(--surface-tint, var(--primary)), var(--elevation-opacity, 0)) 0% 100%);
  color: rgb(var(--on-surface));
  transition: box-shadow .3s var(--easing-standard);
}

.elevation-primary {
  --surface-tint: var(--primary);
  --state-tint: var(--on-primary);
}

.elevation-secondary {
  --surface-tint: var(--secondary);
  --state-tint: var(--on-secondary);
}

.elevation-tertiary {
  --surface-tint: var(--tertiary);
  --state-tint: var(--on-tertiary);
}

.elevation-1 {
  --elevation-opacity: var(--elevation-1-opacity);
}

.elevation-2 {
  --elevation-opacity: var(--elevation-2-opacity);
}

.elevation-3 {
  --elevation-opacity: var(--elevation-3-opacity);
}

.elevation-4 {
  --elevation-opacity: var(--elevation-4-opacity);
}

.elevation-5 {
  --elevation-opacity: var(--elevation-5-opacity);
}

.shadow {
  box-shadow: var(--elevation-shadow, none);
}

.elevation-1.shadow {
  --elevation-shadow: var(--elevation-1-shadow);
}

.elevation-2.shadow {
  --elevation-shadow: var(--elevation-2-shadow);
}

.elevation-3.shadow {
  --elevation-shadow: var(--elevation-3-shadow);
}

.elevation-4.shadow {
  --elevation-shadow: var(--elevation-4-shadow);
}

.elevation-5.shadow {
  --elevation-shadow: var(--elevation-5-shadow);
}

.interactive {
  --state-hover-opacity: .08;
  --state-focus-opacity: .12;
  --state-active-opacity: .12;
  --state-dragged-opacity: .16;
}

.interactive:focus-visible {
  --state-opacity: var(--state-focus-opacity);
}

.interactive:hover {
  --state-opacity: var(--state-hover-opacity);
}

.interactive:active {
  --state-opacity: var(--state-active-opacity);
}

/* Empêcher le contour bizarre que Chrome ajoute autour d'éléments en focus */
* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
} 
*:focus:not(:focus-visible) {
	outline-style: none;
}



/* Typography */

/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../ext/roboto-regular-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../ext/roboto-regular-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* latin-ext */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('../ext/roboto-medium-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('../ext/roboto-medium-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

.display-large {
  line-height: 4rem;
  font-size: 3.5625rem;
  font-weight: 400;
}

.display-medium {
  line-height: 3.25rem;
  font-size: 2.8125rem;
  font-weight: 400;
}

.display-small {
  line-height: 2.75rem;
  font-size: 2.25rem;
  font-weight: 400;
}

.headline-large {
  line-height: 2.5rem;
  font-size: 2rem;
  font-weight: 400;
}

.headline-medium {
  line-height: 2.25rem;
  font-size: 1.75rem;
  font-weight: 400;
}

.headline-small {
  line-height: 2rem;
  font-size: 1.75rem;
  font-weight: 400;
}

.title-large {
  line-height: 1.75rem;
  font-size: 1.375rem;
  font-weight: 400;
}

.title-medium {
  line-height: 1.5rem;
  font-size: 1rem;
  letter-spacing: .009375rem;
  font-weight: 500;
}

.title-small {
  line-height: 1.25rem;
  font-size: 0.875rem;
  letter-spacing: .007143rem;
  font-weight: 500;
}

.label-large {
  line-height: 1.25rem;
  font-size: .875rem;
  letter-spacing: .007143rem;
  font-weight: 500;
}

.label-medium {
  line-height: 1rem;
  font-size: .75rem;
  letter-spacing: .04167rem;
  font-weight: 500;
}

.label-small {
  line-height: 1rem;
  font-size: .6875rem;
  letter-spacing: .04545rem;
  font-weight: 500;
}

.body-large {
  line-height: 1.5rem;
  font-size: 1rem;
  letter-spacing: .003125rem;
  font-weight: 400;
}

.body-medium {
  line-height: 1.25rem;
  font-size: .875rem;
  letter-spacing: .001786rem;
  font-weight: 400;
}

.body-small {
  line-height: 1rem;
  font-size: .75rem;
  letter-spacing: .003333rem;
  font-weight: 400;
}
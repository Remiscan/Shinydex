// @ts-expect-error
import Couleur from 'colori';
// @ts-expect-error
import DefPalette from '../../../colori/palette/palette.js';



let currentPalette: MaterialLikePalette;
let currentTheme: 'light' | 'dark';



const CIElightnesses = [1, .99, .98, .96, .95, .94, .92, .9, .87, .8, .7, .6, .5, .4, .3, .24, .22, .2, .17, .12, .1, .06, .04, 0];

class Palette extends DefPalette {
  toCSS() {
    let css = ``;
    // @ts-ignore
    for (const [label, colors] of this.colors) {
      for (let k = 0; k < colors.length; k++) {
        const color = colors[k];
        // @ts-ignore
        const lightness = CIElightnesses[k];
        css += `--${label}-${String(100 * lightness).replace(/[^0-9]/g, '_')}:${color.rgb.slice(4, -1)};`;
      }
    }
    return css;
  }
}



export function updateMetaThemeColorTag(palette: MaterialLikePalette = currentPalette, color: string = 'surface') {
  const metaTags = [
    document.querySelector("meta[name=theme-color]"),                                  // for mobile layout
    document.querySelector(`meta[name="theme-color"][id="medium-layout-theme-color"]`) // for medium and large layouts
  ];
  if (!(palette instanceof MaterialLikePalette)) return;

  for (const tag of metaTags) {
    if (!tag) continue;
    const colorLabel = tag.getAttribute('data-forced-color') || color || tag.getAttribute('data-current-color') || 'surface';
    const themeColorLightness = colorLabel === 'surface-container' ? (currentTheme === 'dark' ? .12 : .94)
                                                                   : (currentTheme === 'dark' ? .06 : .99);
    // @ts-expect-error
    const themeColorExpr = palette.colors.get('neutral')[CIElightnesses.findIndex(l => l === themeColorLightness)].rgb;
    tag.setAttribute('content', themeColorExpr);
    tag.setAttribute('data-current-color', colorLabel);
  }
}



/** Application du thème (clair ou sombre). */
export function setTheme(askedTheme?: string) {
  let html = document.documentElement;
  html.dataset.theme = askedTheme || html.dataset.theme || '';

  // Thème par défaut
  const defaultTheme = 'dark';

  // Thème préféré selon l'OS
  let osTheme: 'light' | 'dark' | undefined;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

  // Thème appliqué (askedTheme > osTheme > defaultTheme)
  let theme: 'light' | 'dark' = 'light';
  switch (askedTheme) {
    case 'light':
    case 'dark':
      theme = askedTheme;
      break;
    default:
      theme = osTheme || defaultTheme;
  }
  currentTheme = theme ?? 'light';
  
  updateMetaThemeColorTag();
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}



// Material Design 3-like color palette generator
const materialLikeGenerator = function(hue: number) {
  // Compute the lightnesses used for palette generation
  const OKLRCHlightnesses = [];
  for (const ciel of CIElightnesses) {
    const grey = new Couleur(`lch(${ciel * 100}% 0 0)`);
    OKLRCHlightnesses.push(grey.valuesTo('oklrch')[0]);
  }
  OKLRCHlightnesses[0] = 1;

  return {
    lightnesses: OKLRCHlightnesses,
    colors: [
      { label: 'primary', chroma: .1101, hue: hue },
      { label: 'secondary', chroma: .0357, hue: hue },
      { label: 'tertiary', chroma: .0605, hue: hue + 60},
      { label: 'success', chroma: .1783, hue: 143 },
      { label: 'error', chroma: .1783, hue: 28 },
      { label: 'neutral', chroma: .0132, hue: hue },
      { label: 'neutral-variant', chroma: .0182, hue: hue }
    ]
  };
};

class MaterialLikePalette extends Palette {
  constructor(hue: number) {
    // @ts-ignore
    super(hue, materialLikeGenerator);
  }

  toCSS(): string { return super.toCSS(); }
}


/** Computes the color palette based on the selected hue. */
export function updateThemeHue(hue: number): MaterialLikePalette {
  const palette = new MaterialLikePalette(hue);
  currentPalette = palette;
  return palette;
}


/**
 * Observes when a section gets scrolled in, and adapts the theme-color
 * and the section's title background color.
 */
export const scrollObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const section = entry.target.closest('section');
    if (!section) continue;

    const sectionID = section.id;

    if (!(document.body.matches(`[data-section-actuelle~="${sectionID}"]`))) continue;
    const sectionTitre = section.querySelector('.section-titre');
    if (entry.intersectionRatio >= 1) {
      sectionTitre?.classList.add('at-top');
      updateMetaThemeColorTag(currentPalette, 'surface');
    } else {
      sectionTitre?.classList.remove('at-top');
      updateMetaThemeColorTag(currentPalette, 'surface-container');
    }
  }
}, {
  threshold: [1],
});
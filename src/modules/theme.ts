// @ts-expect-error
import Couleur from 'colori';
// @ts-expect-error
import DefPalette from '../../../colori/palette/palette.js';



const gradient = Couleur.interpolateInSteps('oklch(70% 0.19 1)', 'oklch(70% 0.19 360)', 25, { interpolationSpace: 'oklch', hueInterpolationMethod: 'longer' });
const gradientString = `linear-gradient(to right, ${gradient.map((c: Couleur) => c.rgb).join(', ')})`;
(document.querySelector('form[name="app-settings"] [name="theme-hue"]') as HTMLElement)?.style.setProperty('--gradient', gradientString);

export const metaThemeColors = {
  light: null,
  dark: null
};



class Palette extends DefPalette {
  toCSS() {
    let css = ``;
    // @ts-ignore
    for (const [label, colors] of this.colors) {
      for (let k = 0; k < colors.length; k++) {
        const color = colors[k];
        // @ts-ignore
        const lightness = this.lightnesses[k];
        css += `--${label}-${String(100 * lightness).replace(/[^0-9]/g, '_')}:${color.rgb.slice(4, -1)};`;
      }
    }
    return css;
  }
}



export function updateMetaThemeColorTag() {
  const themeColor = `rgb(${String(getComputedStyle(document.documentElement).getPropertyValue('--background')).trim()})`;
  document.querySelector("meta[name=theme-color]")!.setAttribute('content', themeColor);
}



/** Application du thème (clair ou sombre). */
export function setTheme(askedTheme?: string) {
  let html = document.documentElement;
  html.dataset.theme = askedTheme || html.dataset.theme || '';

  // Thème par défaut
  const defaultTheme = 'dark';

  // Thème préféré selon l'OS
  let osTheme;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

  // Thème appliqué (askedTheme > osTheme > defaultTheme)
  const theme = ['light', 'dark'].includes(askedTheme || '') ? askedTheme : (osTheme || defaultTheme);
  
  updateMetaThemeColorTag();
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}



// Material Design 3-like color palette generator
const materialLikeGenerator = function(hue: number) {
  return {
    lightnesses: [1, .99, .98, .96, .95, .94, .92, .9, .87, .8, .7, .6, .5, .4, .3, .24, .22, .2, .17, .12, .1, .06, .04, 0],
    colors: [
      { label: 'primary', chroma: .1305, hue: hue },
      { label: 'secondary', chroma: .0357, hue: hue },
      { label: 'tertiary', chroma: .0605, hue: hue + 60},
      { label: 'success', chroma: .1783, hue: 143 },
      { label: 'error', chroma: .1783, hue: 28 },
      { label: 'neutral', chroma: .0058, hue: hue },
      { label: 'neutral-variant', chroma: .0178, hue: hue }
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


/** Computes the color palette CSS based on the selected hue. */
export function computePaletteCss(hue: number): string {
  const palette = new MaterialLikePalette(hue);
  return palette.toCSS();
}
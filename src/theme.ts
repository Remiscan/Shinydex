// @ts-expect-error
import Couleur from 'colori';
// @ts-expect-error
import Palette from '../../colori/palette/palette.js';



const gradient = Couleur.interpolateInSteps('oklch(70% 0.19 0)', 'oklch(70% 0.19 359)', 25, { interpolationSpace: 'oklch', hueInterpolationMethod: 'longer' });
export const gradientString = `linear-gradient(to right, ${gradient.map((c: Couleur) => c.rgb).join(', ')})`;



/** Application du thème (clair ou sombre). */
export function setTheme(askedTheme?: string) {
  let html = document.documentElement;
  html.dataset.theme = askedTheme || '';

  // Thème par défaut
  const defaultTheme = 'dark';

  // Thème préféré selon l'OS
  let osTheme;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) osTheme = 'dark';
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) osTheme = 'light';

  // Thème appliqué (askedTheme > osTheme > defaultTheme)
  const theme = ['light', 'dark'].includes(askedTheme || '') ? askedTheme : (osTheme || defaultTheme);
  
  let themeColor = (theme == 'dark') ? 'rgb(34, 34, 34)' : 'rgb(224, 224, 224)';
  document.querySelector("meta[name=theme-color]")!.setAttribute('content', themeColor);

  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}



// Material Design 3-like color palette generator
const materialLikeGenerator = function(hue: number) {
  return {
    lightnesses: [1, .99, .95, .9, .8, .7, .6, .5, .4, .3, .2, .1, 0],
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
    super(hue, materialLikeGenerator);
  }

  toCSS(): string { return super.toCSS(); }
}


/** Computes the color palette CSS based on the selected hue. */
export function computePaletteCss(hue: number): string {
  const palette = new MaterialLikePalette(hue);
  return palette.toCSS();
}
import { confetti } from '../../../ext/confetti.min.js';
// @ts-expect-error
import Couleur from 'colori';



export function sendConfetti(params: { [key: string]: unknown }) {
	if (!('colors' in params)) {
		const baseColor = new Couleur(
			`rgb(${getComputedStyle(document.documentElement).getPropertyValue('--primary')})`
		);

		params.colors = [
			baseColor.hex,
			baseColor.replace('okh', baseColor.okh - 120).hex,
			baseColor.replace('okh', baseColor.okh - 60).hex,
			baseColor.replace('okh', baseColor.okh + 60).hex,
			baseColor.replace('okh', baseColor.okh + 120).hex,
		];
	}

	params.startVelocity = params.startVelocity ?? 15;
	params.ticks = params.ticks ?? 75;
	params.gravity = params.gravity = .1;
	params.shapes = params.shapes ?? [
		// @ts-ignore
		confetti.shapeFromPath({ path: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9z' })
	];
	params.scalar = params.scalar ?? .4;
	params.disableForReducedMotion = params.disableForReducedMotion ?? true;

	// @ts-ignore
	confetti(params);
}

export { confetti };

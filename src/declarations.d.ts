declare module '*.css' {
	const content: CSSStyleSheet;
	export default content;
}

declare module '*.css.php' {
	const content: CSSStyleSheet;
	export default content;
}

declare interface Document {
	startViewTransition: (callback: () => void | Promise<void>) => Promise<void>;
}
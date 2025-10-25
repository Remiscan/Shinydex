import type { SupportedLang } from "./jsonData.js";



export const supportsAutoTranslation = 'LanguageDetector' in self && 'Translator' in self;
document.body.setAttribute('data-supports-auto-translation', supportsAutoTranslation ? 'true' : 'false');

export async function autoDetectLanguage(text: string): Promise<string | undefined> {
	if ('LanguageDetector' in self) {
		const detector = await (self.LanguageDetector as any).create();
		const results = await detector.detect(text);
		if (results && results.length > 0 && results[0].confidence > 0.7) {
			return results[0].detectedLanguage;
		}
	}
	return;
}

export async function autoTranslate(
	text: string,
	sourceLanguage: string,
	targetLanguage: SupportedLang,
): Promise<string | undefined> {
	if ('Translator' in self) {
		const translator = await (self.Translator as any).create({ sourceLanguage, targetLanguage });
		return await translator.translate(text);
	}
	return undefined;
}

export async function autoDetectLanguageAndTranslate(text: string, targetLanguage: SupportedLang): Promise<string | undefined> {
	const detectedLanguage = await autoDetectLanguage(text);
	if (detectedLanguage && detectedLanguage !== targetLanguage) {
		return await autoTranslate(text, detectedLanguage, targetLanguage);
	}
	return undefined;
}
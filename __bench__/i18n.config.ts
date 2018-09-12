import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { reactI18nextModule } from 'react-i18next';

i18next
	.use(LanguageDetector)
	.use(reactI18nextModule)
	.init({
		fallbackLng: 'en',
		ns: ['translations'],
		defaultNS: 'translations',
		interpolation: {
			escapeValue: false,
		},
		react: {
			wait: true,
		},
	})
;

export {
	i18next,
};
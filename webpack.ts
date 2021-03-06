import transformerFactory, {
	contextedPhrasesForEach,
	contextedPhrasesFilter,
} from './src/transformer/transformer';
import { Extractor } from './src/webpack/plugin';

export {
	transformerFactory as i18nTx,
	Extractor as i18nExtractor,

	contextedPhrasesForEach,
	contextedPhrasesFilter,
};

import { AllHtmlEntities } from 'html-entities';

const entities = {};
const R_ENTITIES = /&[a-z]+;/g;
const AMP = '&';
const decoder = new AllHtmlEntities();

export function htmlDecode(text: string) {
	return text.indexOf(AMP) > -1
		? text.replace(R_ENTITIES, htmlEntityDecode)
		: text
	;
}

export function htmlEntityDecode(entity: string) {
	if (!entities.hasOwnProperty(entity)) {
		entities[entity] = decoder.decode(entity);
	}

	return entities[entity];
}
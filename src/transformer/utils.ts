import * as ts from 'typescript';
import { Element, Simple } from 'format-message-parse';

export function normJsxElement(node: ts.JsxElement | ts.JsxSelfClosingElement,) {
	return ts.isJsxElement(node) ? node.openingElement : node;
}

export function getJsxTagName(node: ts.JsxElement | ts.JsxSelfClosingElement,) {
	return normJsxElement(node).tagName.getText();
}

export function log(obj: object | string | number | boolean, ind = '', max = 3) {
	if (obj == null || /number|string|boolean/.test(typeof obj)) {
		console.log(obj);
		return;
	}

	const copy = {...Object(obj)};
	let lines = [];
	delete copy['parent'];

	for (let key in copy) {
		lines.push(
			`${ind}${key}: ` + (
			copy[key] === null ? 'null' :
				typeof copy[key] === 'object'
					? max > 0 ? '\n' + log(copy[key], ind + '  ', max - 1) : '{ ... }'
					: copy[key]
		));
	}

	if (ind === '') {
		console.log(lines.join('\n'));
	}

	return lines.join('\n');
}
import * as ts from 'typescript';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { existsSync, readFileSync } from 'fs';
import i18nTxt from './transformer';
import i18nText from '../../text';
import i18nJSX from '../../jsx';


const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.Preserve,
    removeComments: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
};

function fixDir(name: string) {
	return name[0] === '/' ? name : `${__dirname}/fixture/${name}`;
}

export function transform(name: string, options: ts.CompilerOptions = {}) {
    const path = fixDir(name);
    const fileName = existsSync(`${path}.ts`) ? `${path}.ts` : `${path}.tsx`;
    const output = ts.transpileModule(readFileSync(fileName) + '', {
        fileName: fileName,
        compilerOptions: {
            ...compilerOptions,
            ...options
        },
        transformers: {
            before: [
                i18nTxt({
                    exclude: ['/icu/'],
                }),
            ],
        },
    });

    return `${output.outputText.trim()}\n`;
}


export function reactLoad(name: string): any {
	try {
		const exports = {};
		const source = transform(name, {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES5,
			jsx: ts.JsxEmit.React,
		});

		Function('exports, require', source)(
			exports,
			(name: string) => {
				if (name === 'tx-i18n/text') {
					return {default: i18nText};
				} else if (name === 'tx-i18n/jsx') {
					return {default: i18nJSX};
				} else if (name.substr(0, 2) === './') {
					return reactLoad(name.substr(2));
				} else if (name.substr(0, 2) === '..') {
					return reactLoad(fixDir(name));
				} else {
					return require(name);
				}
			},
		);

		// console.log('>>>', name);
		// console.log(source);

		return exports;
	} catch (err) {
		console.error(err);
	}
}

export function reactRender(Block: any, props: object = {}) {
	return renderer
		.create(React.createElement(Block, props))
		.toJSON()
	;
}
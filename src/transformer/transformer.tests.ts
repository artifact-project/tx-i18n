import * as ts from 'typescript';
import {readFileSync, existsSync} from 'fs';
import transformerFactory from './transformer';

const compilerOptions: Partial<ts.CompilerOptions> = {
	module: ts.ModuleKind.ESNext,
	target: ts.ScriptTarget.ESNext,
	jsx: ts.JsxEmit.Preserve,
	moduleResolution: ts.ModuleResolutionKind.NodeJs,
};

export function transform(name: string, options: Partial<ts.CompilerOptions> = {}): string {
	const path = `${__dirname}/fixture/${name}`;
	const fileName = existsSync(`${path}.ts`) ? `${path}.ts` : `${path}.tsx`;
	const output = ts.transpileModule(
		readFileSync(fileName) + '',
		{
			fileName,
			compilerOptions: {
				...compilerOptions,
				...options,
			},
			transformers: {
				before: [transformerFactory({
					fnName: '__',
					exclude: [],
				})],
			},
		},
	);

	return `${output.outputText.trim()}\n`;
}

it('empty', () => {
	expect(transform('empty')).toMatchSnapshot(`'';`);
});

it('numbers', () => {
	expect(transform('numbers')).toMatchSnapshot();
});

it('simple', () => {
	expect(transform('simple')).toMatchSnapshot();
});

it('template', () => {
	expect(transform('template')).toMatchSnapshot();
});

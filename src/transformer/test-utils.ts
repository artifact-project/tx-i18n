import * as ts from 'typescript';
import { existsSync, readFileSync } from 'fs';
import i18nTxt from './transformer';

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.Preserve,
    removeComments: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
}

export function transform(name: string, options: ts.CompilerOptions = {}) {
    const path = `${__dirname}/fixture/${name}`;
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
                    fnName: '__',
                    exclude: [],
                }),
            ],
        },
    });

    return `${output.outputText.trim()}\n`;
}

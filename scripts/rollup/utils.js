import path from 'path';
import fs from 'fs';
import cjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-typescript2';

const outputDir = path.resolve(__dirname, '../../dist/node_modules');
const packageDir = path.resolve(__dirname, '../../packages');

export function getPackagePath(packageName) {
	return `${packageDir}/${packageName}`;
}

export function getOutputPath(packageName) {
	return `${outputDir}/${packageName}`;
}

export function getPackageJSON(packageName) {
	const path = `${getPackagePath(packageName)}/package.json`;
	const packageInfo = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(packageInfo);
}

export function getBaseRollupPlugins({ typescript = {} } = {}) {
	return [cjs(), ts(typescript)];
}

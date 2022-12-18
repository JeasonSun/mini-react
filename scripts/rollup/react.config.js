import generatePackageJson from 'rollup-plugin-generate-package-json';
import {
	getPackageJSON,
	getBaseRollupPlugins,
	getPackagePath,
	getOutputPath
} from './utils';

const { name } = getPackageJSON('react');
const inputFolder = getPackagePath(name);
const outputFolder = getOutputPath(name);

const basePlugins = getBaseRollupPlugins();

export default [
	// react
	{
		input: `${inputFolder}/index.ts`,
		output: {
			file: `${outputFolder}/index.js`,
			name: 'index.js',
			format: 'umd'
		},
		plugins: [
			...basePlugins,
			generatePackageJson({
				inputFolder: inputFolder,
				outputFolder: outputFolder,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js'
				})
			})
		]
	},
	// jsx-runtime
	{
		input: `${inputFolder}/jsx-runtime.ts`,
		output: {
			file: `${outputFolder}/jsx-runtime.js`,
			name: 'jsx-runtime.js',
			format: 'umd'
		},
		plugins: basePlugins
	},
	// jsx-dev-runtime
	{
		input: `${inputFolder}/jsx-dev-runtime.ts`,
		output: {
			file: `${outputFolder}/jsx-dev-runtime.js`,
			name: 'jsx-dev-runtime.js',
			format: 'umd'
		},
		plugins: basePlugins
	}
];

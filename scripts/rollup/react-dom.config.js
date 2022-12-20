import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import {
	getPackageJSON,
	getBaseRollupPlugins,
	getPackagePath,
	getOutputPath
} from './utils';

const { name } = getPackageJSON('react-dom');
const inputFolder = getPackagePath(name);
const outputFolder = getOutputPath(name);

const basePlugins = getBaseRollupPlugins();

export default [
	// react
	{
		input: `${inputFolder}/index.ts`,
		output: [
			{
				file: `${outputFolder}/index.js`,
				name: 'index.js',
				format: 'umd'
			},
			{
				file: `${outputFolder}/client.js`,
				name: 'client.js',
				format: 'umd'
			}
		],
		plugins: [
			...basePlugins,
			alias({
				entries: {
					hostConfig: `${inputFolder}/src/hostConfig.ts`
				}
			}),
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
	}
];

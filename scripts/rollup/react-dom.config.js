import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import {
	getPackageJSON,
	getBaseRollupPlugins,
	getPackagePath,
	getOutputPath
} from './utils';

const { name, peerDependencies } = getPackageJSON('react-dom');
const inputFolder = getPackagePath(name);
const outputFolder = getOutputPath(name);

const basePlugins = getBaseRollupPlugins();

export default [
	// react-dom
	{
		input: `${inputFolder}/index.ts`,
		output: [
			{
				file: `${outputFolder}/index.js`,
				name: 'reactDOM',
				format: 'umd'
			},
			{
				file: `${outputFolder}/client.js`,
				name: 'client',
				format: 'umd'
			}
		],
		external: [...Object.keys(peerDependencies)],
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
	},
	{
		input: `${inputFolder}/test-utils.ts`,
		output: [
			{
				file: `${outputFolder}/test-utils.js`,
				name: 'testUtils',
				format: 'umd'
			}
		],
		external: ['react-dom', 'react'],
		plugins: getBaseRollupPlugins()
	}
];

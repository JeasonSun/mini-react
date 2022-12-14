import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import replace from '@rollup/plugin-replace';
import { getPackagePath } from '../rollup/utils';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			__DEV__: true,
			preventAssignment: true
		})
	],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: getPackagePath('react')
			},
			{
				find: 'react-dom',
				replacement: getPackagePath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					getPackagePath('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	}
});

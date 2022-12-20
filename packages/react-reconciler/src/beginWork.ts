import { FiberNode } from './ReactFiber';
export const beginWork = (fiber: FiberNode): FiberNode | null => {
	console.log('beginWork', fiber);
	return null;
};

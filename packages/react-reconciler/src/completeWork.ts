import { FiberNode } from './ReactFiber';
export const completeWork = (fiber: FiberNode | null) => {
	console.log('completeWork', fiber);
	return null;
};

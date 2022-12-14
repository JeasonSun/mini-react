import { createHostRootFiber, FiberNode } from './ReactFiber';
import { initializeUpdateQueue } from './ReactFiberUpdateQueue';
import { Container } from 'hostConfig';

export function createFiberRoot(containerInfo: Container) {
	const root: FiberRootNode = new FiberRootNode(containerInfo);

	const uninitializedFiber = createHostRootFiber();

	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	initializeUpdateQueue(uninitializedFiber);

	return root;
}

export class FiberRootNode {
	containerInfo: Container;
	current: FiberNode | null;
	finishedWork: FiberNode | null;
	constructor(containerInfo: Container) {
		this.containerInfo = containerInfo;
		this.current = null;
		this.finishedWork = null;
	}
}

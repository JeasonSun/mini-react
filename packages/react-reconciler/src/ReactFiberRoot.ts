import { createHostRootFiber, FiberNode } from './ReactFiber';
import { initializeUpdateQueue } from './ReactFiberUpdateQueue';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './ReactFiberLane';

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
	pendingLanes: Lanes;
	finishedLane: Lane;
	constructor(containerInfo: Container) {
		this.containerInfo = containerInfo;
		this.current = null;
		this.finishedWork = null;
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;
	}
}

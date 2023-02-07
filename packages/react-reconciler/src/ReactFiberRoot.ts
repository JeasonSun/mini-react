import { createHostRootFiber, FiberNode } from './ReactFiber';
import { initializeUpdateQueue } from './ReactFiberUpdateQueue';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './ReactFiberLane';
import { Effect } from './ReactFiberHooks';

export function createFiberRoot(containerInfo: Container) {
	const root: FiberRootNode = new FiberRootNode(containerInfo);

	const uninitializedFiber = createHostRootFiber();

	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	initializeUpdateQueue(uninitializedFiber);

	return root;
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}
export class FiberRootNode {
	containerInfo: Container;
	current: FiberNode | null;
	finishedWork: FiberNode | null;
	pendingLanes: Lanes;
	finishedLane: Lane;
	pendingPassiveEffects: PendingPassiveEffects;
	constructor(containerInfo: Container) {
		this.containerInfo = containerInfo;
		this.current = null;
		this.finishedWork = null;
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;

		this.pendingPassiveEffects = {
			unmount: [],
			update: []
		};
	}
}

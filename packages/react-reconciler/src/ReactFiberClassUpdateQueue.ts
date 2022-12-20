import { HostRoot } from './ReactWorkTags';
import { FiberNode } from './ReactFiber';

export type Update = {
	payload: any;
	next: Update | null;
};

type SharedQueue = {
	pending: Update | null;
};

export type UpdateQueue = {
	baseState: any;
	firstBaseUpdate: Update | null;
	lastBaseUpdate: Update | null;
	shared: SharedQueue;
	callbacks: Array<() => any> | null;
};

// export type UpdateQueue

/**
 * 给 fiber 初始化 updateQueue
 * @param fiber fiber节点
 */
export function initializeUpdateQueue(fiber: FiberNode) {
	const queue: UpdateQueue = {
		baseState: fiber.memoizedProps,
		firstBaseUpdate: null,
		lastBaseUpdate: null,
		shared: {
			pending: null
		},
		callbacks: null
	};
	fiber.updateQueue = queue;
}

export function createUpdate(): Update {
	const update = {
		payload: null,
		next: null
	};
	return update;
}

export function enqueueUpdate(fiber: FiberNode, update: Update) {
	const updateQueue = fiber.updateQueue;
	if (updateQueue === null) {
		return null;
	}
	const sharedQueue = updateQueue.shared;
	const pending = sharedQueue.pending;
	if (pending === null) {
		update.next = update;
	} else {
		update.next = pending.next;
		pending.next = update;
	}
	sharedQueue.pending = update;

	return markUpdateFromFiberToRoot(fiber);
}

export function markUpdateFromFiberToRoot(sourceFiber: FiberNode) {
	let node = sourceFiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = parent.return;
	}
	return node.tag === HostRoot ? node.stateNode : null;
}

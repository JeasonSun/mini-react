import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

let workInProgress: FiberNode | null = null;

function renderRoot(root: FiberNode) {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
		} catch (error) {
			console.warn('workLoop发生错误', error);
			workInProgress = null;
		}
	} while (true);
}

function prepareFreshStack(fiber: FiberNode) {
	workInProgress = fiber;
}
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;

		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node?.return || null;
		workInProgress = node;
	} while (node !== null);
}

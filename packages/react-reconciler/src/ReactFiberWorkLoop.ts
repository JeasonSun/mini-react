import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode } from './ReactFiber';
import { FiberRootNode } from './ReactFiberRoot';

let workInProgress: FiberNode | null = null;

export function scheduleUpdateOnFiber(root: FiberRootNode) {
	// 暂时不用fiber，因为前面已经从fiber找到了rootNode
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

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current!, {});
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
	let completedWork: FiberNode | null = fiber;
	do {
		completeWork(completedWork);
		const siblingFiber = completedWork.sibling;

		if (siblingFiber !== null) {
			workInProgress = siblingFiber;
			return;
		}
		completedWork = completedWork?.return || null;
		workInProgress = completedWork;
	} while (completedWork !== null);
}

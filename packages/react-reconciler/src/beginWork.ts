import { ReactElement } from 'shared/ReactTypes';
import { HostComponent, HostRoot, HostText } from './ReactWorkTags';
import { FiberNode } from './ReactFiber';
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber';
export const beginWork = (workInProgress: FiberNode): FiberNode | null => {
	console.log('beginWork开始', workInProgress);
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.error('beginWork未实现的Tag类型', workInProgress.tag);
			}
			break;
	}
	return workInProgress.child;
};

function updateHostRoot(workInProgress: FiberNode) {
	const updateQueue = workInProgress.updateQueue;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	// const { memoizedState } = processUpdateQueue(fiber, )

	const nextChildren = pending.payload.element;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps?.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function reconcileChildren(workInProgress: FiberNode, children?: ReactElement) {
	const current = workInProgress.alternate;
	// 由于一开始就已经创建了 HostRootFiber，所以current是存在的
	if (current !== null) {
		// update
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current?.child,
			children
		);
	} else {
		workInProgress.child = mountChildFibers(workInProgress, null, children);
	}
}

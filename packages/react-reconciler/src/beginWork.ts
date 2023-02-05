import { Lane } from './ReactFiberLane';
import { ReactElement } from 'shared/ReactTypes';
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent,
	Fragment
} from './ReactWorkTags';
import { FiberNode } from './ReactFiber';
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber';
import { renderWithHooks } from './ReactFiberHooks';
import { processUpdateQueue } from './ReactFiberUpdateQueue';
export const beginWork = (
	workInProgress: FiberNode,
	renderLane: Lane
): FiberNode | null => {
	console.log('beginWork开始', workInProgress);
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress, renderLane);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(workInProgress, renderLane);
		case Fragment:
			return updateFragment(workInProgress);
		default:
			if (__DEV__) {
				console.error('beginWork未实现的Tag类型', workInProgress.tag);
			}
			break;
	}
	return workInProgress.child;
};

function updateHostRoot(workInProgress: FiberNode, renderLane: Lane) {
	const nextProps = workInProgress.pendingProps;

	// const prevState = workInProgress.memoizedState;
	// const prevChildren = prevState.element;

	const { memoizedState } = processUpdateQueue<{ element: ReactElement }>(
		workInProgress.updateQueue,
		nextProps,
		renderLane
	);

	const nextState = memoizedState;
	const nextChildren = nextState.element;

	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps?.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateFunctionComponent(workInProgress: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(workInProgress, renderLane);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateFragment(workInProgress: FiberNode) {
	const nextChildren = workInProgress.pendingProps;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function reconcileChildren(workInProgress: FiberNode, children?: any) {
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

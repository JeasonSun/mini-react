import { HostText } from './ReactWorkTags';
import { ReactElement, Props } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './ReactFiber';
import { Placement } from './ReactFiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function placeSingleChild(newFiber: FiberNode) {
		// 如果要跟踪副作用并且没有老的fiber， 那就标记为新建
		if (shouldTrackEffects && newFiber.alternate === null) {
			newFiber.flags |= Placement;
		}
		return newFiber;
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElement
	) {
		// const key = element.key;
		// let current = currentFirstChild;
		// while (current !== null) {
		// 	if (current.key === key) {
		// 		// key 相同，比较type
		// 		if (element.$$typeof === REACT_ELEMENT_TYPE) {
		// 			if (current.type === element.type) {
		// 				// type 相同，可以复用
		// 				const existing = useFiber(current, element.props);
		// 				existing.return = returnFiber;
		// 				return existing;
		// 			}
		// 		}
		// 	} else {
		// 		console.log('key 不相同');
		// 	}
		// }
		const created = createFiberFromElement(element);
		created.return = returnFiber;
		return created;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string
	) {
		const created = new FiberNode(HostText, { content }, null);
		created.return = returnFiber;
		return created;
	}

	function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElement
	) {
		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild) {
			// TODO: newChild 是数组的情况
			if (Array.isArray(newChild)) {
				console.warn('还没有实现数组 children 的情况');
			}
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的fiber类型', newChild);
					}
					break;
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + '')
			);
		}
		return null;
	}
	return reconcileChildFibers;
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

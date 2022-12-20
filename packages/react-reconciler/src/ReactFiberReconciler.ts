import { ReactElement } from 'shared/ReactTypes';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { FiberRootNode } from './ReactFiberRoot';
import { scheduleUpdateOnFiber } from './workLoop';

export function updateContainer(
	element: ReactElement,
	container: FiberRootNode
) {
	const current = container.current!;
	const update = createUpdate();
	update.payload = { element };

	// 在调用 updateContainer 之前一定是已经创建了 FiberRootNode，并且指定了 current 属性，即 HostRootFiber
	const root = enqueueUpdate(current, update);
	if (root) {
		scheduleUpdateOnFiber(root, current);
	}
}

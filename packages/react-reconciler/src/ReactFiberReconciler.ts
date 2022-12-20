import { Container } from 'hostConfig';
import { ReactElement } from 'shared/ReactTypes';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { createFiberRoot, FiberRootNode } from './ReactFiberRoot';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

export function createContainer(containerInfo: Container) {
	return createFiberRoot(containerInfo);
}

export function updateContainer(
	element: ReactElement,
	container: FiberRootNode
) {
	// current 指向 HostRootFiber 对象
	const current = container.current!;

	// 创建一个 update， 其中 payload 就是一个 <App/>
	const update = createUpdate();
	update.payload = { element };

	// 将任务推进更新队列
	const root = enqueueUpdate(current, update);

	// 调度更新
	if (root) {
		scheduleUpdateOnFiber(root);
	}
}

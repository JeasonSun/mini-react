import { Container } from 'hostConfig';
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { ReactElement } from 'shared/ReactTypes';
import { initEvent } from './syntheticEvent';
// import { listenToAllSupportedEvents } from './events/DOMPluginEventSystem';

export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElement) {
			// listenToAllSupportedEvents(container);
			initEvent(container, 'click');
			return updateContainer(element, root);
		}
	};
}

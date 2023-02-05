import { Props } from 'shared/ReactTypes';
import { HostText } from 'react-reconciler/src/ReactWorkTags';
import { FiberNode } from 'react-reconciler/src/ReactFiber';
import {
	DOMElement,
	elementPropsKey,
	internalInstanceKey
} from './events/DOMPluginEventSystem';
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (
	type: string,
	props: Props,
	internalInstanceHandle: FiberNode
): Instance => {
	const element = document.createElement(type);
	precacheFiberNode(internalInstanceHandle, element);
	updateFiberProps(element as unknown as DOMElement, props);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export const insertChildToContainer = (
	child: Instance,
	container: Instance,
	before: Instance
) => {
	container.insertBefore(child, before);
};

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps?.content || '';
			return commitTextUpdate(fiber.stateNode, text);

		default:
			if (__DEV__) {
				console.warn('未实现的Update类型', fiber);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}

export function getFiberCurrentPropsFromNode(node: DOMElement): Props {
	return (node as any)[elementPropsKey] || null;
}

export function precacheFiberNode(
	hostInst: FiberNode,
	node: Instance | TextInstance
) {
	(node as any)[internalInstanceKey] = hostInst;
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
		: setTimeout;

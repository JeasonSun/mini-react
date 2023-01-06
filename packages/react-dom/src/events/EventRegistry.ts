import { DOMEventName } from './SimpleEventPlugin';

export const registrationNameDependencies: { [key: string]: DOMEventName[] } =
	{};
export const allNativeEvents: Set<DOMEventName> = new Set();

/**
 * 同时注册两个阶段：冒泡 + 捕获
 * 获取阶段的 react事件名是加上 Capture 后缀
 * @param registrationName 注册名称（reactName: onClick）
 * @param dependencies 关联的原生事件名
 */
export function registerTwoPhaseEvent(
	registrationName: string,
	dependencies: DOMEventName[]
) {
	registerDirectEvent(registrationName, dependencies);
	registerDirectEvent(registrationName + 'Capture', dependencies);
}
/**
 * 事件注册
 * 1. 构建 registrationNameDependencies
 * 2. 完善 allNativeEvents
 */
function registerDirectEvent(
	registrationName: string,
	dependencies: DOMEventName[]
) {
	registrationNameDependencies[registrationName] = dependencies;
	for (let i = 0; i < dependencies.length; i++) {
		allNativeEvents.add(dependencies[i]);
	}
}

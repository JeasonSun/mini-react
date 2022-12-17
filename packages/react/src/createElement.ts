import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ElementType, Key, Ref, Props, ReactElement } from 'shared/ReactTypes';
import hasOwnProperty from 'shared/hasOwnProperty';

function hasValidKey(config: any) {
	return config.key !== undefined;
}

function hasValidRef(config: any) {
	return config.ref !== undefined;
}

const RESERVED_PROPS = {
	key: true,
	ref: true,
	__self: true,
	__source: true
};

export function jsx(type: ElementType, config: any, ...maybeKey: any) {
	const props: any = {};

	let key: Key = null;
	let ref: Ref = null;

	if (maybeKey !== undefined) {
		key = '' + maybeKey;
	}

	if (hasValidKey(config)) {
		key = '' + config.key;
	}

	if (hasValidRef(config)) {
		ref = config.ref;
	}
	for (const propName in config) {
		if (
			hasOwnProperty.call(config, propName) &&
			!RESERVED_PROPS.hasOwnProperty(propName)
		) {
			props[propName] = config[propName];
		}
	}

	// 处理 default props
	if (type && type.defaultProps) {
		const defaultProps = type.defaultProps;
		for (const propName in defaultProps) {
			if (props[propName] === undefined) {
				props[propName] = defaultProps[propName];
			}
		}
	}
	return ReactElement(type, key, ref, props);
}

export function createElement(type: ElementType, config: any, children: any) {
	console.log(arguments);
	const props: any = {};

	let key: Key = null;
	let ref: Ref = null;

	if (config != null) {
		if (hasValidKey(config)) {
			key = '' + config.key;
		}

		if (hasValidRef(config)) {
			ref = config.ref;
		}

		for (const propName in config) {
			if (
				hasOwnProperty.call(config, propName) &&
				!RESERVED_PROPS.hasOwnProperty(propName)
			) {
				props[propName] = config[propName];
			}
		}
	}

	const childrenLength = arguments.length - 2;
	if (childrenLength === 1) {
		props.children = children;
	} else if (childrenLength > 1) {
		props.children = Array.prototype.slice.call(arguments, 2);
	}

	// 处理 default props
	if (type && type.defaultProps) {
		const defaultProps = type.defaultProps;
		for (const propName in defaultProps) {
			if (props[propName] === undefined) {
				props[propName] = defaultProps[propName];
			}
		}
	}
	return ReactElement(type, key, ref, props);
}

const ReactElement = function (
	type: ElementType,
	key: Key,
	ref: Ref,
	props: Props
): ReactElement {
	const element: ReactElement = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'MoJie'
	};
	return element;
};

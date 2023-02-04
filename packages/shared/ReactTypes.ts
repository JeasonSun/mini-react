export type ElementType = any;
export type Key = any;
export type Ref = any;
export type Props = {
	[key: string]: any;
	children?: ReactElement[];
};

export interface ReactElement {
	$$typeof: symbol | number;
	type: ElementType;
	key: Key;
	props: Props;
	ref: Ref;
	__mark: 'MoJie';
}

export type Action<State> = State | ((prevState: State) => State);

export type Dispatch<State> = (action: Action<State>) => void;

// 定义所有的 hook
export interface Dispatcher {
	useState: <S>(initialState: (() => S) | S) => [S, Dispatch<S>];
}

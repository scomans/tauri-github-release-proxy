import { SafeAny } from './safe-any';

export type ArrayType<T extends SafeAny[]> = T[number];

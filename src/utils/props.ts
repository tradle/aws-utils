import pickBy from 'lodash/pickBy'

export const pickNonNull = <T>(obj: T): T => pickBy(obj as any, val => val != null) as T

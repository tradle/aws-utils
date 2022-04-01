import { Coordinates } from './types'

export function coord (latitude: number, longitude: number): Coordinates {
  return {
    latitude,
    longitude
  }
}

type DeepFrozen <T> =
  T extends Object
    ? { readonly [key in keyof T]: T[key] }
    : T

export function deepFreeze <T extends { [key: string]: any }>(input: T): DeepFrozen<T> {
  for (const key in input) {
    const value = input[key]
    if (typeof value === 'object') {
      input[key] = deepFreeze(value)
    }
  }
  return Object.freeze(input) as DeepFrozen<T>
}

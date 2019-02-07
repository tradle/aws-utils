export type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type OmitFromFirstArg<T, K extends keyof T> = Omit<FirstArgument<T>, K>

export interface IAMPrincipalObj {
  AWS: string | string[]
}
export type IAMPrincipal = string | IAMPrincipalObj

export interface IAMStatement {
  Principal: IAMPrincipal
  Action: string | string[]
  Resource: string | string[]
  [x: string]: any
}

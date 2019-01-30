export interface CFTemplateParameter {
  Type: string
  Description?: string
  Default?: string
  AllowedValues?: string[]
}

export interface CFTemplateResource {
  Type: string
  Description?: string
  Properties?: any
  DeletionPolicy?: 'Delete' | 'Replace' | 'Retain'
}

export interface CFTemplate {
  Description?: string
  Parameters?: {
    [key: string]: CFTemplateParameter
  }
  Mappings?: any
  Conditions?: any
  Resources: {
    [key: string]: CFTemplateResource
  }
}

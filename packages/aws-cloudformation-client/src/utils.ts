import { pickNonNull } from '@tradle/aws-common-utils'
import { CFTemplate } from './types'
export const setTemplateParameterDefaults = (template: CFTemplate, defaults: any) => {
  if (!template.Parameters) template.Parameters = {}

  const { Parameters } = template
  for (const key in defaults) {
    Parameters[key] = pickNonNull({
      Type: 'String',
      Default: defaults[key]
    })
  }
}

export const lockParametersToDefaults = (template: CFTemplate) => {
  const { Parameters = {} } = template
  Object.keys(Parameters).forEach(name => {
    const param = Parameters[name]
    if (typeof param.Default !== 'undefined') {
      param.AllowedValues = [param.Default]
    }
  })
}

export const getResourcesByType = (template: CFTemplate, type: string) => {
  return getResourceNamesByType(template, type).map(name => template.Resources[name])
}

export const getResourceNamesByType = (template: CFTemplate, type: string) => {
  const { Resources } = template
  return Object.keys(Resources).filter(name => Resources[name].Type === type)
}

export const getLambdaS3Keys = (template: CFTemplate) => {
  const { Resources } = template
  return getResourceNamesByType(template, 'AWS::Lambda::Function').map(name => ({
    path: `Resources['${name}'].Properties.Code.S3Key`,
    value: Resources[name].Properties.Code.S3Key
  }))
}

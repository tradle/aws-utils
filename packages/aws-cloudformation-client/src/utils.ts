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

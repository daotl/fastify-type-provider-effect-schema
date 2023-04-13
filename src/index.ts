import type { FastifySchemaCompiler, FastifyTypeProvider } from 'fastify'
import type { FastifySerializerCompiler } from 'fastify/types/schema'
import * as S from '@effect/schema/Schema'
import * as E from '@effect/data/Either'

// rome-ignore lint/suspicious/noExplicitAny: ignore
type FreeformRecord = Record<string, any>

// const defaultSkipList = [
//   '/documentation/',
//   '/documentation/initOAuth',
//   '/documentation/json',
//   '/documentation/uiConfig',
//   '/documentation/yaml',
//   '/documentation/*',
//   '/documentation/static/*',
// ]

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
type SchemaAny = S.Schema<any, any>

export interface ZodTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends SchemaAny ? S.To<this['input']> : never
}

// interface Schema extends FastifySchema {
//   hide?: boolean
// }

// const zodToJsonSchemaOptions = {
//   target: 'openApi3',
//   $refStrategy: 'none',
// } as const

// export const createJsonSchemaTransform = ({
//   skipList,
// }: { skipList: readonly string[] }) => {
//   return ({ schema, url }: { schema: Schema; url: string }) => {
//     if (!schema) {
//       return {
//         schema,
//         url,
//       }
//     }

//     const { response, headers, querystring, body, params, hide, ...rest } =
//       schema

//     const transformed: FreeformRecord = {}

//     if (skipList.includes(url) || hide) {
//       transformed.hide = true
//       return { schema: transformed, url }
//     }

//     const zodSchemas: FreeformRecord = { headers, querystring, body, params }

//     for (const prop in zodSchemas) {
//       const zodSchema = zodSchemas[prop]
//       if (zodSchema) {
//         transformed[prop] = zodToJsonSchema(zodSchema, zodToJsonSchemaOptions)
//       }
//     }

//     if (response) {
//       transformed.response = {}

//       // rome-ignore lint/suspicious/noExplicitAny: ignore
//       for (const prop in response as any) {
//         // rome-ignore lint/suspicious/noExplicitAny: ignore
//         const schema = resolveSchema((response as any)[prop])

//         const transformedResponse = zodToJsonSchema(
//           // rome-ignore lint/suspicious/noExplicitAny: ignore
//           schema as any,
//           zodToJsonSchemaOptions,
//         )
//         transformed.response[prop] = transformedResponse
//       }
//     }

//     for (const prop in rest) {
//       const meta = rest[prop as keyof typeof rest]
//       if (meta) {
//         transformed[prop] = meta
//       }
//     }

//     return { schema: transformed, url }
//   }
// }

// export const jsonSchemaTransform = createJsonSchemaTransform({
//   skipList: defaultSkipList,
// })

export const validatorCompiler: FastifySchemaCompiler<SchemaAny> =
  ({ schema }) =>
  // rome-ignore lint/suspicious/noExplicitAny: ignore
  (data): any => {
    try {
      return { value: S.parse(resolveSchema(schema))(data,  { onExcessProperty: "error", errors: "all" }) }
    } catch (error) {

      return { error }
    }
  }

// rome-ignore lint/suspicious/noShadowRestrictedNames: ignore
function hasOwnProperty<T, K extends PropertyKey>(
  obj: T,
  prop: K,
): // rome-ignore lint/suspicious/noExplicitAny: ignore
obj is T & Record<K, any> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function resolveSchema(
  maybeSchema: SchemaAny | { properties: SchemaAny },
): SchemaAny {
  if (hasOwnProperty(maybeSchema, 'properties')) {
    return maybeSchema.properties
  }

  if (hasOwnProperty(maybeSchema, 'From')) {
    return maybeSchema
  }

  throw new Error(`Invalid schema passed: ${JSON.stringify(maybeSchema)}`)
}

export class ResponseValidationError extends Error {
  public details: FreeformRecord

  constructor(validationResult: FreeformRecord) {
    super("Response doesn't match the schema")
    this.name = 'ResponseValidationError'
    this.details = validationResult.error
  }
}

export const serializerCompiler: FastifySerializerCompiler<
  SchemaAny | { properties: SchemaAny }
> =
  ({ schema: maybeSchema }) =>
  (data) => {
    const schema = S.parseEither(resolveSchema(maybeSchema))

    const result = schema(data)

    if (E.isRight(result)) {
      return JSON.stringify(result.right)
    }

    throw new ResponseValidationError(result.left)
  }

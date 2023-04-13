import type {
  FastifyInstance,
  FastifyLoggerInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify'
import Fastify from 'fastify'
import { expectAssignable, expectType } from 'tsd'
import * as S from '@effect/schema/Schema'

import { serializerCompiler, validatorCompiler } from '../src/index'
import type { EffectSchemaTypeProvider } from '../src/index'

const fastify = Fastify().withTypeProvider<EffectSchemaTypeProvider>()

type FastifyEffectSchemaInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyLoggerInstance,
  EffectSchemaTypeProvider
>

expectType<FastifyEffectSchemaInstance>(
  fastify.setValidatorCompiler(validatorCompiler),
)
expectType<FastifyEffectSchemaInstance>(
  fastify.setSerializerCompiler(serializerCompiler),
)
expectAssignable<FastifyEffectSchemaInstance>(fastify)

fastify.route({
  method: 'GET',
  url: '/',
  // Define your schema
  schema: {
    querystring: S.struct({
      name: S.string,
    }),
    response: {
      200: S.string,
    },
  },
  handler: (req, res) => {
    expectType<string>(req.query.name)
    res.send('string')
  },
})

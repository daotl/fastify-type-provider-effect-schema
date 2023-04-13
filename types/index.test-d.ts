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
import type { ZodTypeProvider } from '../src/index'

const fastify = Fastify().withTypeProvider<ZodTypeProvider>()

type FastifyZodInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyLoggerInstance,
  ZodTypeProvider
>

expectType<FastifyZodInstance>(fastify.setValidatorCompiler(validatorCompiler))
expectType<FastifyZodInstance>(
  fastify.setSerializerCompiler(serializerCompiler),
)
expectAssignable<FastifyZodInstance>(fastify)

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

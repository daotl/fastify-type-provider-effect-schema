import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import * as S from '@effect/schema/Schema'

import type { EffectSchemaTypeProvider } from '../src'
import { serializerCompiler, validatorCompiler } from '../src'

describe('response schema', () => {
  let app: FastifyInstance
  beforeAll(async () => {
    const REQUEST_SCHEMA = S.struct({
      name: S.string,
    })

    app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    app.after(() => {
      app
        .withTypeProvider<EffectSchemaTypeProvider>()
        .route({
          method: 'GET',
          url: '/',
          schema: {
            querystring: REQUEST_SCHEMA,
          },
          handler: (req, res) => {
            res.send({
              name: req.query.name,
            })
          },
        })
        .route({
          method: 'GET',
          url: '/no-schema',
          schema: undefined,
          handler: (_req, res) => {
            res.send({
              status: 'ok',
            })
          },
        })
    })

    await app.ready()
  })
  afterAll(async () => {
    await app.close()
  })

  it('accepts correct request', async () => {
    const response = await app.inject().get('/').query({
      name: 'test1',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      name: 'test1',
    })
  })

  it('accepts request on route without schema', async () => {
    const response = await app.inject().get('/no-schema')

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ok',
    })
  })

  it('returns 400 on validation error', async () => {
    const response = await app.inject().get('/')

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })
})

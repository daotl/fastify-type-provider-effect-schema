import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import * as S from '@effect/schema/Schema'

import type { EffectSchemaTypeProvider } from '../src'
import { serializerCompiler, validatorCompiler } from '../src'

describe('response schema', () => {
  describe('does not fail on empty response schema (204)', () => {
    let app: FastifyInstance
    beforeAll(async () => {
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
              response: {
                204: S.undefined,
              },
            },
            handler: (_req, res) => {
              res.status(204).send()
            },
          })
          .route({
            method: 'GET',
            url: '/incorrect',
            schema: {
              response: {
                204: S.undefined,
              },
            },
            handler: (_req, res) => {
              res.status(204).send({ id: 1 })
            },
          })
      })
      await app.ready()
    })

    afterAll(async () => {
      await app.close()
    })

    it('returns 204', async () => {
      const response = await app.inject().get('/')

      expect(response.statusCode).toBe(204)
      expect(response.body).toEqual('')
    })

    it('throws on non-empty', async () => {
      const response = await app.inject().get('/incorrect')

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({
        error: 'Internal Server Error',
        message: "Response doesn't match the schema",
        statusCode: 500,
      })
    })
  })

  describe('correctly processes response schema (string)', () => {
    let app: FastifyInstance
    beforeAll(async () => {
      const REPLY_SCHEMA = S.string

      app = Fastify()
      app.setValidatorCompiler(validatorCompiler)
      app.setSerializerCompiler(serializerCompiler)

      app.after(() => {
        app.withTypeProvider<EffectSchemaTypeProvider>().route({
          method: 'GET',
          url: '/',
          schema: {
            response: {
              200: REPLY_SCHEMA,
            },
          },
          handler: (_req, res) => {
            res.send('test')
          },
        })

        app.withTypeProvider<EffectSchemaTypeProvider>().route({
          method: 'GET',
          url: '/incorrect',
          schema: {
            response: {
              200: REPLY_SCHEMA,
            },
          },
          handler: (_req, res) => {
            // rome-ignore lint/suspicious/noExplicitAny: ignore
            res.send({ name: 'test4' } as any)
          },
        })
      })

      await app.ready()
    })

    afterAll(async () => {
      await app.close()
    })

    it('returns 200 on correct response', async () => {
      const response = await app.inject().get('/')

      expect(response.statusCode).toBe(200)
      expect(response.body).toEqual('test')
    })

    it('returns 500 on incorrect response', async () => {
      const response = await app.inject().get('/incorrect')

      expect(response.statusCode).toBe(500)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('correctly processes response schema (object)', () => {
    let app: FastifyInstance
    beforeEach(async () => {
      const REPLY_SCHEMA = S.struct({
        name: S.string,
      })

      app = Fastify()
      app.setValidatorCompiler(validatorCompiler)
      app.setSerializerCompiler(serializerCompiler)

      app.after(() => {
        app.withTypeProvider<EffectSchemaTypeProvider>().route({
          method: 'GET',
          url: '/',
          schema: {
            response: {
              200: REPLY_SCHEMA,
            },
          },
          handler: (_req, res) => {
            res.send({
              name: 'test7',
            })
          },
        })

        app.withTypeProvider<EffectSchemaTypeProvider>().route({
          method: 'GET',
          url: '/incorrect',
          schema: {
            response: {
              200: REPLY_SCHEMA,
            },
          },
          handler: (_req, res) => {
            // rome-ignore lint/suspicious/noExplicitAny: ignore
            res.send('test' as any)
          },
        })
      })

      await app.ready()
    })
    afterAll(async () => {
      await app.close()
    })

    it('returns 200 for correct response', async () => {
      const response = await app.inject().get('/')

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        name: 'test7',
      })
    })

    // FixMe https://github.com/turkerdev/fastify-type-provider-zod/issues/16
    it.skip('returns 500 for incorrect response', async () => {
      const response = await app.inject().get('/incorrect')

      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })
  })
})

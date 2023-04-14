# Fastify Type Provider for [@effect/schema](https://github.com/effect-ts/schema)

[![NPM Version](https://img.shields.io/npm/v/fastify-type-provider-effect-schema.svg)](https://npmjs.org/package/fastify-type-provider-effect-schema)
[![NPM Downloads](https://img.shields.io/npm/dm/fastify-type-provider-effect-schema.svg)](https://npmjs.org/package/fastify-type-provider-effect-schema)
[![Build Status](https://github.com//daotl/fastify-type-provider-effect-schema/workflows/CI/badge.svg)](https://github.com//daotl/fastify-type-provider-effect-schema/actions)

## How to use?

```js
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, EffectSchemaTypeProvider } from "fastify-type-provider-effect-schema";
import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";

const app = Fastify()

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<EffectSchemaTypeProvider>().route({
  method: "GET",
  url: "/",
  // Define your schema
  schema: {
    querystring: S.struct({
      name: pipe(S.string, S.minLength(4)),
    }),
    response: {
      200: S.string,
    },
  },
  handler: (req, res) => {
    res.send(req.query.name);
  },
});

app.listen({ port: 4949 });
```

## How to use together with @fastify/swagger

```ts
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";

import {
  jsonSchemaTransform,
  createJsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  EffectSchemaTypeProvider,
} from 'fastify-type-provider-effect-schema';

const app = fastify();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SampleApi',
      description: 'Sample backend service',
      version: '1.0.0',
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
  // You can also create transform with custom skiplist of endpoints that should not be included in the specification:
  //
  // transform: createJsonSchemaTransform({
  //   skipList: [ '/documentation/static/*' ]
  // })
});

app.register(fastifySwaggerUI, {
  routePrefix: '/documentation',
});

const LOGIN_SCHEMA = S.struct({
  username: pipe(
    S.string,
    S.maxLength(32),
    S.description('Some description for username'),
  ),
  password: pipe(S.string, S.maxLength(32)),
});

app.after(() => {
  app.withTypeProvider<EffectSchemaTypeProvider>().route({
    method: 'POST',
    url: '/login',
    schema: { body: LOGIN_SCHEMA },
    handler: (req, res) => {
      res.send('ok');
    },
  });
});

async function run() {
  await app.ready();

  await app.listen({
    port: 4949,
  });

  console.log(`Documentation running at http://localhost:4949/documentation`);
}

run();
```

## Credits

This library was forked from [fastify-type-provider-effect-schema](https://github.com/turkerdev/fastify-type-provider-effect-schema).

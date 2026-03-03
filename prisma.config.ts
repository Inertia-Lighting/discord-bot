import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    schema: 'schema/prisma',
    migrations: {
        path: 'schema/prisma/migrations'
    },
    datasource: {
        url: env('DATABASE_URL')
    }
})
import fastify from 'fastify';
import {z} from 'zod'
import {sql} from './lib/postgres'
import {redis} from './lib/redis'

const app = fastify()

app.get('/:code', async (request, reply) => {
    const GetLinkSchema = z.object({
        code: z.string().min(3)
    })

    const { code } = GetLinkSchema.parse(request.params)

    const res = await sql/*sql*/`
        SELECT code, original_url FROM shorter_ruls 
        WHERE shorter_ruls.code = ${code}
    `

    if(res.length === 0) {
        return reply.status(400).send({message: "Link não encontrado!"})
    }

    const link = res[0]

    await redis.zIncrBy('metrica', 1, String(link.id))

    return reply.redirect(301, link.original_url)
})

app.get('/api/link', async () => {
    const res = await sql/*sql*/`
        SELECT * FROM shorter_ruls ORDER BY created_at DESC
    `

    return res 
})

app.post('/api/link', async (request, reply) => {   
    const LinkSchema = z.object({
        code: z.string().min(3),
        url: z.string().url()
    })

    const {code, url} = LinkSchema.parse(request.body)


    const res = await sql/*sql*/`
        INSERT INTO shorter_ruls (code, original_url)
        VALUES (${code}, ${url})
        RETURNING id
    `

    const link = res[0]

    return reply.status(201).send({shortedUrl: link.id})
})

app.get('/api/metricas', async () => {
    const res = await redis.zRangeByScoreWithScores('metrica', 0, 50)

    const metrics = res.sort((a, b) => b.score - a.score).map(item => {
        return {
            shortLinkId: Number(item.value),
            clicks: item.score
        }
    })

    return metrics
})

app.listen({
    port: 3333,
}).then(() => {
    console.log("listening on port localhost:3333")
})
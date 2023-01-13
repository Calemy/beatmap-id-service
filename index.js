import mysql from "mysql-commands"
import { username, password, database as db, host, port } from "./config.js"
import { fastify as f } from "fastify"
import formbody from "@fastify/formbody"

(async () => {
    const fastify = f();
    const database = mysql.createConnection({
        host,
        user: username,
        password,
        database: db
    })

    let counter = {}

    const beatmap = await database.selectOne("beatmaps", {
        sort: ["id ASC"]
    })

    const set = await database.selectOne("beatmapsets", {
        sort: ["id ASC"]
    })

    let lastBeatmap = beatmap.id
    let lastSet = set.id

    fastify.register(formbody)

    fastify.post('/upload', async (req, reply) => {
        const time = Math.floor(new Date().getTime() / 1000)
        const key = req.body?.key
        const amount = parseInt(req.body?.amount)
        const submitted = []

        if(!key || !amount) return reply.send({
            status: "error",
            error: "Invalid Parameters"
        })

        const server = await database.selectOne("servers", {
            condition: `uuid = ${key}`
        })

        if(!server) return reply.send({
            status: "error",
            error: "Invalid Key"
        })

        if(!counter[key]) counter[key] = 0

        if(counter[key] + amount > server.limit) return reply.send({
            status: "error",
            error: "Ratelimit reached"
        })

        await database.insert("beatmapsets", {
            object: {
                id: lastSet - 1,
                server: server.id,
                time: time
            }
        })

        for(let i = 0; i < amount; i++){
            submitted.push(lastBeatmap - 1 - i)
            await database.insert("beatmaps", {
                object: {
                    id: lastBeatmap - 1 - i,
                    server: server.id,
                    time: time
                }
            })
        }

        lastSet -= 1
        lastBeatmap -= amount

        counter[key] += amount

        return await reply.send({
            status: "success",
            content: {
                beatmap_ids: submitted,
                beatmap_set_id: lastSet,
                created_at: new Date(time * 1000).toISOString()
            }
        })
    })

    await fastify.listen({ port })
    console.log("Beatmap ID Service running on 127.0.0.1:" + port)

    setInterval(async () => {
        counter = {}
    }, 60000)
})();
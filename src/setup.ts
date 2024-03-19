import {sql} from './lib/postgres'

async function setup(){
    await sql /*sql*/`
    CREATE TABLE IF NOT EXISTS shorter_ruls (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        original_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `

    await sql.end()

console.log("SETUP FEITO COM SUCESSO")
}

setup()
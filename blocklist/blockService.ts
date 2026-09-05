import express, { type Express, type Request, type Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
    database: 'devops_db',
    user: 'devops',
    password: 'devops',
});

const app: Express = express();

app.post('/blocklist', async (req: Request, res: Response) => {
    try {
        const query = `INSERT INTO bans (ipaddress, path) VALUES ('192.168.1.0', '/var/lib') RETURNING *;`;
        const dbRes = await pool.query(query);
        res.status(201).json(dbRes.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.get('/blocklist', async (req: Request, res: Response) => {
    try {
        const query = `SELECT * FROM bans;`;
        const dbRes = await pool.query(query);
        res.json(dbRes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.listen(3000, () => {
    console.log('Block service listening on port 3000');
});

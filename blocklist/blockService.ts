import express, { type Express, type Request, type Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({
    host: 'localhost', // When connection from another docker service, change this to service
    port: 5432,
    database: 'devops_db',
    user: 'devops',
    password: 'devops',
});

const app: Express = express();

app.post('/blocklist', async (req: Request, res: Response) => {
    const query = `INSERT INTO bans (ipaddress, path) 
    VALUES (192.168.1.0, /var/lib)
    `;
    const dbRes = await pool.query(query);
    return dbRes.rows[0];
});

app.get('/blocklist', async (req: Request, res: Response) => {
    const query = `SELECT * from bans;`;
    const dbRes = await pool.query(query);
    return dbRes.rows[0];
});

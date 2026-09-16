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
app.use(express.text());

app.post('/blocklist', async (req: Request, res: Response) => {
    try {
        let blocked;
        const body = req.body;
        console.log(body);
        const [ip, path] = body.split(',');
        await pool.query('INSERT INTO bans (ipaddress, path) VALUES ($1, $2)', [
            ip,
            path,
        ]);

        const checkRes = await pool.query(
            'SELECT * FROM bans WHERE ipaddress = $1',
            [ip],
        );
        if (checkRes.rowCount && checkRes.rowCount >= 2) {
            blocked = true;
        } else {
            blocked = false;
        }
        res.status(201).type('text/plain').send(blocked.toString());
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.get('/blocklist', async (req: Request, res: Response) => {
    try {
        const query = `SELECT ipaddress, path, timestamp FROM bans
            WHERE ipaddress IN (
            SELECT ipaddress
            FROM bans
            GROUP BY ipaddress
            HAVING COUNT(*) >= 2
            ) ORDER BY ipaddress ASC;`;
        const dbRes = await pool.query(query);
        const output = dbRes.rows
            .map(
                (row) =>
                    `${row.ipaddress},${row.path},${row.timestamp.toISOString()}`,
            )
            .join('\n');
        res.status(201).type('text/plain').send(output);
    } catch (err) {
        console.error(err);
        res.status(502).send('Database error');
    }
});

app.get('/isBlocked', async (req: Request, res: Response) => {
    const { ip } = req.query;
    const bannedIps = [];
    if (ip) {
        try {
            console.log('Checking for IP', ip);
            const query = `SELECT * FROM bans WHERE ipaddress = '${ip}'`;
            const dbRes = await pool.query(query);
            console.log(dbRes);
            if (dbRes.rowCount) {
                const blocked = dbRes.rowCount >= 2;
                console.log('blocked', blocked);
                res.status(201).type('text/plain').send(blocked);
            }
            res.status(502);
        } catch (err) {
            console.error(err);
            res.status(502);
        }
    }
});

app.listen(3000, () => {
    console.log('Block service listening on port 3000');
});

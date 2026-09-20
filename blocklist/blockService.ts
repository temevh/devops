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
        const [ip, path] = body.split(',');

        const checkRes = await pool.query(
            'SELECT COUNT(*)::int as count FROM bans WHERE ipaddress = $1',
            [ip],
        );
        const count = checkRes.rows[0].count;
        if (count >= 2) {
            blocked = true;
        } else {
            const timeStamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
            await pool.query(
                'INSERT INTO bans (ipaddress, path, timestamp) VALUES ($1, $2, $3)',
                [ip, path, timeStamp],
            );
            blocked = count + 1 >= 2;
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
            ) ORDER BY ipaddress ASC, timestamp ASC;`;
        const dbRes = await pool.query(query);
        const output = dbRes.rows
            .map((row) => {
                const timestamp =
                    row.timestamp instanceof Date
                        ? row.timestamp
                        : new Date(row.timestamp);
                return `${row.ipaddress},${row.path},${timestamp.toISOString()}`;
            })
            .join('\n');

        res.status(200).type('text/plain').send(output);
    } catch (err) {
        console.error(err);
        res.status(502).send('Database error');
    }
});

app.get('/isBlocked', async (req: Request, res: Response) => {
    const { ip } = req.query;
    if (ip) {
        try {
            const dbRes = await pool.query(
                'SELECT COUNT(*)::int as count FROM bans WHERE ipaddress = $1',
                [ip as string],
            );
            const blocked = dbRes.rows[0].count >= 2;
            res.status(200).type('text/plain').send(blocked.toString());
        } catch (err) {
            console.error(err);
            res.status(502).type('text/plain').send('Database error');
        }
    } else {
        res.status(502).end();
    }
});

app.get('/clear', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM bans');
        res.status(200).type('text/plain').send('complete');
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.listen(3000, () => {
    console.log('Block service listening on port 3000');
});

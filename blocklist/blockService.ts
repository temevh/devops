import express, {
    type Express,
    type Request,
    type Response,
} from 'express';
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

const THRESHOLD = 2;

app.post('/blocklist', async (req: Request, res: Response) => {
    try {
        const body = req.body as string;
        const commaIndex = body.indexOf(',');
        if (commaIndex === -1) {
            return res
                .type('text/plain')
                .status(400)
                .send('Invalid format. Expected: ipaddress,path');
        }
        const ipaddress = body.substring(0, commaIndex).trim();
        const path = body.substring(commaIndex + 1).trim();

        const countRes = await pool.query(
            'SELECT COUNT(*)::int AS count FROM bans WHERE ipaddress = $1',
            [ipaddress],
        );
        const currentCount: number = countRes.rows[0].count;

        if (currentCount < THRESHOLD) {
            await pool.query(
                'INSERT INTO bans (ipaddress, path) VALUES ($1, $2)',
                [ipaddress, path],
            );
        }

        const afterRes = await pool.query(
            'SELECT COUNT(*)::int AS count FROM bans WHERE ipaddress = $1',
            [ipaddress],
        );
        const afterCount: number = afterRes.rows[0].count;

        res.type('text/plain').send(afterCount >= THRESHOLD ? 'true' : 'false');
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Database error');
    }
});

app.get('/blocklist', async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT ipaddress, path, timestamp
            FROM bans
            WHERE ipaddress IN (
                SELECT ipaddress FROM bans GROUP BY ipaddress HAVING COUNT(*) >= $1
            )
            ORDER BY ipaddress ASC
        `;
        const dbRes = await pool.query(query, [THRESHOLD]);
        const lines = dbRes.rows.map(
            (row) => `${row.ipaddress},${row.path},${row.timestamp.toISOString()}`,
        );
        res.type('text/plain').send(lines.join('\n'));
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Database error');
    }
});

app.get('/isBlocked', async (req: Request, res: Response) => {
    const { ip } = req.query;

    if (!ip) {
        return res.type('text/plain').status(400).send('Missing ip query parameter');
    }

    try {
        const query = 'SELECT COUNT(*)::int AS count FROM bans WHERE ipaddress = $1';
        const dbRes = await pool.query(query, [ip]);
        const count: number = dbRes.rows[0].count;
        res.type('text/plain').send(count >= THRESHOLD ? 'true' : 'false');
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Database error');
    }
});

app.listen(3000, () => {
    console.log('Block service listening on port 3000');
});

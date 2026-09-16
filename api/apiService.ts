import express, { type Express, type Request, type Response } from 'express';
import axios from 'axios';

const app: Express = express();

const getIp = (req: Request): string => {
    const ff = req.headers['x-forwarded-for'];
    if (ff) {
        const ip = Array.isArray(ff) ? ff[0] : ff.split(',')[0];
        return ip.trim();
    }

    return req.socket.remoteAddress || req.ip || '';
};

app.get('/', async (req: Request, res: Response) => {
    const ip = getIp(req);
    const uri = `http://block-service:3000/isBlocked?ip=${encodeURIComponent(ip)}`;
    try {
        const blockRes = await axios.get(uri);
        const isBlocked = JSON.parse(blockRes.data);
        console.log('[API-service] isblocked', isBlocked);
        if (!isBlocked) {
            const logRes = await axios.get('http://log-service:3000/');
            res.status(200).json(logRes.data);
        } else if (isBlocked) {
            res.status(404).end();
        }
    } catch (err) {
        res.status(502).json(err);
    }
});

app.get('/log', async (req: Request, res: Response) => {
    try {
        const logData = await axios.get('http://log-service:3000/log');
        if (logData) {
            res.status(200).type('text/plain').send(logData.data);
        } else {
            res.status(404).end();
        }
    } catch (err) {
        res.status(502).json(err);
    }
});

app.get('/clear', async (req: Request, res: Response) => {
    try {
        const clearLogResult = await axios.get('http://log-service:3000/clear');
        const clearBlockResult = await axios.get(
            'http://block-service:3000/clear',
        );

        if (
            clearLogResult.data === 'complete' &&
            clearBlockResult.data === 'complete'
        ) {
            res.status(200).type('text/plain').send('complete');
        } else {
            res.status(502)
                .type('text/plain')
                .send('Error clearing log and/or database');
        }
    } catch (err) {
        console.error(err);
        res.status(502).json({ error: 'Upstream service error' });
    }
});

app.use(async (req: Request, res: Response) => {
    const ip = getIp(req);
    const path = req.path;

    try {
        const response = await axios.post(
            'http://block-service:3000/blocklist',
            `${ip},${path}`,
            { headers: { 'Content-Type': 'text/plain' } },
        );

        const blocked = response.data === 'true';

        if (blocked) {
            res.status(404).end();
        } else {
            res.status(401).send('Unauthorized');
        }
    } catch (err) {
        console.error(err);
        res.status(502).json({ error: 'Upstream service error' });
    }
});

app.listen(8199, () => {
    console.log('API service listening on port 8199');
});

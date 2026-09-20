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
        const isBlocked = blockRes.data === true || blockRes.data === 'true';
        if (!isBlocked) {
            const logRes = await axios.get('http://log-service:3000/');
            res.status(200).type('text/plain').send(logRes.data);
        } else {
            res.status(404).end();
        }
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Bad Gateway');
    }
});

app.get('/log', async (req: Request, res: Response) => {
    try {
        const logData = await axios.get('http://log-service:3000/log');
        res.status(200).type('text/plain').send(logData.data);
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Bad Gateway');
    }
});

app.get('/blocklist', async (req: Request, res: Response) => {
    try {
        const blockData = await axios.get(
            'http://block-service:3000/blocklist',
        );

        res.status(200).type('text/plain').send(blockData.data);
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Bad Gateway');
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
        res.status(502).type('text/plain').send('Bad Gateway');
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

        const blocked = response.data === true || response.data === 'true';

        if (blocked) {
            res.status(404).end();
        } else {
            res.status(401).end();
        }
    } catch (err) {
        console.error(err);
        res.status(502).type('text/plain').send('Bad Gateway');
    }
});

app.listen(8199, () => {
    console.log('API service listening on port 8199');
});

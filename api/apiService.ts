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

app.listen(8199, () => {
    console.log('API service listening on port 8199');
});

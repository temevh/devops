import express, { type Express, type Request, type Response } from 'express';
import axios from 'axios';

const app: Express = express();

app.get('/', async (req: Request, res: Response) => {
    const testIp = '127.5.6.7';
    const uri = `http://block-service:3000/isBlocked?ip=${testIp}`;
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

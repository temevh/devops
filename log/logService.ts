export {};
import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

export const app: Express = express();
let counter = 0;

const logDir = process.env.LOG_DIR || path.join(import.meta.dirname, 'data');
fs.mkdirSync(logDir, { recursive: true });
const filePath = path.join(logDir, 'logs.txt');

app.get('/', async (req: Request, res: Response) => {
    counter += 1;
    const timeStamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const addToLog = `${counter},${timeStamp}`;

    try {
        await fs.promises.appendFile(filePath, addToLog + '\n');
        res.status(200).type('text/plain').send(addToLog);
    } catch (err) {
        console.error('Error writing to file:', err);
        res.status(500).type('text/plain').send('Error writing to log');
    }
});

app.get('/log', async (req: Request, res: Response) => {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        res.type('text/plain').send(data);
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return res.type('text/plain').send('');
        }
        console.error('Error reading file:', err);
        res.status(502).type('text/plain').send('Error reading logs');
    }
});

app.get('/clear', async (req: Request, res: Response) => {
    try {
        await fs.promises.writeFile(filePath, '');
        counter = 0;
        res.status(200).type('text/plain').send('complete');
    } catch (err) {
        console.error('Error clearing log file:', err);
        res.status(500).type('text/plain').send('Error clearing logs');
    }
});

app.listen(Number(process.env.PORT ?? '3000'), () => {
    console.log('Log service listening on port 3000');
});

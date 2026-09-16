import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

const app: Express = express();
let counter = 0;

const filePath = path.join(import.meta.dirname, 'logs.txt');

app.get('/', (req: Request, res: Response) => {
    counter += 1;
    const timeStamp = new Date().toISOString();
    const addToLog = `${counter},${timeStamp}`;

    fs.appendFile(filePath, addToLog + '\n', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        }
    });
    res.status(200).type('text/plain').send(addToLog);
});

app.get('/log', (req: Request, res: Response) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.type('text/plain').send('');
            }
            console.error('Error reading file:', err);
            res.status(500).send('Error reading logs');
        }

        res.type('text/plain').send(data);
    });
});

app.get('/clear', (req: Request, res: Response) => {
    fs.writeFile(filePath, '', (err) => {
        if (err) {
            console.error('Error clearing log file:', err);
            return res.status(500).send('Error clearing logs');
        }
        counter = 0;
        res.status(200).type('text/plain').send('complete');
    });
});

app.listen(3000, () => {
    console.log('Log service listening on port 3000');
});

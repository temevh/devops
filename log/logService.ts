import express, { type Express, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

const app: Express = express();
let counter = 0;

app.get('/', (req: Request, res: Response) => {
    counter += 1;
    const timeStamp = new Date();
    const addToLog = `\r\n${counter},${timeStamp.toISOString()}`;
    fs.appendFile(
        path.join(import.meta.dirname, 'logs.txt'),
        addToLog,
        function (err) {
            if (err) throw err;
            console.log('Added', addToLog, 'to logs');
        },
    );
    res.status(200).json(addToLog);
});

app.get('/log', (req: Request, res: Response) => {
    fs.readFile(
        path.join(import.meta.dirname, 'logs.txt'),
        'utf8',
        (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                res.status(500).send('Error reading logs');
                return;
            }

            if (!data) {
                res.send('No log data found');
                return;
            }

            res.type('text/plain').send(data);
        },
    );
});

app.listen(3000);

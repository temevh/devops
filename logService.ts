import express, { type Express, type Request, type Response } from 'express';
import fs from "fs"

const app: Express = express();
let counter = 0;

app.get('/log', (req: Request, res: Response) => {
    counter += 1;
    const timeStamp = new Date()
    const addToLog = `\r\n${counter},${timeStamp.toISOString()}`
    fs.appendFile('logs.txt', addToLog, function(err){
        if (err) throw err;
        console.log("Added", addToLog, "to logs")
    })
    res.send(timeStamp)
    res.send('Hello World!');
});

app.listen(3000);

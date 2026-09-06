import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

app.get('/', async (req: Request, res: Response) => {
    res.status(200).json('Hello from apiService');
});

app.listen(8199, () => {
    console.log('API service listening on port 8199');
});

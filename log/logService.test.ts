import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from './logService';

test('GET / returns a status 200', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
});

test('GET /log returns data ', async () => {
    await request(app).get('/');
    const res = await request(app).get('/log');
    assert.strictEqual(res.status, 200);
    assert(res.text.length > 0);
});

test('GET /clear clears the logfile ', async () => {
    await request(app).get('/clear');
    const res = await request(app).get('/log');
    assert.strictEqual(res.status, 200);
    assert(res.text.length == 0);
});

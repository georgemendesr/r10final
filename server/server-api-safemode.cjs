const express = require('express');
const app = express();
app.get('/api/health', (_req,res)=> res.type('text/plain').send('ok'));
app.listen(3002, '127.0.0.1', ()=> console.log('SAFE API on 3002'));

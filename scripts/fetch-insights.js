// Script para login e fetch de /api/social/insights
const fetch = (...args)=>import('node-fetch').then(({default:fetch})=>fetch(...args));
(async()=>{
  try {
    const base = 'http://localhost:3002/api';
    const credentials = { email: 'joao@r10piaui.com', password: 'admin' };
    const loginRes = await fetch(base + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(credentials), redirect:'manual' });
    const setCookie = loginRes.headers.raw()['set-cookie'] || [];
    if(!loginRes.ok) { console.error('Login falhou', loginRes.status); process.exit(1); }
    const cookies = setCookie.map(c=>c.split(';')[0]).join('; ');
    const insightsRes = await fetch(base + '/social/insights', { headers:{ Cookie: cookies }});
    const json = await insightsRes.json();
    console.log('INSIGHTS_PAYLOAD:', JSON.stringify(json, null, 2));
  } catch(e){
    console.error(e);
    process.exit(1);
  }
})();

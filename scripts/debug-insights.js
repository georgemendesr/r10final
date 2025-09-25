const fetch = (...a)=>import('node-fetch').then(({default:fetch})=>fetch(...a));
(async()=>{
  const base='http://localhost:3002/api';
  try {
    const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'joao@r10piaui.com',password:'admin'})});
    if(!login.ok){console.error('Login falhou',login.status);process.exit(1);} 
    const cookies=(login.headers.raw()['set-cookie']||[]).map(c=>c.split(';')[0]).join('; ');
    const debug=await fetch(base+'/social/insights/debug',{headers:{Cookie:cookies}});
    const dbgJson=await debug.json();
    console.log('DEBUG_STATUS',dbgJson);
    const insights=await fetch(base+'/social/insights',{headers:{Cookie:cookies}});
    const insJson=await insights.json();
    console.log('INSIGHTS',JSON.stringify(insJson,null,2));
  } catch(e){console.error(e);process.exit(1);} 
})();

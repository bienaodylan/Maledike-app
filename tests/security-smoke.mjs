// Security regression smoke tests. Run with SECURITY_TEST_BASE_URL (defaults to localhost:3000).
// Optional SECURITY_TEST_USER_JWT enables authenticated-user negative tests; never use a founder token.
import assert from 'node:assert/strict';
const base=(process.env.SECURITY_TEST_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
async function request(path,init={}){const r=await fetch(base+path,init);const text=await r.text();let body;try{body=JSON.parse(text)}catch{}return {status:r.status,headers:r.headers,body,text};}
const tests=[];
tests.push(['admin orders rejects anonymous',async()=>assert.equal((await request('/api/admin/orders')).status,401)]);
tests.push(['admin tickets rejects anonymous',async()=>assert.equal((await request('/api/admin/tickets')).status,401)]);
tests.push(['order creation rejects anonymous',async()=>assert.equal((await request('/api/orders/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({quantity:5})})).status,401)]);
tests.push(['gateway secret mutation rejects anonymous',async()=>assert.equal((await request('/api/admin/gateway-config',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,401)]);
tests.push(['unknown API route returns JSON 404',async()=>{const r=await request('/api/not-a-route');assert.equal(r.status,404);assert.equal(r.headers.get('content-type')?.includes('application/json'),true);assert.ok(r.body?.error)}]);
tests.push(['digital downloads stay disabled until files exist',async()=>assert.equal((await request('/api/digital-products/download/test')).status,410)]);
tests.push(['invalid scanner credential rejected',async()=>{const r=await request('/api/tickets/agent-scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({qrTokenHash:'x',scannerToken:'fake'})});assert.equal(r.status,400)}]);
if(process.env.SECURITY_TEST_USER_JWT)tests.push(['string quantity rejected before database call',async()=>{const r=await request('/api/orders/create',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+process.env.SECURITY_TEST_USER_JWT},body:JSON.stringify({quantity:'5',buyerName:'Test buyer',buyerWhatsApp:'12345678'})});assert.equal(r.status,400)}]);
let failures=0;for(const [name,fn]of tests){try{await fn();console.log('PASS',name)}catch(e){failures++;console.error('FAIL',name,e.message)}}console.log(`\n${tests.length-failures}/${tests.length} tests passed`);if(failures)process.exit(1);

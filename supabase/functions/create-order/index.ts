// Retired by security remediation: production checkout is served by Express /api/orders/create.
// Keep JWT verification enabled; this function must not create orders or bypass atomic capacity.
Deno.serve(async (_req:Request)=>{
  return new Response(JSON.stringify({error:'Endpoint retiré. Utilisez l’API officielle du site.'}),{
    status:410,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
});

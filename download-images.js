// Uso (na sua máquina, Node 18+ e internet): node tools/download-images.js
// Baixa os ícones dos perks pendentes cujo imagem.fonte seja uma URL direta de imagem.
const fs=require('fs'),path=require('path'),R=path.join(__dirname,'..'),F=path.join(R,'data/perks.json');
const perks=JSON.parse(fs.readFileSync(F,'utf8')),EXT={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif','image/svg+xml':'.svg'};
(async()=>{let ok=0,falha=0,sem=0;
 for(const p of perks){const i=p.imagem||{};if(i.status==='encontrada')continue;
  if(!/^https?:\/\//.test(i.fonte||'')){sem++;continue}
  try{const r=await fetch(i.fonte),t=(r.headers.get('content-type')||'').split(';')[0];
   if(!r.ok||!EXT[t])throw new Error(r.ok?'a fonte não é uma imagem ('+t+')':'HTTP '+r.status);
   const f='assets/perks/'+p.id+EXT[t];fs.mkdirSync(path.join(R,'assets/perks'),{recursive:true});
   fs.writeFileSync(path.join(R,f),Buffer.from(await r.arrayBuffer()));
   p.imagem={...i,arquivo:f,status:'encontrada'};ok++;console.log('ok   ',p.nome)}
  catch(e){falha++;console.log('falha',p.nome,'-',e.message)}}
 if(ok){fs.mkdirSync(path.join(R,'data/backups'),{recursive:true});fs.copyFileSync(F,path.join(R,'data/backups','perks-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'));fs.writeFileSync(F,JSON.stringify(perks,null,2))}
 console.log(`Baixadas: ${ok} | falhas: ${falha} | sem URL direta em imagem.fonte: ${sem}. Recarregue a página.`)})();

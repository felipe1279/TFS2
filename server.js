const http=require('http'),fs=require('fs'),path=require('path');
const R=__dirname,PORT=process.env.PORT||3000;
const T={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.gif':'image/gif'};
const F={perks:'data/perks.json',builds:'data/builds.json',tags:'data/tags.json'};
fs.mkdirSync(path.join(R,'assets/perks'),{recursive:true});
fs.mkdirSync(path.join(R,'data/backups'),{recursive:true});
http.createServer((req,res)=>{
  const u=decodeURIComponent(req.url.split('?')[0]),m=u.match(/^\/api\/(perks|builds|tags)$/);
  if(m){
    const f=path.join(R,F[m[1]]);
    if(req.method==='GET')return fs.readFile(f,(e,d)=>{res.writeHead(200,{'Content-Type':T['.json']});res.end(e?'[]':d)});
    if(req.method==='PUT'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{
      try{JSON.parse(b)}catch{res.writeHead(400);return res.end('JSON inválido')}
      if(fs.existsSync(f))fs.copyFileSync(f,path.join(R,'data/backups',m[1]+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'));
      fs.writeFileSync(f,b);res.writeHead(200);res.end('ok')});return}
  }
  if(u==='/api/pacote'){res.writeHead(200,{'Content-Type':'text/markdown;charset=utf-8','Content-Disposition':'attachment; filename="tfs2-base-para-ia.md"'});return res.end(require('./tools/pacote.js').gerar())}
  if(req.method==='POST'&&u==='/api/upload'){
    const n=new URL(req.url,'http://x').searchParams.get('name')||'';
    if(!/^[a-z0-9-]+\.(png|jpe?g|webp|gif|svg)$/i.test(n)){res.writeHead(400);return res.end('Nome de arquivo inválido')}
    const ch=[];let sz=0;req.on('data',c=>{sz+=c.length;if(sz<=5e6)ch.push(c)});
    req.on('end',()=>{if(sz>5e6){res.writeHead(413);return res.end('Imagem maior que 5 MB')}fs.writeFileSync(path.join(R,'assets/perks',n),Buffer.concat(ch));res.writeHead(200);res.end('ok')});return}
  const p=u==='/'?'/public/index.html':(u.startsWith('/assets/')?u:'/public'+u),fp=path.join(R,path.normalize(p));
  if(!fp.startsWith(R)){res.writeHead(403);return res.end()}
  fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('404')}res.writeHead(200,{'Content-Type':T[path.extname(fp)]||'application/octet-stream'});res.end(d)});
}).listen(PORT,()=>console.log('TFS2 Build Lab: http://localhost:'+PORT));

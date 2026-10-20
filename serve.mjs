import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('.',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.resolve(root,'.'+name);if(file!==root&&!file.startsWith(root+path.sep))throw Error();if(name.endsWith('/'))file=path.join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log('Open http://127.0.0.1:'+server.address().port));

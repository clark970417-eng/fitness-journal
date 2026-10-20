require('esbuild').buildSync({entryPoints:['exercise-demo.js'],outfile:'demo-runtime.js',bundle:true,minify:true,format:'iife',platform:'browser',target:['safari17','chrome110'],define:{'import.meta.env':'{}'}});
const fs=require('node:fs');const path=require('node:path');
const files=fs.readdirSync('.').filter(n=>/\.(html|css|js|mjs|svg|glb|woff2|json)$/.test(n)&&!/(test|build|package|serve)/.test(n));
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');for(const n of files)fs.copyFileSync(n,path.join('dist',n));if(fs.existsSync('vendor'))fs.cpSync('vendor','dist/vendor',{recursive:true});for(const n of ['LICENSE','MODEL-LICENSE.md','THREE-LICENSE','ICONS-LICENSE'])if(fs.existsSync(n))fs.copyFileSync(n,'dist/'+n);fs.writeFileSync('dist/.nojekyll','');
// Fingerprint asset URLs so existing visitors receive the same JS/CSS as the new HTML.
const crypto=require('node:crypto');
const html=fs.readFileSync('dist/index.html','utf8').replace(/(src|href)="(\.\/[^"?]+\.(?:js|css))"/g,(_,attribute,url)=>{const bytes=fs.readFileSync(path.join('dist',url));return `${attribute}="${url}?v=${crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)}"`;});
fs.writeFileSync('dist/index.html',html);

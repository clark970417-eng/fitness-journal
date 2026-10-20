require('esbuild').buildSync({entryPoints:['exercise-demo.js'],outfile:'demo-runtime.js',bundle:true,minify:true,format:'iife',platform:'browser',target:['safari17','chrome110'],define:{'import.meta.env':'{}'}});
const fs=require('node:fs');const path=require('node:path');
const files=fs.readdirSync('.').filter(n=>/\.(html|css|js|mjs|svg|glb|woff2|json)$/.test(n)&&!/(test|build|package|serve)/.test(n));
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');for(const n of files)fs.copyFileSync(n,path.join('dist',n));if(fs.existsSync('vendor'))fs.cpSync('vendor','dist/vendor',{recursive:true});for(const n of ['LICENSE','MODEL-LICENSE.md','THREE-LICENSE','ICONS-LICENSE'])if(fs.existsSync(n))fs.copyFileSync(n,'dist/'+n);fs.writeFileSync('dist/.nojekyll','');

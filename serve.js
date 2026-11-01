const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
const T={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';
fs.readFile(path.join(ROOT,p),(e,b)=>{if(e){s.writeHead(404).end();return;}
s.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});s.end(b);});
}).listen(8123,'127.0.0.1',()=>console.log('http://127.0.0.1:8123'));

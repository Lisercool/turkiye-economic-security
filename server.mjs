import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep} from 'node:path';
const root=fileURLToPath(new URL('./site/',import.meta.url));
const port=Number(process.env.PORT||4174);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid PORT');
const routes=new Map([
  ['/','index.html'],['/index.html','index.html'],['/analytics.html','analytics.html'],['/methodology.html','methodology.html'],
  ...['app.js','data.js','model.js','charts.js','styles.css','favicon.svg','turkiye-data.csv'].map(name=>['/assets/'+name,'assets/'+name])
]);
const mime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',csv:'text/csv; charset=utf-8'};
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy':"default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; img-src 'self'; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'"};
const server=createServer(async(req,res)=>{
  const fail=status=>{res.writeHead(status,headers);res.end();};
  if(!['GET','HEAD'].includes(req.method))return fail(405);
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return fail(403);
  if(req.headers['sec-fetch-site']==='cross-site')return fail(403);
  if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return fail(403);
  const file=routes.get(req.url);
  if(!file)return fail(404);
  try{
    const path=resolve(root,file),actual=await realpath(path);
    if(actual!==path||!actual.startsWith(resolve(root)+sep))return fail(404);
    const bytes=await readFile(path);
    res.writeHead(200,{...headers,'Content-Type':mime[file.split('.').at(-1)],'Content-Length':bytes.length});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch{return fail(404);}
});
server.requestTimeout=10000;server.headersTimeout=10000;server.maxHeadersCount=40;
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));

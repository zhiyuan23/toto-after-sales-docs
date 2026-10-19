import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
if(!process.argv.includes('--run')) { console.log('运行：设置AFS_OPENAPI_SECRET，然后 node run-smoke.mjs --run；仅在指定测试环境写入OA26_样本。'); process.exit(0); }
const base=process.env.AFS_OPENAPI_BASE||'http://10.1.1.53:8011';
if(base!=='http://10.1.1.53:8011')throw Error('本模拟脚本仅允许已确认的测试环境');
const secret=process.env.AFS_OPENAPI_SECRET;if(!secret)throw Error('请设置AFS_OPENAPI_SECRET，勿把密钥写入文件或Git');
const response=await fetch(base+'/api/openapi/v1.0/oauth2/token',{method:'POST',body:new URLSearchParams({client_id:process.env.AFS_OPENAPI_APP_ID||'afs_openapi_test_20261019',client_secret:secret}),signal:AbortSignal.timeout(60000)});
const auth=await response.json();const token=auth.access_token||auth.data?.access_token;if(!token)throw Error('获取Token失败，业务码：'+auth.code);
const results=[];let failed=false;
async function call(resource,operation,body,expected=0){const res=await fetch(base+'/api/openapi/v1.0/afterSales/'+resource+'/'+operation,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});const data=await res.json();results.push({resource,operation,httpStatus:res.status,expectedCode:expected,passed:data.code===expected,response:data});if(data.code!==expected)failed=true;console.log(resource+'/'+operation+' code='+data.code+' requestId='+(data.requestId||''));return data;}
for(const [index,resource]of ['category','series','part','product','dealer','store','salesRegion','productInstance'].entries()){
 const data=JSON.parse(await readFile(path.join(root,'模拟数据',String(index+1).padStart(2,'0')+'-'+resource+'.json'),'utf8'));
 await call(resource,'save',data);
 const first=data.items[0];const query=resource==='salesRegion'?{subjectType:first.subjectType,subjectCode:first.subjectCode}:resource==='productInstance'?{uniqueCode:first.uniqueCode}:{code:first.code};
 await call(resource,'pageList',query);
 await call(resource,'save',data); // Same identifiers: verify upsert, not duplicates.
}
await call('category','save',JSON.parse(await readFile(path.join(root,'模拟数据/09-partial-failure.json'),'utf8')),422);
await call('category','status',{code:'OA26_BATCH_OK',enabled:false});
await call('category','status',{code:'OA26_BATCH_OK',enabled:true});
await call('category','save',{code:'OA26_CAT',name:'开放接口测试分类（部分更新）'});
await call('category','save',{code:'OA26_CAT',name:'不应保存',version:'stale-version'},422);
await call('product','save',{code:'OA26_INVALID_PRODUCT',name:'无关联商品',categoryCode:'MISSING',installationParts:[{partCode:'OA26_PART',quantity:1}],warrantyMonths:12},422);
await call('category','save',{items:Array.from({length:101},()=>({code:'OA26_LIMIT',name:'不应写入'}))},422);
await call('category','pageList',{page:0,pageSize:15},422);
const output=process.env.AFS_OPENAPI_EVIDENCE_DIR||path.join(root,'.local');await mkdir(output,{recursive:true});await writeFile(path.join(output,'smoke-result.json'),JSON.stringify({at:new Date().toISOString(),base,passed:!failed,results},null,2)+'\n');
if(failed)process.exitCode=1;

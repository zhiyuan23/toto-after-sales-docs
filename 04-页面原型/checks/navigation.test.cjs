const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)])}

test('原型页面和脚本不引用已删除的工作台，所有本地HTML资源链接可解析',()=>{
  const broken=[]
  for(const file of walk(root).filter(file=>/\.(html|js)$/.test(file)&&!file.includes(`${path.sep}assets${path.sep}`))){
    const source=fs.readFileSync(file,'utf8')
    for(const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
      const value=match[1]
      if(/^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(value)||/[${}]/.test(value))continue
      const relative=value.split(/[?#]/)[0]
      if(!relative)continue
      const target=path.resolve(path.dirname(file),decodeURIComponent(relative))
      if(!fs.existsSync(target))broken.push(`${path.relative(root,file)} → ${value}`)
    }
  }
  assert.deepEqual(broken,[])
})

test('统一入口的页面目录均指向存在的原型文件',()=>{
  const source=fs.readFileSync(path.join(root,'prototype-catalog.js'),'utf8')
  const files=[...source.matchAll(/file:'([^']+)'/g)].map(match=>match[1])
  assert.ok(files.length>=7,'必须覆盖五后台角色及两端小程序')
  for(const file of files)assert.ok(fs.existsSync(path.resolve(root,file.split(/[?#]/)[0])),file)
  for(const retired of ['customer-service.html','service-station.html','admin.js','role-workbench.js'])assert.equal(fs.existsSync(path.join(root,'后台系统',retired)),false,retired)
})

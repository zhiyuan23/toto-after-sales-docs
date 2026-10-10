/** 从交付 Markdown 生成阅读与打印 HTML。运行：node scripts/build-delivery-docs.mjs */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, '06-项目交付');
// 优先使用调用方安装的 marked；Codex 桌面环境可用其已捆绑的模块路径。
let marked;
try { ({ marked } = await import('marked')); }
catch { const module = process.env.MARKED_MODULE; if (!module) throw new Error('需要 marked：请设置 MARKED_MODULE 为已安装 marked 的 ESM 文件路径，见交付 README。'); ({ marked } = await import(pathToFileURL(module).href)); }
const roles = [
 ['01-总部运营操作手册', '总部运营', '商品、渠道、网络、规则与服务治理'],
 ['02-客服操作手册', '客服主管与专员', '工单、调度、审核、回访与投诉'],
 ['03-服务站管理员操作手册', '服务站管理员', '本站派人、排班、库存与异常协同'],
 ['04-门店操作手册', '代理商管理员与店员', '购买登记、代客申请与进度查询'],
 ['05-服务人员操作手册', '服务人员', '任务、预约、履约、配件与问题反馈'],
 ['06-消费者使用指南', '消费者', '本人产品、服务申请、进度与反馈'],
 ['07-系统管理员操作手册', '系统管理员', '身份、角色、数据范围与运行协同'],
];
const documents = roles.map(([name, audience]) => ({ source: `02-角色手册/${name}.md`, output: `02-角色手册/${name}.html`, type: 'role', audience }));
documents.push({source:'03-项目说明/00-项目说明大纲.md',output:'03-项目说明/index.html',type:'project',audience:'管理层、客户及培训讲解者'}, {source:'04-交付材料/00-交付清单.md',output:'04-交付材料/index.html',type:'delivery',audience:'业务负责人、项目组与接收岗位'});
const aliases = new Map(documents.map(d => [path.join(base,d.source), path.join(base,d.output)]));
aliases.set(path.join(base,'02-角色手册/00-手册索引.md'), path.join(base,'02-角色手册/index.html'));
aliases.set(path.join(base,'README.md'), path.join(base,'index.html'));
const esc = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const relative = (output, target) => path.relative(path.dirname(path.join(base,output)),path.join(base,target)).split(path.sep).join('/');
function rewriteLinks(html, source, output) {
 return html.replace(/href="([^"#]+)(#[^"]*)?"/g,(match,href,hash='')=>{
  if (/^(https?:|mailto:)/.test(href)) return match;
  const actual=path.resolve(path.dirname(path.join(base,source)),decodeURIComponent(href));
  const target=aliases.get(actual);
  if (!target) return match;
  return `href="${esc(path.relative(path.dirname(path.join(base,output)),target).split(path.sep).join('/'))}${hash}"`;
 });
}
function header(output, selected, sidebar=true) {
 return `<a class="skip" href="#main">跳到正文</a><header class="topbar"><a class="brand" href="${relative(output,'index.html')}"><span class="brand-word">TOTO</span><span class="brand-label">售后服务 · 交付文档</span></a><nav class="topnav" aria-label="文档类型">${[['role','角色手册','02-角色手册/index.html'],['project','项目说明','03-项目说明/index.html'],['delivery','交付清单','04-交付材料/index.html']].map(([id,title,target])=>`<a ${id===selected?'aria-current="page" class="active"':''} href="${relative(output,target)}">${title}</a>`).join('')}</nav><div class="header-end"><span class="preview-label">v0.1 · 业务复核稿</span>${sidebar?'<button class="button menu-toggle" type="button" data-menu aria-expanded="false" aria-controls="document-sidebar">目录</button>':''}<button class="button print-button" type="button" data-print>打印全文</button></div></header>`;
}
function shell(output,title,type,content,sidebar=true) {
 return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(title)} · TOTO 售后服务交付材料 v0.1"><title>${esc(title)} · TOTO</title><link rel="stylesheet" href="${relative(output,'assets/styles.css')}"><script src="${relative(output,'assets/app.js')}" defer></script></head><body class="${type==='delivery'?'checklist-page':type==='role-index'?'role-index':''}">${header(output,type,sidebar)}${content}</body></html>\n`;
}
function search(type) {
 const controls=type==='delivery'?`<div class="field"><label for="category">材料类别</label><select id="category" data-category-filter><option value="">全部类别</option>${['项目说明','角色培训','应用环境','技术运维','范围边界'].map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field"><label for="status">材料状态</label><select id="status" data-status-filter><option value="">全部状态</option>${['首版待复核','已有材料','待核对','参考待生效','后续规划','不进入对外包'].map(c=>`<option>${c}</option>`).join('')}</select></div>`:'';
 return `<div class="search-row no-print"><div class="field"><label for="search">${type==='delivery'?'查找材料与核对要点':'搜索当前文档'}</label><input id="search" type="search" data-search placeholder="${type==='delivery'?'输入编号、材料或岗位':'输入任务或业务关键词'}"></div>${controls}<button class="button" data-clear type="button">重置</button></div><p class="search-result" data-search-result role="status" aria-live="polite"></p><p class="no-result" data-empty hidden>没有匹配内容，请调整条件或点击重置。</p>`;
}
const footer=output=>`<footer class="article-footer"><span>v0.1 · 2026-10-10 · 业务复核稿</span><a href="${relative(output,'index.html')}">返回交付文档首页 →</a></footer>`;
for (const doc of documents) {
 const source=await fs.readFile(path.join(base,doc.source),'utf8');
 const title=source.match(/^# (.+)$/m)[1];
 const withoutTitle=source.replace(/^# .+\n+/,'');
 const sourceLine=withoutTitle.match(/^依据：.+$/m)?.[0]||'';
 const text=withoutTitle.replace(/^依据：.+$/m,'').trim();
 const start=text.search(/^## /m); const intro=text.slice(0,start).trim();
 const chunks=text.slice(start).split(/(?=^## )/m).filter(Boolean);
 const chapters=chunks.map((chunk,i)=>({id:`chapter-${i+1}`,title:chunk.match(/^## (.+)/)[1],body:chunk.replace(/^## .+\n+/, '')}));
 let body='';
 for (let i=0;i<chapters.length;i++) {
  const chapter=chapters[i]; let html=marked.parse(chapter.body,{gfm:true});
  html=html.replace(/<table>/g,'<div class="table-wrap"><table class="data-table">').replace(/<\/table>/g,'</table></div>').replace(/<th>/g,'<th scope="col">').replace(/<ol>/g,'<ol class="steps">');
  html=html.replace(/<p><strong>((?:前提[^：]*|入口)：)<\/strong>([\s\S]*?)<\/p>/g,'<p class="entry-note"><strong>$1</strong>$2</p>');
  html=html.replace(/<p><strong>((?:结果[^：]*|异常[^：]*|限制|收费边界|价格边界|标识边界|失败处理)：)<\/strong>([\s\S]*?)<\/p>/g, (all,label,body)=>`<div class="callout ${/异常|限制|失败/.test(label)?'warning':''}" role="note"><strong>${label}</strong><p>${body}</p></div>`);
  html=html.replace(/<h3>([^<]*[？?])<\/h3>\s*<p>([\s\S]*?)<\/p>/g,'<details class="faq"><summary>$1</summary><p>$2</p></details>');
  let group=false;
  if(doc.type==='delivery'&&i>=1&&i<=5){group=true; const category=['项目说明','角色培训','应用环境','技术运维','范围边界'][i-1];html=html.replace(/<tr>\s*<td>([PROAS]\d{2})/g,`<tr data-search-item data-category="${category}"><td>$1`);html=html.replace(/(<tr data-search-item[^>]*)(>)([\s\S]*?<\/tr>)/g,(all,tag,end,cells)=>{const status=cells.match(/<td>(首版待复核|已有材料|待核对|参考待生效|后续规划|不进入对外包)<\/td>/)?.[1];if(!status)throw new Error('清单状态缺失');return `${tag} data-status="${status}"${end}${cells.replace(`<td>${status}</td>`,`<td><span class="pill ${status==='首版待复核'?'blue':''}">${status}</span></td>`)}`;});}
  body+=`<section class="content-section" id="${chapter.id}" ${doc.type!=='delivery'?'data-search-item':''} ${group?'data-search-group':doc.type==='delivery'?'data-search-context':''}><div class="section-heading"><span class="section-no">${String(i+1).padStart(2,'0')}</span><h2>${esc(chapter.title.replace(/^\d+\. /,''))}</h2></div>${html}</section>`;
 }
 const sidebar=`<aside class="sidebar" id="document-sidebar"><p class="sidebar-title">${doc.type==='role'?'岗位操作与培训':doc.type==='project'?'八章阅读版':'39 项核对清单'}</p><p class="doc-name">${esc(title)}</p><nav aria-label="章节目录">${chapters.map(c=>`<a href="#${c.id}">${esc(c.title)}</a>`).join('')}</nav>${doc.type==='role'?`<a class="role-return" href="index.html">← 选择其他岗位手册</a>`:''}</aside>`;
 const quick=doc.type==='delivery'?'':`<aside class="rail"><p class="rail-label">快速进入</p>${[chapters[1],chapters[Math.floor(chapters.length/2)],chapters.at(-1)].map(c=>`<a href="#${c.id}">${esc(c.title.replace(/^\d+\. /,''))}</a>`).join('')}<div class="rail-block">先核对岗位与前提，再按实际状态办理。<br>打印按钮输出全文。</div></aside>`;
 const introHtml=marked.parse(intro.replace(/版本 v0\.1 · 2026-10-10 · 业务复核稿[；。]/,''),{gfm:true});
 const sources=sourceLine?`<details class="source-note"><summary>内容依据 · 供内部复核</summary>${marked.parse(sourceLine)}<p>依据链接需同一文档仓库；单独对外阅读包按交付清单筛选，不包含内部账号或凭据。</p></details>`:'';
 let content=`<div class="layout">${sidebar}<main class="article" id="main"><div class="breadcrumb"><a href="${relative(doc.output,'index.html')}">交付文档</a> / ${doc.type==='role'?'角色手册':doc.type==='project'?'项目说明':'交付清单'}</div><p class="eyebrow">${doc.type==='role'?'ROLE HANDBOOK':doc.type==='project'?'PROJECT OVERVIEW':'DELIVERY CHECKLIST'}</p><h1 class="doc-title">${esc(title)}</h1><div class="lead">${introHtml}</div><div class="meta"><span>适用：${esc(doc.audience)}</span><span>v0.1 · 2026-10-10</span><span class="pill blue">业务复核稿</span></div>${search(doc.type)}${body}${sources}${footer(doc.output)}</main>${quick}</div>`;
 content=rewriteLinks(content,doc.source,doc.output);
 await fs.writeFile(path.join(base,doc.output),shell(doc.output,title,doc.type,content));
}
const roleEntries=roles.map(([name,audience,description],i)=>`<a class="document-entry" data-search-item href="${name}.html"><span class="doc-number">${String(i+1).padStart(2,'0')}</span><div><h2>${esc(name.slice(3))}</h2><p>${esc(description)}</p><small>${esc(audience)}</small></div><span class="entry-action">阅读手册 →</span></a>`).join('');
await fs.writeFile(path.join(base,'02-角色手册/index.html'),shell('02-角色手册/index.html','选择岗位手册','role',`<main class="landing role-index" id="main"><p class="eyebrow">ROLE HANDBOOKS</p><h1 class="doc-title">按岗位找到工作方法</h1><p class="lead">七本手册统一说明职责、入口、办理步骤、结果核对与异常交接。先选择实际职责；主管、专员和兼任岗位的动作仍按账号独立授权。</p><div class="landing-meta"><span>7 类岗位</span><span>v0.1 · 2026-10-10</span><span>业务复核稿</span></div>${search('role-index')}<div class="document-list">${roleEntries}</div>${footer('02-角色手册/index.html')}</main>`,false));
const entries=[['01','角色手册','七类岗位：从日常任务到异常交接','02-角色手册/index.html','选择岗位'],['02','项目说明','八章阅读：建设目标、协同方式、能力边界与交付安排','03-项目说明/index.html','开始阅读'],['03','交付清单','39 项材料与交接核对，9 个培训场景，实际结果待填写','04-交付材料/index.html','核对材料']];
await fs.writeFile(path.join(base,'index.html'),shell('index.html','项目交付文档','portal',`<main class="landing" id="main"><p class="eyebrow">TOTO AFTER-SALES SERVICE</p><h1 class="doc-title">把服务方法与交付范围<br>放在同一份文档中。</h1><p class="lead">面向业务使用、项目介绍和交付核对。以完整项目为基础，按当前规则说明职责、操作及边界，帮助各岗位找到下一步。</p><div class="landing-meta"><span>3 个应用 · 7 类岗位</span><span>v0.1 · 2026-10-10</span><span class="pill blue">业务复核稿</span></div><div class="document-list">${entries.map(([id,title,desc,target,action])=>`<a class="document-entry" href="${target}"><span class="doc-number">${id}</span><div><h2>${title}</h2><p>${desc}</p></div><span class="entry-action">${action} →</span></a>`).join('')}</div><div class="review-grid"><div><h3>按一个完整场景复核</h3><p>先看项目全景，再由各岗位完成一条正常任务及一条异常任务。核对入口、动作权限、办理结果和交接信息。</p></div><div><h3>把材料与签收分开记录</h3><p>本版正文与网页已形成，业务复核、培训、运行开放和实际签收各自核对。打印与阅读使用同一内容，不预填完成结果。</p></div></div><div class="reading-path"><p>现场讲解：<a href="03-项目说明/网页演示/工单流转/index.html">工单流转专题 →</a></p></div>${footer('index.html')}</main>`,false));
console.log('已生成 11 个交付 HTML 页面：7 本手册、八章说明、39 项清单及 2 个导航页。');

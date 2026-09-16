# 原型素材说明

## 消费者产品展示

2026-09-12 从项目已有官网素材清单中选取并下载两张原图，保留原图内容和比例，用于消费者产品中心的构图评审；2026-09-16 另加入一张 AI 生成的非白底兼容性样品。购买记录、客户资料、房间名称、安装码与服务单均为原型虚构数据，不代表真实购买或关联关系。

| 本地文件 | 产品与来源 |
| --- | --- |
| [product-toilet.jpg](product-toilet.jpg) | 诺锐斯特 LS · CES8G820GCN；[官网产品页](https://www.toto.com.cn/cn/products/categories/toilet/auto/product/CES8G820GCN.html)、[原图](https://www.toto.com.cn/cn/resource/images/product/CES8G820GCN/l.jpg)。图片包含遥控器 |
| [product-basin.jpg](product-basin.jpg) | 台下式洗面器 · LW1535B；[官网产品页](https://www.toto.com.cn/cn/products/categories/lavatory/under_desk/product/LW1535B.html)、[原图](https://www.toto.com.cn/cn/resource/images/product/LW1535B/l.jpg)。图片中的龙头、台面为搭配展示，不据图片定义供货范围 |
| [product-bathtub-scene.jpg](product-bathtub-scene.jpg) | AI 生成的非白底浴室场景图，仅用于验证现有产品舞台对完整背景图片的显示效果；“独立式浴缸／场景图演示”不是正式 TOTO 商品、型号或素材 |

项目已有核对依据：[官方素材清单](../../../specs/evidence/2026-09-11-toto-online-showcase/manifest.json)。两张官网 JPEG 均为 630 × 500，原型使用等比完整展示。场景图由 OpenAI 内置图像生成能力制作，再压缩为 625 × 500 JPEG；提示词要求白色独立浴缸置于冷灰石材浴室中、背景填满画面、无品牌文字和水印。该图只作原型兼容性样品，不作为官网素材或真实产品依据。

## 图标

除下述 Lucide 两项外，`icons/` 使用项目现有 `@iconify-json/mdi` 中的 Material Design Icons 原始图形，仅包装 SVG 文件供离线原型引用，未手工重画路径。

- 作者：Pictogrammers / Templarian。
- 来源：[Material Design Icons](https://github.com/Templarian/MaterialDesign)。
- 许可：[Apache License 2.0](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE)。
- 名称映射：install → tools，repair → wrench-outline，guidance → comment-question-outline，home → home-outline，service → progress-wrench，mine → account-outline，check → check-circle-outline，plus → plus，camera → camera-outline。

## 截图

`wireframe-*.jpg` 和 `prototype-preview.jpg` 保留首轮 v0.1 结构截图。后续原型以入口页面为准；截图不随代码自动更新。

`worker-v02-overview.png` 为 2026-09-13 服务人员 v0.2 三 Tab 原型的浏览器截图；对应 [并排预览](../worker-overview.html)，不是 AI 生成图片或真实业务数据。

## 服务人员地图

`worker-map-base.svg` 复用本项目 `consumer-outlets.js` 的既有示意地图，裁出显示范围并改用“服务区域（示意）”文字；不是真实地理底图。`worker-v03-map-overview.png` 为 [地图与路线并排预览](../worker-map-overview.html) 的浏览器截图，位置、路线与路程全部为虚构样例。

`worker-v04-schedule-overview.png` 为 [今天／未来／过去日程预览](../worker-schedule-overview.html) 的浏览器截图，所有任务、日期及预约历史均为本地原型样例。

## v0.5 快捷入口与截图

- `icons/calendar.svg` 和 `icons/map.svg` 复用本地 `frontend/gaia-ui/apps/after-sales/src/features/navigation/icons.json` 中 Lucide 的 `calendar-days` / `map` 原始图形，仅包装 SVG 与设置颜色，没有重画路径。Lucide 使用 ISC 许可，来源与许可见 [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE)。
- `worker-v05-entry-overview.png` 为 [列表首页／日程／地图并排预览](../worker-entry-overview.html) 的浏览器截图，展示 v0.5 快捷入口与独立页面，使用本地虚构任务。

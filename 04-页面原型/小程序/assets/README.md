# 原型素材说明

## 消费者产品展示

2026-09-12 从项目已有官网素材清单中选取并下载两张原图，保留原图内容和比例，用于消费者产品中心的构图评审；2026-09-16 另加入一张 AI 生成的非白底兼容性样品。购买记录、客户资料、房间名称、安装码与服务单均为原型虚构数据，不代表真实购买或关联关系。

| 本地文件 | 产品与来源 |
| --- | --- |
| [product-toilet.jpg](product-toilet.jpg) | 诺锐斯特 LS · CES8G820GCN；[官网产品页](https://www.toto.com.cn/cn/products/categories/toilet/auto/product/CES8G820GCN.html)、[原图](https://www.toto.com.cn/cn/resource/images/product/CES8G820GCN/l.jpg)。图片包含遥控器 |
| [product-basin.jpg](product-basin.jpg) | 台下式洗面器 · LW1535B；[官网产品页](https://www.toto.com.cn/cn/products/categories/lavatory/under_desk/product/LW1535B.html)、[原图](https://www.toto.com.cn/cn/resource/images/product/LW1535B/l.jpg)。图片中的龙头、台面为搭配展示，不据图片定义供货范围 |
| [product-bathtub-scene.jpg](product-bathtub-scene.jpg) | AI 生成的非白底浴室场景图，用于验证后台标记为 `scene` 后的圆角满铺效果；“独立式浴缸／场景图演示”不是正式 TOTO 商品、型号或素材 |

项目已有核对依据：[官方素材清单](../../../specs/evidence/2026-09-11-toto-online-showcase/manifest.json)。两张官网 JPEG 均为 630 × 500，原型使用等比完整展示。场景图由 OpenAI 内置图像生成能力制作，再压缩为 625 × 500 JPEG；提示词要求白色独立浴缸置于冷灰石材浴室中、背景填满画面、无品牌文字和水印。该图只作原型兼容性样品，不作为官网素材或真实产品依据。

## 图标

除下述 Lucide 两项外，`icons/` 使用项目现有 `@iconify-json/mdi` 中的 Material Design Icons 原始图形，仅包装 SVG 文件供离线原型引用，未手工重画路径。

- 作者：Pictogrammers / Templarian。
- 来源：[Material Design Icons](https://github.com/Templarian/MaterialDesign)。
- 许可：[Apache License 2.0](https://github.com/Templarian/MaterialDesign/blob/master/LICENSE)。
- 名称映射：install → tools，repair → wrench-outline，guidance → comment-question-outline，home → home-outline，service → progress-wrench，mine → account-outline，check → check-circle-outline，plus → plus，camera → camera-outline，requisition → tray-arrow-down，return → tray-arrow-up，transfer → swap-horizontal。

## 截图

服务人员旧版线框、版本截图、日程与地图示意素材已于 2026-09-18 删除，避免被误作当前开发基线。当前服务人员端只允许参考 [唯一有效原型入口](../index.html?consumerVersion=0.13#w-tasks) 及其实际加载的 `worker.js` / `worker.css`。

`icons/calendar.svg` 继续用于首页“今日预约”筛选按钮；图形来自 Lucide `calendar-days`，使用 ISC 许可，来源与许可见 [Lucide](https://github.com/lucide-icons/lucide/blob/main/LICENSE)。

## 品牌产品中心 V1 图标补充（2026-09-27）

- `icons/product-cube.svg`：来自项目已安装 `@iconify-json/mdi` 的 `cube-outline`，Pictogrammers，Apache License 2.0；用于“我的产品”Tab。
- `icons/entry-chevron.svg`：复用消费者源码 `src/static/icons/entry-chevron.svg`，由 TDesign Icon 渲染；遵循项目 32rpx 细线进入箭头规范。
- V1 沿用本页列出的原有产品与场景图，不增加品牌正式素材认定。

## 首页 v0.15 彩色帮助图标（2026-10-08）

`help-icons/` 三张图片由本轮内置 Image Gen 独立生成，采用透明背景，之后按实际显示尺寸 52 × 52px 缩小，再使用 Sharp／libimagequant 做颜色与透明度量化、索引 PNG 编码与压缩。没有裁切或重绘。紫色只用于智能助手，网点使用青色，客服使用橙色。

| 文件 | 实际尺寸 | 压缩后大小 |
| --- | --- | --- |
| [assistant-purple-v1.png](help-icons/assistant-purple-v1.png) | 52 × 52px | 2,535 字节 |
| [outlets-teal-v1.png](help-icons/outlets-teal-v1.png) | 52 × 52px | 2,738 字节 |
| [support-orange-v1.png](help-icons/support-orange-v1.png) | 52 × 52px | 2,794 字节 |

本轮复用上述浴室场景图作为独立生活灵感影像，产品区使用原白底图，不加载此前取消的石材装饰背景。这些素材只用于原型评审，不代表获得 TOTO 品牌发布审核。

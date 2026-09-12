---
type: llm-wiki-system-context
topic: TOTO售后服务
status: source-verified
updated: 2026-09-08
owner: codex
confidence: high
scope: Gaia 运行宿主中蓝鲸数字通用图片、附件上传下载能力的 jar 包定位、接口路径、权限和 TOTO 售后接入建议。
belongs_to:
  - kb:project:toto-after-sales-service
sources:
  - E:/workspace/gaia-saas-proj/gaia-saas-web-jar/target/gaia-web.jar
  - E:/workspace/gaia-saas-proj/gaia-saas-web-jar/src/main/resources/application.properties
  - E:/workspace/gaia-saas-proj/gaia-saas-web-jar/src/main/java/com/ehsure/gaia/config/WebConfig.java
  - E:/workspace/gaia-saas-proj/gaia-saas-web-jar/src/main/java/com/ehsure/gaia/config/ShiroConfig.java
tags:
  - llm-wiki
  - 蓝鲸数字
  - TOTO
  - Gaia
  - 附件上传
  - 图片下载
schema_version: 2
id: kb:project:toto-after-sales-gaia-common-upload-download
created: 2026-09-08
sensitivity: internal
---

# Gaia 通用附件上传下载接口调研

更新日期：2026-09-08

调研对象：`E:\workspace\gaia-saas-proj` 构建产物 `gaia-web.jar`

结论状态：已通过 jar 字节码和本地启动路由核验，未执行真实上传，避免写入测试 MinIO 和数据库。

[返回技术架构与技术栈](../00-项目资料/03-技术架构与技术栈.md)

## 1 结论

蓝鲸数字 Gaia 平台已有通用附件、图片上传下载能力，TOTO 售后不应另起一套基础上传下载服务。售后工单图片、视频、签名、导入模板等文件类需求优先复用 `gaia-saas-proj` 宿主中 `gaia-sys-tools-*` 与 `gaia-base-core` 提供的通用能力，再在售后业务表中保存业务关系、阶段、用途和权限。

本地运行宿主是 Spring Boot 可执行 jar，不需要另行配置外部 Tomcat。当前宿主应用 `context-path` 为 `/api`，而通用工具 Controller 自身映射为 `/api/sys/commontools`，因此本地直连完整路径会出现双 `/api`。

## 2 Jar 和类定位

| 层级 | 类或制品 | 作用 |
| --- | --- | --- |
| 运行宿主 | `gaia-saas-web-jar/target/gaia-web.jar` | Spring Boot 可执行 jar，聚合业务和系统组件 |
| Controller | `com.ehsure.gaia.tools.SysCommonToolsApi` | 暴露 `/api/sys/commontools/*` 上传、下载、预览接口 |
| Service | `com.ehsure.gaia.tools.appservice.impl.SysCommonUploadAppServiceImpl` | 校验扩展名、构造上传目录、保存文件记录、返回访问地址 |
| Service 接口 | `com.ehsure.gaia.tools.appservice.SysCommonUploadAppService` | 定义上传、分片上传、图片预览、下载和模板下载方法 |
| 文件处理 | `com.ehsure.gaia.base.fileupload.FileUploadProcessor` | 调用上传解析器和 `UploadClient`，负责上传、下载、读取文件流 |
| 存储分发 | `com.ehsure.gaia.base.fileupload.cloud.UploadClient` | 根据 `file.file-client-type` 从 Spring 容器取对应 `DfsClient` |
| 存储配置 | `com.ehsure.gaia.base.config.DfsConfig` | 注册 COS、OSS、本地、MinIO、Gaia MinIO 客户端 Bean |

`gaia-web.jar` 内确认存在以下依赖：

```text
BOOT-INF/lib/gaia-sys-tools-api-3.0-SNAPSHOT.jar
BOOT-INF/lib/gaia-sys-tools-core-3.0-SNAPSHOT.jar
BOOT-INF/lib/gaia-base-core-3.0-SNAPSHOT.jar
BOOT-INF/lib/dfs-client-3.0-SNAPSHOT.jar
BOOT-INF/lib/dfs-client-minio-3.0-SNAPSHOT.jar
BOOT-INF/lib/dfs-client-oss-3.0-SNAPSHOT.jar
BOOT-INF/lib/dfs-client-cos-3.0-SNAPSHOT.jar
```

## 3 接口清单

Controller 基础映射：`/api/sys/commontools`。本地直连时宿主还有 `server.servlet.context-path=/api`，因此调试完整路径为 `http://127.0.0.1:18080/api/api/sys/commontools/...`。

| 场景 | 方法 | 本地直连路径 | 入参 | 说明 |
| --- | --- | --- | --- | --- |
| 公共上传 | `POST` | `/api/api/sys/commontools/uploadFile` | `multipart/form-data`，字段名 `uploadFile` | 调用 `fileUpload(uploadFile, "public")` |
| 私有上传 | `POST` | `/api/api/sys/commontools/privateUploadFile` | `multipart/form-data`，字段名 `uploadFile` | 调用 `fileUpload(uploadFile, "private")`，记录当前登录用户 |
| 公共图片预览 | `GET` | `/api/api/sys/commontools/picture?id={id}` | `id` 为上传记录 ID | inline 输出图片流 |
| 私有图片预览 | `GET` | `/api/api/sys/commontools/pictureWithAuth?id={id}` | `id` 为上传记录 ID | 校验当前用户是上传人 |
| 公共下载 | `GET` | `/api/api/sys/commontools/downloadFileById?id={id}` | `id` 为上传记录 ID | attachment 输出文件流 |
| 私有下载 | `GET` | `/api/api/sys/commontools/downloadWithAuthFileById?id={id}` | `id` 为上传记录 ID | 校验当前用户是上传人 |
| 分片上传 | `POST` | `/api/api/sys/commontools/uploadBlockFile` | `BlockFileParamDTO`，含 `chunk/currentBlockNum/filename` | 上传大文件分片 |
| 查询已上传分片 | `GET` | `/api/api/sys/commontools/getAlreadyUploadBlockNum?fileRealName={name}` | `fileRealName` | 断点续传辅助 |
| 合并分片 | `GET` | `/api/api/sys/commontools/mergeBlockFile?fileRealName={name}` | `fileRealName` | 合并分片文件 |
| 模板下载 | `GET` | `/api/api/sys/commontools/downloadImportTemplate?templateName={name}&downloadName={name}` | `templateName/downloadName` | 导入模板下载 |

上传成功后，返回 `APIResponse<Map<String,Object>>`，核心 `data` 字段如下：

```json
{
  "fileName": "source.png",
  "fileType": "png",
  "fileSize": 12345,
  "fileSizeUnit": "Byte",
  "access": "/api/sys/commontools/picture?id=10001",
  "download": "/api/sys/commontools/downloadFileById?id=10001"
}
```

公共上传返回：

```text
access   = /api/sys/commontools/picture?id={id}
download = /api/sys/commontools/downloadFileById?id={id}
```

私有上传返回：

```text
access   = /api/sys/commontools/pictureWithAuth?id={id}
download = /api/sys/commontools/downloadWithAuthFileById?id={id}
```

注意：返回地址是业务映射常量，前端或网关需要结合当前部署的 base URL、context path 处理。直接访问本地 Spring Boot jar 时，完整调试路径以双 `/api` 为准。

## 4 权限和上传记录

上传记录保存在系统通用文件记录中，Service 会写入路径、随机文件名、原始文件名、文件类型、大小、创建时间和 `userId`。

| 上传类型 | `userId` 规则 | 访问规则 |
| --- | --- | --- |
| `public` | `-1` | `picture` 和 `downloadFileById` 允许作为公共文件读取 |
| `private` | 当前登录用户 ID | 普通访问会通过 `checkAuthority` 校验所有者；`WithAuth` 接口也要求当前用户与上传记录用户一致 |

`ShiroConfig` 中 `/api/**` 默认走 `authc`，因此这些通用接口在本地直连时需要登录态。无登录访问 `/api/api/sys/commontools/picture?id=1` 已返回 `code=4001`、`errMsg=后端接口-未登录`，说明路由和鉴权链路已命中。

## 5 存储配置

当前 `gaia-saas-proj` 配置使用 MinIO：

```properties
file.file-client-type=minioFileClient
file.minio.bucket-name=file
file.minio.end-point=http://10.1.1.43:9000/
proj.image.attachment.server=https://minio.test.ljsz.xyz:1443/file/
```

仓库配置文件中包含访问凭据，文档和业务代码不得复制、扩散或重新固化这些密钥。运行时应继续从受控配置或环境变量读取。

`DfsConfig` 支持的客户端 Bean 包括：

```text
cosFileClient
ossFileClient
localFileClient
minioFileClient
gaiaMinioFileClient
```

`UploadClient` 根据 `file.file-client-type` 取对应 `DfsClient` Bean，再调用其 `upload`、`getFileInputStream`、`delFile` 等方法。

## 6 文件校验

Service 默认扩展名白名单为：

```text
xls,xlsx,pdf,jpeg,jpg,png,gif,bmp,mp3,mp4,apk,txt,zip,json
```

`png` 会走 `ImgFileUploadConfig`；其他扩展名走 `DefaultUploadConfig`。图片、视频、签名等售后附件接入时，还需要在售后业务层补充用途、阶段、数量、必填项、内容安全、大小和保留策略，不应只依赖通用上传白名单。

宿主 multipart 默认大小限制为：

```text
spring.servlet.multipart.max-file-size    = 150MB
spring.servlet.multipart.max-request-size = 150MB
```

## 7 TOTO 售后接入建议

- 工单附件、完工照片、问题照片、签名、评价附件、导入模板优先复用 `SysCommonToolsApi`。
- 售后业务表建议保存通用上传记录 ID、返回的 `access/download`、业务对象 ID、阶段、用途、上传人、审核状态、哈希或内容安全结果；不要直接依赖 MinIO 对象路径作为业务主键。
- 公共素材或模板可使用 `uploadFile` 或模板下载能力；用户私有、工单私有、签名和隐私相关附件优先使用 `privateUploadFile` 或业务侧二次鉴权。
- 小程序端是否直接调用 `/api/sys/commontools` 需要单独确认会话和网关策略；不能默认存在等价 `/wxapi` 上传接口。
- 前端上传字段名必须为 `uploadFile`，否则 Controller 不会接收到文件。
- 真实上传会写入对象存储和系统上传记录；自动化验证前应准备可清理的测试租户、测试用户、测试桶或本地存储配置。

## 8 已完成核验

| 核验项 | 结果 |
| --- | --- |
| `gaia-saas-web-jar` 构建 | 已生成 `target/gaia-web.jar` |
| 本地 Spring Boot jar 启动 | 已使用 Java 21 在 `18080` 端口启动，应用 context path 为 `/api` |
| 基础页面和通用接口 | `/api/`、验证码、服务时间接口可访问 |
| 通用上传下载 Controller | 已用 `javap` 确认 Controller 路由和方法映射 |
| Service 返回常量 | 已确认公共和私有上传返回不同 `access/download` |
| 无登录路由核验 | `/api/api/sys/commontools/picture?id=1` 返回未登录业务码 |
| 真实上传 | 未执行，原因是会写入测试 MinIO 和数据库 |

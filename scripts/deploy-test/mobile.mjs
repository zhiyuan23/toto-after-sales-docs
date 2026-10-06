import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'
import { snapshot } from '../deploy-test.mjs'

export function uploadEnvironment(local, inherited = process.env) {
  return { ...inherited, ...parseEnv(local), GAIA_APP_ENV: 'test', GAIA_API_BASE_URL: 'http://10.1.1.53:8011', GAIA_EXAMPLES: 'false', COREPACK_ENABLE_NETWORK: '0' }
}

export async function prepareUpload(root) {
  const load = relative => import(pathToFileURL(join(root, relative)))
  const envFile = join(root, '.env.upload.local')
  const env = uploadEnvironment(existsSync(envFile) ? readFileSync(envFile, 'utf8') : '')
  const { resolveTenant, tenantProfiles } = await load('build/tenant/registry.ts')
  const { isConfiguredWechatAppId } = await load('build/tenant/schema.ts')
  const { resolvePrivateKeyPath, parseWechatCiRobot, runWechatUpload } = await load('scripts/wechat-upload.mjs')
  const { loadReleaseVersions, incrementPatchVersion } = await load('scripts/tenant-release-versions.mjs')
  const { loadCi } = await load('tools/wechat-upload/load-ci.mjs')
  const tenant = resolveTenant('TOTO')
  if (!isConfiguredWechatAppId(tenant.wechat.appId)) throw new Error('TOTO 尚未配置真实 AppID')
  await resolvePrivateKeyPath(env.WECHAT_CI_PRIVATE_KEY_PATH)
  const robot = parseWechatCiRobot(env.WECHAT_CI_ROBOT)
  const version = incrementPatchVersion((await loadReleaseVersions({ profiles: tenantProfiles })).TOTO)
  await loadCi() // Only load the installed library; do not construct a project or contact WeChat.
  return { env, tenant, version, robot, runWechatUpload, loadCi }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, version, description, commit, fingerprint] = process.argv.slice(2)
    if (!['check', 'upload'].includes(mode)) throw new Error('小程序辅助入口只支持 check / upload')
    const root = process.cwd()
    const prepared = await prepareUpload(root)
    if (mode === 'check') {
      console.log(JSON.stringify({ appId: prepared.tenant.wechat.appId, version: prepared.version, robot: prepared.robot, environment: 'test' }))
    } else {
      if (!version || !description || !commit || !fingerprint) throw new Error('上传缺少本次发布元数据')
      // Reuse the exact implementation behind pnpm upload, including a fresh build.
      // Guard the sources again after that build, immediately before the CI upload.
      Object.assign(process.env, prepared.env)
      await prepared.runWechatUpload({ tenant: prepared.tenant, version, description, repositoryRoot: root, env: prepared.env }, {
        loadCi: async () => {
          const current = snapshot(root)
          if (current.commit !== commit || current.fingerprint !== fingerprint) throw new Error('小程序构建期间源码已改变，禁止上传')
          return prepared.loadCi()
        },
      })
    }
  } catch (error) {
    console.error('小程序操作失败：' + error.message)
    process.exitCode = 1
  }
}

const NS = 'llm-pi-ai'
const LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']
const API = {
  list: '/api/dsh-model-probe/list',
  detect: '/api/dsh-model-probe/detect',
}
const MAX_JSON_BODY_BYTES = 64 * 1024
// `format` is the openai-completions thinkingFormat (how pi-ai serializes the
// effort on the wire). On openai-responses routes the format is ignored and no
// compat block is written at all — the efforts map rides reasoning.effort.
const FAMILIES = [
  { test: /imagine-video|sora|runway|kling|luma/, input: ['text'], output: ['video'], efforts: false },
  { test: /imagine-image|image-quality|dall-e|flux|imagen/, input: ['text'], output: ['image'], efforts: false },
  { test: /grok-4|grok-3|grok4|grok3/, input: ['text', 'image'], output: ['text'], efforts: ['low', 'medium', 'high', 'xhigh'], format: 'openai' },
  { test: /deepseek-v4|deepseek-r1|reasoner/, input: ['text'], output: ['text'], efforts: ['off', 'low', 'high', 'max'], format: 'deepseek' },
  { test: /glm-5|glm-4/, input: ['text'], output: ['text'], efforts: ['off', 'high', 'max'], format: 'zai' },
  { test: /qwen3\.8|qwen3-8/, input: ['text', 'image'], output: ['text'], efforts: ['off', 'low', 'medium', 'xhigh'], format: 'qwen' },
  { test: /kimi-k2\.7|kimi-k2-7/, input: ['text', 'image'], output: ['text'], efforts: ['high'], format: 'openai' },
  { test: /minimax-m2/, input: ['text'], output: ['text'], efforts: ['off', 'high'], format: 'openai' },
  { test: /seed-2|doubao/, input: ['text', 'image'], output: ['text'], efforts: ['off', 'low', 'medium', 'high'], format: 'openai' },
  { test: /qwen/, input: ['text'], output: ['text'], efforts: ['off', 'low', 'medium', 'high'], format: 'qwen' },
]

const name = 'model-probe'
const inject = ['webServer', 'settings']
const MODEL_PROBE_SETTINGS_NAMESPACE = 'model-probe'

function isPlain(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function ownString(value) {
  return typeof value === 'string' ? value : ''
}

function collectModalities(value) {
  if (!Array.isArray(value)) return []
  const out = []
  for (const item of value) {
    const key = String(item || '').toLowerCase()
    if (key === 'text' || key === 'image' || key === 'audio' || key === 'video') {
      if (out.indexOf(key) < 0) out.push(key)
    }
  }
  return out
}

function persistableInput(modalities) {
  const next = []
  if (!Array.isArray(modalities) || modalities.indexOf('text') >= 0 || modalities.length === 0) next.push('text')
  if (Array.isArray(modalities) && modalities.indexOf('image') >= 0) next.push('image')
  return next
}

function familyOf(id) {
  const text = String(id || '').toLowerCase()
  for (const family of FAMILIES) {
    if (family.test.test(text)) {
      return {
        input: family.input.slice(),
        output: family.output.slice(),
        efforts: family.efforts === false ? false : family.efforts.slice(),
        format: family.format || '',
      }
    }
  }
  return { input: ['text'], output: ['text'], efforts: ['off', 'low', 'medium', 'high'], format: 'openai' }
}

function mergeEfforts(family, catalog) {
  if (family === false) return false
  const seen = {}
  const add = function add(list) {
    if (!Array.isArray(list)) return
    for (const level of list) seen[level] = true
  }
  add(family)
  add(catalog)
  return LEVELS.filter(function keep(level) { return seen[level] })
}

function levelOf(item) {
  if (typeof item === 'string') return item
  if (isPlain(item) && typeof item.value === 'string') return item.value
  return ''
}

function readCatalogRow(row) {
  const flags = { vision: undefined, reasoning: undefined, efforts: undefined, imageOutput: undefined, videoOutput: undefined, contextWindow: undefined, maxTokens: undefined }
  if (!isPlain(row)) return flags
  if (typeof row.supports_vision === 'boolean') flags.vision = row.supports_vision
  if (typeof row.supportsVision === 'boolean') flags.vision = row.supportsVision
  if (isPlain(row.capabilities) && typeof row.capabilities.vision === 'boolean') flags.vision = row.capabilities.vision
  const input = collectModalities(row.input_modalities || (isPlain(row.architecture) ? row.architecture.input_modalities : undefined) || (isPlain(row.capabilities) ? row.capabilities.input_modalities : undefined))
  if (input.indexOf('image') >= 0) flags.vision = true
  else if (input.length > 0) flags.vision = false
  const output = collectModalities(row.output_modalities || (isPlain(row.architecture) ? row.architecture.output_modalities : undefined) || (isPlain(row.capabilities) ? row.capabilities.output_modalities : undefined))
  if (output.indexOf('image') >= 0) flags.imageOutput = true
  if (output.indexOf('video') >= 0) flags.videoOutput = true
  if (typeof row.supports_reasoning === 'boolean') flags.reasoning = row.supports_reasoning
  if (typeof row.supportsReasoning === 'boolean') flags.reasoning = row.supportsReasoning
  if (typeof row.supportsReasoningEffort === 'boolean') flags.reasoning = row.supportsReasoningEffort
  if (Array.isArray(row.reasoningEfforts) && row.reasoningEfforts.length > 0) {
    flags.efforts = row.reasoningEfforts.map(levelOf).filter(Boolean)
    flags.reasoning = true
  }
  if (isPlain(row.responses_capabilities) && row.responses_capabilities.imageGeneration === true) flags.imageOutput = true
  if (typeof row.context_length === 'number') flags.contextWindow = row.context_length
  if (typeof row.max_completion_tokens === 'number') flags.maxTokens = row.max_completion_tokens
  return flags
}

function detectCapabilities(id, row) {
  const family = familyOf(id)
  const catalog = readCatalogRow(row)
  let input = family.input.slice()
  let output = family.output.slice()
  const efforts = mergeEfforts(family.efforts, catalog.efforts)
  const format = family.format || 'openai'
  if (catalog.vision === true) input = persistableInput(input.concat('image'))
  if (catalog.vision === false && output[0] === 'text') input = ['text']
  if (catalog.imageOutput) output = ['image']
  if (catalog.videoOutput) output = ['video']
  return {
    input: persistableInput(input),
    output,
    efforts,
    format: efforts === false ? '' : format,
    contextWindow: catalog.contextWindow,
    maxTokens: catalog.maxTokens,
    source: Array.isArray(catalog.efforts) || catalog.vision !== undefined ? 'catalog+family' : 'family',
  }
}

function toEffortMap(levels) {
  if (levels === false) return false
  const map = {}
  for (const level of levels) {
    if (level === 'off') map.off = null
    else map[level] = level
  }
  return map
}

function cloneEfforts(value) {
  if (value === false) return false
  if (!isPlain(value)) return undefined
  const out = {}
  for (const level of LEVELS) {
    if (!Object.prototype.hasOwnProperty.call(value, level)) continue
    const wire = value[level]
    out[level] = wire === null || wire === undefined ? null : String(wire)
  }
  return out
}

function cloneCompat(value) {
  if (!isPlain(value)) return undefined
  const out = {}
  if (typeof value.thinkingFormat === 'string') out.thinkingFormat = value.thinkingFormat
  if (typeof value.supportsReasoningEffort === 'boolean') out.supportsReasoningEffort = value.supportsReasoningEffort
  return Object.keys(out).length > 0 ? out : undefined
}

function cloneInput(value) {
  if (!Array.isArray(value)) return undefined
  const next = []
  for (const item of value) if (item === 'text' || item === 'image') next.push(item)
  return next.length > 0 ? next : undefined
}

function cloneModel(raw) {
  if (!isPlain(raw) || typeof raw.id !== 'string' || raw.id.length === 0) return null
  const model = { id: raw.id }
  if (typeof raw.name === 'string') model.name = raw.name
  if (typeof raw.contextWindow === 'number') model.contextWindow = raw.contextWindow
  if (typeof raw.maxTokens === 'number') model.maxTokens = raw.maxTokens
  const input = cloneInput(raw.input)
  if (input !== undefined) model.input = input
  const efforts = cloneEfforts(raw.reasoningEfforts)
  if (efforts !== undefined) model.reasoningEfforts = efforts
  const compat = cloneCompat(raw.compat)
  if (compat !== undefined) model.compat = compat
  return model
}

function snapshot(settings) {
  const descriptors = settings.describe()
  let revision = 0
  let providers = {}
  for (const descriptor of descriptors) {
    if (descriptor.ns !== NS) continue
    revision = descriptor.revision
    if (isPlain(descriptor.value) && isPlain(descriptor.value.providers)) providers = descriptor.value.providers
  }
  const routes = {}
  for (const id of Object.keys(providers)) {
    const raw = providers[id]
    if (!isPlain(raw)) continue
    routes[id] = {
      id,
      displayName: ownString(raw.displayName) || id,
      api: ownString(raw.api),
      baseURL: ownString(raw.baseURL),
      apiKeyEnv: ownString(raw.apiKeyEnv),
      models: Array.isArray(raw.models) ? raw.models.map(cloneModel).filter(Boolean) : [],
    }
  }
  return { revision, routes }
}

function effortLabel(efforts) {
  if (efforts === false) return 'none'
  if (!isPlain(efforts)) return 'unset'
  const keys = LEVELS.filter(function has(level) { return Object.prototype.hasOwnProperty.call(efforts, level) })
  return keys.length === 0 ? 'unset' : keys.join(', ')
}

function inputLabel(input) {
  return Array.isArray(input) && input.length > 0 ? input.join(', ') : 'unset'
}

/** Routes without an explicit api default to chat completions in llm-pi-ai. */
function isCompletionsApi(api) {
  return api === '' || api === 'openai-completions'
}

function applyDetection(model, detection, api) {
  const next = { id: model.id }
  if (typeof model.name === 'string') next.name = model.name
  if (typeof detection.contextWindow === 'number') next.contextWindow = detection.contextWindow
  else if (typeof model.contextWindow === 'number') next.contextWindow = model.contextWindow
  if (typeof detection.maxTokens === 'number') next.maxTokens = detection.maxTokens
  else if (typeof model.maxTokens === 'number') next.maxTokens = model.maxTokens
  next.input = Array.isArray(detection.input) ? detection.input.slice() : (Array.isArray(model.input) ? model.input.slice() : ['text'])
  if (detection.reasoningEfforts !== undefined) next.reasoningEfforts = detection.reasoningEfforts
  else if (model.reasoningEfforts !== undefined) next.reasoningEfforts = model.reasoningEfforts
  if (isCompletionsApi(api)) {
    // Chat-completions (messages) protocol: the effort reaches the wire through
    // the compat switches (reasoning_effort / enable_thinking / thinking …,
    // depending on thinkingFormat).
    if (detection.format) next.compat = { thinkingFormat: detection.format, supportsReasoningEffort: true }
    else if (model.compat !== undefined) next.compat = model.compat
  }
  // Responses (and any other) protocol: deliberately no compat block. llm-pi-ai
  // rejects thinkingFormat/supportsReasoningEffort outside openai-completions;
  // there the efforts map itself rides reasoning.effort verbatim.
  return next
}

function parseCatalog(text) {
  const map = {}
  try {
    const json = JSON.parse(String(text || '').replace(/^\uFEFF/, ''))
    const rows = Array.isArray(json && json.data) ? json.data : []
    for (const row of rows) if (row && typeof row.id === 'string') map[row.id] = row
  } catch {
    // ignore malformed catalogs
  }
  return map
}

function joinUrl(baseURL, path) {
  return String(baseURL || '').replace(/\/$/, '') + path
}

function outputKey(provider, model) {
  return provider + '/' + model
}

function isLoopbackRequest(request) {
  const address = request.socket.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = request.headers.host
  if (typeof host !== 'string') return false
  let hostUrl
  try {
    hostUrl = new URL(`http://${host}`)
  } catch {
    return false
  }
  if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]') return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

function writeJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'referrer-policy': 'no-referrer',
  })
  res.end(payload)
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk
    size += buffer.length
    if (size > MAX_JSON_BODY_BYTES) return undefined
    chunks.push(buffer)
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined
  } catch {
    return undefined
  }
}

async function workDir(ctx) {
  const settings = ctx.get('settings')
  const fs = ctx.get('fs')
  if (settings === undefined || fs === undefined) return undefined
  const doc = await settings.prepareDocument()
  if (typeof doc !== 'string' || doc.length === 0) return undefined
  const abs = fs.processPath(await fs.resolve(doc))
  const slash = Math.max(abs.lastIndexOf('\\'), abs.lastIndexOf('/'))
  return slash > 0 ? abs.slice(0, slash) : abs
}

async function curlJson(ctx, cwd, method, url, apiKey, body) {
  const subprocess = ctx.get('subprocess')
  if (subprocess === undefined) return { ok: false, status: 0, text: '', body: '' }
  const argv = [await subprocess.resolveExecutable('curl'), '--silent', '--show-error', '--max-time', '20', '-X', method, url, '-H', 'Authorization: Bearer ' + apiKey, '-w', '\n__HTTP__:%{http_code}']
  if (body !== undefined) {
    // spawn takes an argv array (no shell), so the JSON body can ride as one
    // argument — no temp file to clean up afterwards.
    argv.push('-H', 'Content-Type: application/json', '--data-binary', JSON.stringify(body))
  }
  const handle = subprocess.spawn({
    argv,
    cwd,
    stdio: { stdin: 'ignore', stdout: { maxBytes: 240000 }, stderr: { maxBytes: 16000 } },
    graceMs: 3000,
  })
  const outcome = await handle.done
  const stdout = handle.collected.stdout ? handle.collected.stdout.readFrom(0).text : ''
  const marker = '\n__HTTP__:'
  const at = stdout.lastIndexOf(marker)
  const status = at >= 0 ? Number(stdout.slice(at + marker.length).trim()) : 0
  const bodyText = at >= 0 ? stdout.slice(0, at) : stdout
  return { ok: outcome.exitCode === 0 && status >= 200 && status < 300, status, text: bodyText.toLowerCase(), body: bodyText }
}

async function resolveKey(ctx, apiKeyEnv) {
  const credentials = ctx.get('credentials')
  if (credentials === undefined || apiKeyEnv.length === 0) return undefined
  const resolved = await credentials.resolve(apiKeyEnv)
  return resolved && typeof resolved.value === 'string' && resolved.value.length > 0 ? resolved.value : undefined
}

function listPayload(settings, state) {
  if (settings === undefined) {
    return { ok: false, error: 'settings unavailable', providers: [], running: state.running, log: state.log.slice(-40), last: state.last }
  }
  const current = snapshot(settings)
  return {
    ok: true,
    error: '',
    writable: settings.writable === true,
    running: state.running,
    mode: state.mode,
    log: state.log.slice(-60),
    last: state.last,
    providers: Object.keys(current.routes).map(function mapRoute(id) {
      const route = current.routes[id]
      return {
        id: route.id,
        displayName: route.displayName,
        api: route.api || 'openai-completions',
        models: route.models.map(function mapModel(model) {
          const guessed = familyOf(model.id)
          return {
            id: model.id,
            name: ownString(model.name),
            efforts: effortLabel(model.reasoningEfforts),
            format: model.compat && model.compat.thinkingFormat ? model.compat.thinkingFormat : '',
            configured: model.reasoningEfforts !== undefined,
            input: inputLabel(model.input),
            inputConfigured: Array.isArray(model.input),
            output: state.outputs[outputKey(route.id, model.id)] || guessed.output.join(', '),
          }
        }),
      }
    }),
  }
}

async function runDetect(ctx, settings, state, args) {
  if (settings === undefined) return { ok: false, error: 'settings unavailable' }
  if (settings.writable !== true) return { ok: false, error: 'settings are read-only' }
  if (state.running) return { ok: false, error: 'detection already running' }
  const mode = args && args.mode === 'probe' ? 'probe' : 'heuristic'
  const overwrite = !!(args && args.overwrite)
  state.running = true
  state.mode = mode
  state.error = ''
  state.log = ['start ' + mode + (overwrite ? ' overwrite' : ' fill-missing')]
  try {
    const current = snapshot(settings)
    const cwd = mode === 'probe' ? await workDir(ctx) : undefined
    if (mode === 'probe' && cwd === undefined) {
      state.running = false
      return { ok: false, error: 'cannot resolve a working directory for probing' }
    }
    const ops = []
    const changed = []
    const skipped = []
    for (const id of Object.keys(current.routes)) {
      const route = current.routes[id]
      if (route.models.length === 0) {
        skipped.push(id + ': no explicit model list')
        continue
      }
      const api = ownString(route.api)
      const completions = isCompletionsApi(api)
      let catalog = {}
      if (mode === 'probe') {
        const apiKey = await resolveKey(ctx, route.apiKeyEnv)
        if (apiKey === undefined) state.log.push(id + ': no API key, using family table')
        else {
          const listed = await curlJson(ctx, cwd, 'GET', joinUrl(route.baseURL, '/models'), apiKey)
          if (listed.ok) {
            catalog = parseCatalog(listed.body)
            state.log.push(id + ': catalog ' + String(Object.keys(catalog).length) + ' models')
          } else state.log.push(id + ': /models HTTP ' + String(listed.status) + ', using family table')
        }
      }
      const nextModels = []
      let dirty = false
      for (const model of route.models) {
        const needReasoning = overwrite || model.reasoningEfforts === undefined
        const needInput = overwrite || !Array.isArray(model.input)
        const detected = detectCapabilities(model.id, catalog[model.id])
        if (!needReasoning && !needInput && typeof model.contextWindow === 'number' && typeof model.maxTokens === 'number') {
          let kept = model
          if (!completions && model.compat !== undefined) {
            // Older probe versions wrote compat switches onto responses routes,
            // which llm-pi-ai now rejects; scrub them even in fill-missing mode.
            kept = { ...model }
            delete kept.compat
            dirty = true
          }
          skipped.push(route.id + '/' + model.id + ' already configured')
          nextModels.push(kept)
          state.outputs[outputKey(route.id, model.id)] = detected.output.join(', ')
          continue
        }
        const payload = {
          input: needInput ? detected.input : (model.input || detected.input),
          output: detected.output,
          reasoningEfforts: needReasoning ? toEffortMap(detected.efforts) : model.reasoningEfforts,
          format: needReasoning ? detected.format : (model.compat && model.compat.thinkingFormat),
          contextWindow: detected.contextWindow,
          maxTokens: detected.maxTokens,
        }
        const applied = applyDetection(model, payload, api)
        nextModels.push(applied)
        dirty = true
        state.outputs[outputKey(route.id, model.id)] = detected.output.join(', ')
        changed.push({
          provider: route.id,
          model: model.id,
          efforts: effortLabel(applied.reasoningEfforts),
          input: inputLabel(applied.input),
          output: detected.output.join(', '),
          format: applied.compat && applied.compat.thinkingFormat ? applied.compat.thinkingFormat : '',
          source: detected.source,
        })
        state.log.push(route.id + '/' + model.id + ' → ' + effortLabel(applied.reasoningEfforts) + ' · in ' + inputLabel(applied.input) + ' · out ' + detected.output.join(', ') + ' · ' + (completions ? 'messages' + (applied.compat && applied.compat.thinkingFormat ? '/' + applied.compat.thinkingFormat : '') : 'responses'))
      }
      if (dirty) ops.push({ op: 'set', path: ['providers', route.id, 'models'], value: nextModels })
    }
    if (ops.length === 0) {
      state.last = { changed, skipped, wrote: false }
      state.log.push('nothing to write')
      state.running = false
      return { ok: true, wrote: false, changed, skipped }
    }
    await settings.mutate(NS, ops, current.revision)
    const defaults = settings.get('agent-default-model')
    if (isPlain(defaults) && typeof defaults.provider === 'string' && typeof defaults.model === 'string') {
      const route = snapshot(settings).routes[defaults.provider]
      const model = route && route.models.find(function find(item) { return item.id === defaults.model })
      const allowed = model && isPlain(model.reasoningEfforts) ? Object.keys(model.reasoningEfforts) : []
      if (allowed.length > 0 && allowed.indexOf(defaults.reasoningEffort) < 0) {
        const next = allowed.indexOf('xhigh') >= 0 ? 'xhigh' : (allowed.indexOf('high') >= 0 ? 'high' : allowed.filter(function notOff(level) { return level !== 'off' })[0] || allowed[0])
        await settings.mutate('agent-default-model', [{ op: 'set', path: ['reasoningEffort'], value: next }])
        state.log.push('default effort ' + String(defaults.reasoningEffort) + ' → ' + next)
      }
    }
    state.last = { changed, skipped, wrote: true }
    state.log.push('wrote ' + String(changed.length) + ' model(s)')
    state.running = false
    return { ok: true, wrote: true, changed, skipped }
  } catch (error) {
    const message = error && error.message ? String(error.message) : String(error)
    state.error = message
    state.log.push('error: ' + message)
    state.running = false
    return { ok: false, error: message }
  }
}

function apply(ctx, config = {}) {
  const state = { running: false, mode: '', log: [], error: '', last: null, outputs: {} }
  const enabled = config.enabled !== false
  if (!enabled) return

  ctx.effect(() => {
    const settings = ctx.get('settings')
    const routes = [
      {
        kind: 'exact',
        path: API.list,
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) {
            writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
            return
          }
          if (req.method !== 'GET' && req.method !== 'POST') {
            writeJson(res, 405, { ok: false, error: `method not allowed: ${req.method}` })
            return
          }
          writeJson(res, 200, listPayload(settings, state))
        },
      },
      {
        kind: 'exact',
        path: API.detect,
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) {
            writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' })
            return
          }
          if (req.method !== 'POST') {
            writeJson(res, 405, { ok: false, error: `method not allowed: ${req.method}` })
            return
          }
          const body = await readJsonBody(req)
          writeJson(res, 200, await runDetect(ctx, settings, state, body || {}))
        },
      },
    ]
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers) dispose()
    }
  }, 'dsh-model-probe: routes')
}

export { MODEL_PROBE_SETTINGS_NAMESPACE, apply, inject, name }

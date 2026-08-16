window.__ModuleLoader__.load({
  id: 'dsh-model-probe',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    var react = require('react')
    var React = react

    var CSS = [
      '.mpb-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}',
      '.mpb-card:hover{border-color:var(--dsw-alias-label-dimmed)}',
      '.mpb-cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}',
      '.mpb-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}',
      '.mpb-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}',
      '.mpb-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}',
      '.mpb-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}',
      '.mpb-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}',
      '.mpb-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}',
      '.mpb-chevronOpen{transform:rotate(180deg)}',
      '.mpb-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}',
      '.mpb-hint{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}',
      '.mpb-readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}',
      '.mpb-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}',
      '.mpb-field+.mpb-field{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.mpb-check{display:flex;align-items:flex-start;gap:8px;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;cursor:pointer}',
      '.mpb-check input{margin:3px 0 0;flex:none}',
      '.mpb-check[data-disabled]{color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.mpb-status{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      '.mpb-ok{color:var(--dsw-alias-state-success-primary)}',
      '.mpb-err{color:var(--dsw-alias-label-error)}',
      '.mpb-empty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}',
      '.mpb-group{padding:12px 0;display:flex;flex-direction:column;gap:8px}',
      '.mpb-group+.mpb-group{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.mpb-groupName{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;display:flex;align-items:center;gap:8px}',
      '.mpb-proto{color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:400;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;padding:0 8px;line-height:1.6;flex:none}',
      '.mpb-table{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.mpb-table th,.mpb-table td{padding:6px 8px 6px 0;text-align:left;vertical-align:top;font-size:12px;line-height:1.5;overflow:hidden;text-overflow:ellipsis}',
      '.mpb-table th{color:var(--dsw-alias-label-tertiary);font-weight:500}',
      '.mpb-table td{color:var(--dsw-alias-label-secondary)}',
      '.mpb-table td:first-child{color:var(--dsw-alias-label-primary);font-weight:500}',
      '.mpb-col-model{width:34%}',
      '.mpb-col-efforts{width:28%}',
      '.mpb-col-in{width:19%}',
      '.mpb-col-out{width:19%}',
      '.mpb-log{margin:0;max-height:160px;overflow:auto;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:1.5;white-space:pre-wrap}',
      '.mpb-footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex;flex-wrap:wrap}',
      '.mpb-footer .mpb-status{flex:1;min-width:0}',
      '.mpb-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}',
      '.mpb-btn[disabled]{opacity:.55;cursor:default}',
      '.mpb-secondary{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}',
      '.mpb-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}',
    ].join('')

    var tagId = 'dsh-model-probe/card.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      var tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-model-probe'
      tag.dataset.pluginCss = tagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    var API = {
      list: '/api/dsh-model-probe/list',
      detect: '/api/dsh-model-probe/detect',
    }

    var zh = {
      title: '模型能力探测',
      description: '探测自定义模型的推理档位和输入输出模态，并写回模型配置。',
      intro: '先读网关 /models 返回的能力字段，再和内置的模型家族表合并取并集。按提供方协议适配（胶囊标签即模型设置里的 api）：openai-responses 写 reasoning.effort 映射；openai-completions（chat completions，即 chatcc）写 thinkingFormat 兼容开关。',
      heuristic: '按家族表写入',
      probe: '拉取目录后写入',
      overwrite: '覆盖已有配置',
      overwriteHint: '默认只补空缺字段。勾选后会覆盖已经写过的推理档位和输入模态。',
      running: '正在探测…',
      empty: '还没有自定义提供方模型列表。',
      unset: '未配置',
      none: '不推理',
      expand: '展开设置',
      collapse: '收起设置',
      readOnly: '当前部署的设置只读。',
      updated: '已更新 {count} 个模型',
      colModel: '模型',
      colEfforts: '推理档位',
      colInput: '输入',
      colOutput: '输出',
    }
    var en = {
      title: 'Model capability probe',
      description: 'Detect reasoning-effort levels and input/output modalities for custom models, then write them back.',
      intro: 'Reads capability fields from the gateway /models list and merges them with the built-in family table (union). Adapts to the provider protocol (the pill shows the api exactly as in the Models settings): openai-responses routes get a reasoning.effort map; openai-completions (chat completions, "chatcc") routes get thinkingFormat compat switches.',
      heuristic: 'Write from family table',
      probe: 'Fetch catalog then write',
      overwrite: 'Overwrite existing values',
      overwriteHint: 'By default only missing fields are filled. Turn this on to replace stored effort levels and input modalities.',
      running: 'Probing…',
      empty: 'No custom provider model lists yet.',
      unset: 'unset',
      none: 'none',
      expand: 'Show settings',
      collapse: 'Hide settings',
      readOnly: 'This deployment stores settings read-only.',
      updated: 'Updated {count} models',
      colModel: 'Model',
      colEfforts: 'Efforts',
      colInput: 'Input',
      colOutput: 'Output',
    }

    function copyOf(t) {
      if (typeof t !== 'function') return zh
      return {
        title: t('title'),
        description: t('description'),
        intro: t('intro'),
        heuristic: t('heuristic'),
        probe: t('probe'),
        overwrite: t('overwrite'),
        overwriteHint: t('overwriteHint'),
        running: t('running'),
        empty: t('empty'),
        unset: t('unset'),
        none: t('none'),
        expand: t('expand'),
        collapse: t('collapse'),
        readOnly: t('readOnly'),
        updated: t('updated'),
        colModel: t('colModel'),
        colEfforts: t('colEfforts'),
        colInput: t('colInput'),
        colOutput: t('colOutput'),
      }
    }

    async function postJson(url, body) {
      var response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? '{}' : JSON.stringify(body),
      })
      if (!response.ok) throw new Error('HTTP ' + response.status)
      return response.json()
    }

    function Chevron(open) {
      return React.createElement('svg', {
        width: '14',
        height: '14',
        viewBox: '0 0 14 14',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        className: open ? 'mpb-chevron mpb-chevronOpen' : 'mpb-chevron',
      }, React.createElement('path', {
        d: 'M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z',
        fill: 'currentColor',
      }))
    }

    function formatUpdated(template, count) {
      return String(template || '').replace('{count}', String(count))
    }

    function ModelProbeCard(props) {
      var text = copyOf(props.t)
      var openState = React.useState(false)
      var open = openState[0]
      var setOpen = openState[1]
      var dataState = React.useState({ providers: [], running: false, log: [], last: null, error: '', writable: true })
      var data = dataState[0]
      var setData = dataState[1]
      var overwriteState = React.useState(false)
      var overwrite = overwriteState[0]
      var setOverwrite = overwriteState[1]
      var busyState = React.useState(false)
      var busy = busyState[0]
      var setBusy = busyState[1]
      var messageState = React.useState('')
      var message = messageState[0]
      var setMessage = messageState[1]
      var failedState = React.useState(false)
      var failed = failedState[0]
      var setFailed = failedState[1]

      React.useEffect(function setup() {
        var alive = true
        var pull = function pull() {
          postJson(API.list, {}).then(function onList(next) {
            if (!alive || !next) return
            setData({
              providers: Array.isArray(next.providers) ? next.providers : [],
              running: next.running === true,
              log: Array.isArray(next.log) ? next.log : [],
              last: next.last || null,
              error: typeof next.error === 'string' ? next.error : '',
              writable: next.writable !== false,
            })
          }).catch(function onFail() {})
        }
        pull()
        var timer = setInterval(pull, 1200)
        return function dispose() {
          alive = false
          clearInterval(timer)
        }
      }, [])

      var run = function run(mode) {
        setBusy(true)
        setMessage('')
        setFailed(false)
        postJson(API.detect, { mode: mode, overwrite: overwrite }).then(function onDone(result) {
          setBusy(false)
          if (!result || result.ok !== true) {
            setFailed(true)
            setMessage((result && result.error) || 'failed')
            return
          }
          setMessage(formatUpdated(text.updated, Array.isArray(result.changed) ? result.changed.length : 0))
        }, function onFail(error) {
          setBusy(false)
          setFailed(true)
          setMessage(error && error.message ? String(error.message) : String(error))
        })
      }

      var disabled = busy || data.running || data.writable === false
      return React.createElement('li', { className: open ? 'mpb-card mpb-cardOpen' : 'mpb-card' },
        React.createElement('button', {
          type: 'button',
          className: 'mpb-header',
          'aria-expanded': open,
          'aria-label': (open ? text.collapse : text.expand) + ': ' + text.title,
          onClick: function onToggle() { setOpen(!open) },
        },
          React.createElement('span', { className: 'mpb-headText' },
            React.createElement('span', { className: 'mpb-name' }, text.title),
            React.createElement('span', { className: 'mpb-description' }, text.description),
          ),
          Chevron(open),
        ),
        open ? React.createElement('div', { className: 'mpb-body' },
          data.writable === false ? React.createElement('p', { className: 'mpb-readOnly', role: 'status' }, text.readOnly) : null,
          React.createElement('p', { className: 'mpb-hint' }, text.intro),
          React.createElement('div', { className: 'mpb-field' },
            React.createElement('label', { className: 'mpb-check', 'data-disabled': disabled ? '' : undefined },
              React.createElement('input', {
                type: 'checkbox',
                checked: overwrite,
                disabled: disabled,
                onChange: function onToggle(event) { setOverwrite(!!event.target.checked) },
              }),
              text.overwrite,
            ),
            React.createElement('p', { className: 'mpb-hint' }, text.overwriteHint),
          ),
          data.providers.length === 0
            ? React.createElement('p', { className: 'mpb-empty' }, text.empty)
            : data.providers.map(function renderProvider(provider) {
              return React.createElement('section', { key: provider.id, className: 'mpb-group' },
                React.createElement('div', { className: 'mpb-groupName' },
                  React.createElement('span', null, provider.displayName || provider.id),
                  React.createElement('span', { className: 'mpb-proto' }, provider.api || 'openai-completions'),
                ),
                React.createElement('table', { className: 'mpb-table' },
                  React.createElement('thead', null,
                    React.createElement('tr', null,
                      React.createElement('th', { className: 'mpb-col-model' }, text.colModel),
                      React.createElement('th', { className: 'mpb-col-efforts' }, text.colEfforts),
                      React.createElement('th', { className: 'mpb-col-in' }, text.colInput),
                      React.createElement('th', { className: 'mpb-col-out' }, text.colOutput),
                    ),
                  ),
                  React.createElement('tbody', null,
                    (provider.models || []).map(function renderModel(model) {
                      var efforts = model.configured ? (model.efforts === 'none' ? text.none : model.efforts) : text.unset
                      var input = model.inputConfigured ? model.input : text.unset
                      return React.createElement('tr', { key: model.id },
                        React.createElement('td', { className: 'mpb-col-model', title: model.name ? model.name + ' · ' + model.id : model.id }, model.name || model.id),
                        React.createElement('td', { className: 'mpb-col-efforts', title: efforts }, efforts),
                        React.createElement('td', { className: 'mpb-col-in', title: input }, input),
                        React.createElement('td', { className: 'mpb-col-out', title: model.output || text.unset }, model.output || text.unset),
                      )
                    }),
                  ),
                ),
              )
            }),
          data.log && data.log.length > 0 ? React.createElement('pre', { className: 'mpb-log' }, data.log.join('\n')) : null,
          React.createElement('div', { className: 'mpb-footer' },
            message || data.error
              ? React.createElement('p', { className: failed || data.error ? 'mpb-status mpb-err' : 'mpb-status mpb-ok', role: 'status' }, data.error || message)
              : React.createElement('span', { className: 'mpb-status' }),
            React.createElement('button', {
              type: 'button',
              className: 'mpb-btn mpb-secondary',
              disabled: disabled,
              onClick: function onHeuristic() { run('heuristic') },
            }, data.running || busy ? text.running : text.heuristic),
            React.createElement('button', {
              type: 'button',
              className: 'mpb-btn mpb-primary',
              disabled: disabled,
              onClick: function onProbe() { run('probe') },
            }, text.probe),
          ),
        ) : null,
      )
    }

    var NS = 'model-probe'
    var inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.effect(function registerLocale() {
        return ctx.locale.register(NS, { zh: zh, en: en })
      }, 'dsh-model-probe: dictionaries')
      ctx.slots.inject('settings.plugin.item', function injectCard() {
        return ctx.slots.register({
          name: 'settings.plugin.item',
          id: 'model-probe',
          order: 30,
          locale: NS,
          inject: function inject() { return {} },
        }, ModelProbeCard)
      })
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})

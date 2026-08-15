# dsh-model-probe

English | [中文](README.zh.md)

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) **Web profile plugin** that fills in reasoning-effort levels and input/output modalities for custom models, then writes them back into the `llm-pi-ai` settings that the model selectors read.

The official Models settings page only stores a model's id, name, and capacity. Selectors then have nothing to show for reasoning effort, and vision models are never offered image input. This plugin closes that gap: it reads the provider gateway's `/models` catalog, merges it with a built-in model-family table, and writes the result into each model's stored configuration.

## What it writes

For every model in every custom provider's explicit model list:

| Field | Meaning |
|---|---|
| `reasoningEfforts` | The effort levels the model accepts (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`). `false` marks a non-reasoning model. |
| `input` | `["text"]`, plus `"image"` when the catalog or the family table says the model sees images. |
| `compat.thinkingFormat` + `compat.supportsReasoningEffort` | Set when the model reasons, so the effort reaches the wire in the right format. |
| `contextWindow` / `maxTokens` | Copied from the catalog when it reports them. |

Output modalities (text / image / video) are **displayed on the card only** — DSH has no persistable field for them.

Detection prefers catalog fields (`supports_vision` / `supportsVision`, `supports_reasoning` / `supportsReasoning`, `reasoningEfforts`, `input_modalities` / `output_modalities`, `architecture.*`, `capabilities.*`). Whatever the catalog does not say is filled from the family table, and the two effort lists are **merged as a union**, so a thin catalog can never drop a level the family table already knows.

## Requirements

- DSH with the **web** profile (desktop app or `dsh web`).
- At least one custom provider with an **explicit model list** in the Models settings.
- For *Fetch catalog then write* only: the provider's `apiKeyEnv` must resolve to a real key, and `curl` must be on `PATH` (Windows 10+ ships it).
- `pnpm` if you install through the `dsh plugin` command.

## Install

One-liner from the GitHub repo:

```sh
dsh plugin --profile web add github:Jiayz00/dsh-model-probe
```

Or from a clone (also the right choice when you want to edit the plugin):

```sh
git clone https://github.com/Jiayz00/dsh-model-probe.git
cd dsh-model-probe
dsh plugin --profile web add link:.
```

`link:` keeps the profile pointed at your checkout, so edits apply after a restart. Relative path specs are anchored to your current directory by the CLI; on Windows an absolute path works too:

```sh
dsh plugin --profile web add link:D:\path\to\dsh-model-probe
```

The command forwards to pnpm inside the profile directory and appends the package to the profile's bundle stack automatically (the package declares `dsh.bundle.patch`). No build step is needed — the plugin is plain JavaScript.

**Restart DSH afterwards** (quit and reopen the desktop app, or restart `dsh web`). Then open **Settings → Plugin configuration**. *Model capability probe* (模型能力探测) is its own card, next to Shell / Agent loop / Web search — not inside the Web UI plugins group.

### Uninstall

```sh
dsh plugin --profile web remove dsh-model-probe
```

then restart. Values the plugin already wrote stay in your settings.

## Usage

Open the card in **Settings → Plugin configuration** and expand it.

The card lists every custom provider that has an explicit model list, one table per provider, with four columns:

| Column | Shows |
|---|---|
| Model | The model's display name / id. |
| Efforts | Stored effort levels (`off, low, high, max`, …), `none` for non-reasoning models, `unset` when nothing is stored yet. |
| Input | Stored input modalities (`text`, `text, image`), `unset` when absent. |
| Output | Detected output modality (display-only). |

Below the tables are the controls:

- **Write from family table** — no network access. Every model is matched against the built-in family table and the missing fields are written.
- **Fetch catalog then write** — calls each provider's `GET /models` with that provider's own credentials, merges the catalog's capability fields with the family table, and writes the union.
- **Overwrite existing values** (checkbox) — by default both buttons only *fill missing* fields and leave anything you configured by hand untouched. Tick this to replace stored efforts and input modalities with the detected ones.

While a run is in progress the buttons show *Probing…* and disable. When it finishes, the status line reports how many models were updated, and the log box shows one line per model (`provider/model → efforts · in … · out …`) plus per-provider notes such as *no API key, using family table*.

After writing, the plugin also checks the global default model: if its stored reasoning effort is no longer among the model's allowed levels, the effort is moved to the closest sensible level (`xhigh`, else `high`, else the first non-`off` level).

The card refreshes its table every ~1.2 s, so values written by a run appear in the columns shortly after.

## Configuration

| Key | Type | Default | Meaning |
|---|---|---|---|
| `enabled` | `boolean` | `true` | When `false`, the HTTP routes are not registered and the card has no backend. |

Overlay example (profile `cordis.patch.yml`):

```yaml
- insert:
    - id: model-probe
      name: dsh-model-probe
      config:
        enabled: true
```

## Family table

The built-in table matches model ids by regular expression (order matters, first match wins) and supplies input/output modalities, effort levels, and the thinking format for common families — DeepSeek, Grok, Qwen, GLM, Kimi, MiniMax, Doubao/Seed, and image/video generators. An id that matches nothing falls back to `text` in, `text` out, and `off / low / medium / high`. Catalog data always refines the table; see *What it writes*.

## Limits & security

- Only `text` and `image` can be stored as input; audio is ignored.
- Output modalities are display-only.
- The two HTTP routes (`/api/dsh-model-probe/list`, `/api/dsh-model-probe/detect`) accept **loopback requests only** (127.0.0.1/::1 with a matching Host header).
- *Fetch catalog then write* uses the provider's real credentials and spends real requests (one `GET /models` per provider).
- Writes go through the DSH settings service with an optimistic revision check; a read-only deployment reports *settings are read-only* and nothing is written.
- The plugin deliberately imports **no** `@deepseek-ai/*` host packages: they resolve from the desktop install, not from a linked checkout, and a failed import would take down the whole plugin tree. Everything runs over runtime services (`webServer`, `settings`, `subprocess`, `credentials`).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Card shows *settings unavailable* | The card queried before the settings service was up. It recovers on the next refresh; if it persists, restart DSH (the plugin declares `inject: ['webServer', 'settings']`, so a correct install waits for both). |
| *This deployment stores settings read-only* | The settings backend is read-only; detection can run but cannot write. |
| Empty list | No custom provider has an explicit model list; add models in Settings → Models first. |
| Log says *no API key, using family table* | The provider's `apiKeyEnv` did not resolve; the run fell back to the family table for that provider. |
| Log says */models HTTP 4xx* | The gateway rejected the catalog request; the family table was used instead. |
| Nothing changes after install | DSH was not restarted; plugin bundles load at boot. |

## License

Apache-2.0

# dsh-model-probe

[English](README.md) | 中文

[DeepSeek Harness (DSH)](https://github.com/deepseek-ai) **Web profile 插件**：给自定义模型补上推理档位和输入/输出模态，并写回模型选择器读取的 `llm-pi-ai` 设置。

官方「模型」设置页只保存模型的 id、名称和容量，选择器里因此看不到推理档位，视觉模型也不会被提供图片输入。这个插件读取提供方网关的 `/models` 目录，与内置模型家族表合并，把结果写进每个模型的已存配置。

## 会写什么

对每个自定义提供方「明确模型列表」里的所有模型：

| 字段 | 含义 |
|---|---|
| `reasoningEfforts` | 「档位 → wire 值」映射（档位为 `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`；`off` 的 wire 值留空），未列出的档位视为不支持；`false` 表示不推理。 |
| `input` | `["text"]`；目录或家族表标明支持视觉时加上 `"image"`。 |
| `compat.thinkingFormat` + `compat.supportsReasoningEffort` | **只在 `openai-completions`（messages）路由写入**——见「协议适配」。 |
| `contextWindow` / `maxTokens` | 目录带了就抄过来。 |

输出模态（文本 / 图片 / 视频）**只在卡片上展示**——DSH 没有对应的持久化字段。

探测优先使用目录字段（`supports_vision` / `supportsVision`、`supports_reasoning` / `supportsReasoning`、`reasoningEfforts`、`input_modalities` / `output_modalities`、`architecture.*`、`capabilities.*`）。目录没说的部分由家族表补齐；两边的档位列表**取并集**，目录少列的档位不会把家族表里已有的冲掉。

## 协议适配

两种 OpenAI 系 wire 协议序列化推理档位的方式不同，探测按各自期望的形状写入。协议取自模型设置里路由的 `api`；没填的路由默认 `openai-completions`。

- **`openai-responses`（responses）**——只写 `reasoningEfforts` 映射。pi-ai 把每个档位的 wire 值原样发成 `reasoning.effort`（关闭思考时发 `none`）。**不写 `compat` 块**；旧版探测留在里面的推理开关会在下一次运行时被清掉——llm-pi-ai 在 `openai-completions` 之外的协议上拒绝 `thinkingFormat` / `supportsReasoningEffort`。
- **`openai-completions`**（chat completions，即 chatcc）——同样写映射，另写 `compat.thinkingFormat`（家族表给出：DeepSeek → `deepseek`，Qwen → `qwen`，GLM → `zai`，其余 → `openai`）和 `compat.supportsReasoningEffort: true`。按格式不同，档位最终以 `reasoning_effort`、`enable_thinking`、`thinking`、`reasoning.effort` 等形态上线。

卡片在每个提供方名字旁用胶囊标签标出协议 id（与模型设置里 api 下拉框的值完全一致，如 `openai-completions` / `openai-responses`）；运行日志每行末尾也会写明写入的协议/格式。

## 环境要求

- 带 **web** profile 的 DSH（桌面应用或 `dsh web`）。
- 至少一个自定义提供方，且在模型设置里有**明确的模型列表**。
- 仅「拉取目录后写入」需要：提供方的 `apiKeyEnv` 能解析出真实密钥，且 `curl` 在 `PATH` 里（Windows 10+ 自带）。
- 通过 `dsh plugin` 安装时需要 `pnpm`。

## 安装

一行命令，直接从 GitHub 装：

```sh
dsh plugin --profile web add github:Jiayz00/dsh-model-probe
```

或者克隆后安装（想改插件时选这个）：

```sh
git clone https://github.com/Jiayz00/dsh-model-probe.git
cd dsh-model-probe
dsh plugin --profile web add link:.
```

`link:` 让 profile 一直指向你的检出目录，改完重启即生效。相对路径会被 CLI 锚定到你执行命令的目录；Windows 上也可以写绝对路径：

```sh
dsh plugin --profile web add link:D:\path\to\dsh-model-probe
```

该命令在 profile 目录里转发给 pnpm，并因为包声明了 `dsh.bundle.patch` 而自动把它加入 profile 的 bundle 栈。插件是纯 JavaScript，**没有构建步骤**。

**安装后重启 DSH**（退出重开桌面应用，或重启 `dsh web`）。然后打开 **设置 → 插件配置**。「模型能力探测」是单独一张卡，和 Shell / Agent loop / Web search 同级，不在 Web UI 插件组里。

### 卸载

```sh
dsh plugin --profile web remove dsh-model-probe
```

重启后生效。已经写进设置的字段会保留。

## 使用方法

在 **设置 → 插件配置** 里展开这张卡。

卡片为每个「有明确模型列表」的自定义提供方渲染一张表，四列：

| 列 | 显示 |
|---|---|
| 模型 | 显示名 / id。 |
| 推理档位 | 已存档位（如 `off, low, high, max`）；不推理显示 `none`；还没写过显示 `unset`。 |
| 输入 | 已存输入模态（`text`、`text, image`）；没写过显示 `unset`。 |
| 输出 | 探测到的输出模态（仅展示）。 |

表格下方是控制区：

- **按家族表写入**——不联网。所有模型只按内置家族表匹配，补写缺失字段。
- **拉取目录后写入**——用每个提供方自己的凭证请求 `GET /models`，把目录能力字段和家族表合并后写入。
- **覆盖已有配置**（复选框）——默认两个按钮都**只补缺项**，不动你手动配置过的字段；勾选后才用探测结果替换已存的档位和输入模态。

运行期间按钮显示「正在探测…」并禁用。结束后状态行报告更新了多少个模型，日志框里每个模型一行（`提供方/模型 → 档位 · 输入 … · 输出 …`），另有按提供方的提示，例如 *no API key, using family table*。

写入完成后插件还会检查全局默认模型：如果它已存的推理 effort 不在新的允许列表里，会自动挪到最接近的档位（优先 `xhigh`，其次 `high`，再否则第一个非 `off` 档位）。

卡片约每 1.2 秒刷新一次表格，运行写入的结果稍后就会出现在列里。

## 配置

| 键 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `enabled` | `boolean` | `true` | 设为 `false` 时不注册 HTTP 路由，卡片没有后端。 |

overlay 示例（profile 的 `cordis.patch.yml`）：

```yaml
- insert:
    - id: model-probe
      name: dsh-model-probe
      config:
        enabled: true
```

## 家族表

内置表按正则匹配模型 id（顺序敏感，先命中先得），为常见家族提供输入/输出模态、档位列表和 thinking 格式——DeepSeek、Grok、Qwen、GLM、Kimi、MiniMax、Doubao/Seed，以及图像/视频生成模型。匹配不上的 id 退回「文本进、文本出、`off / low / medium / high`」。thinking 格式只在 completions 路由生效；见「协议适配」。目录数据总是对家族表的细化；见「会写什么」。

## 限制与安全

- 输入只能持久化 `text` 和 `image`，audio 会被丢掉。
- 输出模态只用于展示。
- 两个 HTTP 路由（`/api/dsh-model-probe/list`、`/api/dsh-model-probe/detect`）**只接受本机回环请求**（127.0.0.1/::1 且 Host 头匹配）。
- 「拉取目录后写入」使用提供方的真实密钥，每个提供方消耗一次真实的 `GET /models` 请求。
- 写入走 DSH settings 服务，带乐观修订号校验；只读部署会报告 *settings are read-only*，不落盘。
- 插件**刻意不 import 任何** `@deepseek-ai/*` 宿主包：它们只从桌面安装目录解析，link 检出目录解析不到，一次失败的 import 会拖垮整棵插件树。全部能力走运行时服务（`webServer`、`settings`、`subprocess`、`credentials`）。

## 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 卡片显示 *settings unavailable* | 查询时 settings 服务还没就绪。下一次刷新通常自愈；持续出现就重启 DSH（插件声明了 `inject: ['webServer', 'settings']`，正常安装会等这两个服务）。 |
| 显示「当前部署的设置只读」 | settings 后端只读；探测能跑但写不进去。 |
| 列表为空 | 没有「带明确模型列表」的自定义提供方；先到 设置 → 模型 里添加模型。 |
| 日志 *no API key, using family table* | 该提供方的 `apiKeyEnv` 解析不出密钥；这一家退回家族表。 |
| 日志 */models HTTP 4xx* | 网关拒绝了目录请求；改用家族表。 |
| 安装后没变化 | 没重启 DSH；bundle 在启动时加载。 |
| 设置校验报 *compat reasoning switches* | 旧版探测把它们写到了 responses 路由上。跑一次探测即可——只补缺项也会清掉这些开关。 |

## 许可

Apache-2.0

# 贡献指南 (Contributing Guide)

感谢你参与 **离散数学 II 可视化实验室 (`discrete-math-ii-visual-lab`)** 的建设！为了保持教学内容严谨、代码风格统一与离线零依赖体验，请在提交 PR 前遵循以下约定：

## 1. 数学术语与记号准则
本仓库严格对齐课程 PPT 体系（详见 [DESIGN_PLAN.md](./DESIGN_PLAN.md)）：
- 群的单位元默认记为 `1`（6.6 节域的乘法单位元记为 `e`）；
- 真包含记 `⊂`，允许相等记 `⊆`；
- 保留原课程经典术语：**元数、元素的周期、巡回群 `(a)`、不相杂轮换、整区、体、域（交换体）、合同关系、右陪集 `aH` / 左陪集 `Ha`、质式、相通、真因式、微商**；
- 同态定理编号沿用：**第一同态定理**（核与像-陪集对应）、**第二同态定理**（自然同态与商结构）、**第三同态定理**（商结构同构于像）；
- 置换复合严格采用**自右向左**规则：`(στ)(x) = σ(τ(x))`；
- 多项式全程采用**降幂标准型** `a₀xⁿ + a₁xⁿ⁻¹ + … + aₙ`。

## 2. 架构与离线兼容性要求
1. **保持 `file://` 直接打开零报错**：不要使用需要 HTTP 才能加载的 ES Module `import` 语法或 `fetch()` 读取本地 JSON；所有前端模块采用经典 `<script defer>` 挂载到 `window.DM2`。
2. **禁止引入外网 CDN**：所有字体、样式与 KaTeX 渲染均须使用本地 `vendor/katex/` 资源。
3. **双主题适配**：新增任何 UI 或 SVG 图形时，颜色必须引用 [css/theme.css](./css/theme.css) 中的 CSS 变量（如 `var(--accent-blue)`、`var(--text-primary)`、`var(--bg-panel)`），切勿硬编码亮/暗背景色。
4. **纯代数算法下沉**：新的数学运算逻辑优先写入 [js/core/math-engine.js](./js/core/math-engine.js)，并在 [tests/math-engine.test.mjs](./tests/math-engine.test.mjs) 中补充对应单元测试。

## 3. 提交前自检清单
```bash
npm run check   # 确认所有 JS 文件语法无误
npm test        # 确认全部代数内核单元测试通过
```
此外，请使用浏览器直接以 `file://` 方式打开 `index.html`，分别在明亮/暗色双主题下检查你改动页面的交互与控制台零报错。

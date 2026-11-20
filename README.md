# 离散数学 II 可视化实验室 (`discrete-math-ii-visual-lab`)

> **把抽象代数的群、环、域、多项式与有限域，变成看得见、摸得着的几何直觉。**
>
> Interactive geometric visualizations for **Discrete Mathematics II (Abstract Algebra)**: Groups, Subgroups & Cosets, Homomorphism Theorems, Rings & Ideals, Field Characteristics, Polynomials & Cyclotomic Roots, and Galois Finite Fields $GF(p^n)$.

---

## 核心特色

- **完全离线 · 打开即用**：零外网 CDN 依赖，内置离线 KaTeX 排版与纯原生 JavaScript 代数计算内核；**直接双击 `index.html`** 或部署到 **GitHub Pages** 即可运行。
- **双主题切换**：
  - **明亮学术白板风**（默认）：延续笔记卡片 7 色语义体系，适合长时间复习阅读；
  - **暗色 3Blue1Brown 天文馆风**：深空底色配合高对比几何轨线。
- **全景图 + 八大章节交互实验室 + 222 卡片双链**：

| 模块 | 核心数形结合模型与交互玩法 |
| :--- | :--- |
| **全景总览** | ① **单/双运算统一 Venn 谱系**（含“有限集合条件塌缩”与 8 大边界反例探针）<br>② **近世代数·环论三圆精确 Venn 图**（消去环 $K$ / 单位元环 $U$ / 交换环 $C$ / 整区 / 体 / 域 + Wedderburn 有限塌缩 + 6 项公理矩阵 + 实例快速定位） |
| **6.1 代数系统** | Cayley 运算表热力图（支持自定义 $4\times 4$ 改值）、交换对称轴 / 对角幂等元 / 拉丁方消去 / 结合律计算树 / 集合论三圆 Venn 染色 |
| **6.2 群与置换** | 群公理 5 步体检仪（对比 $(Z_8,\oplus)$ 与 $(Z_8,\odot)$）、$S_n$ **自右向左**复合编织图、不相杂轮换轨道环（步进印证周期 $=\mathrm{lcm}$）、逆序对 $T$ 交叉红点、$S_3$ 正三角形对称与交代群 $A_3$ |
| **6.3 子群与陪集** | 巡回群时钟星形图与 $\varphi(n)$ 生成元、因子 Hasse 子群格、陪集“切蛋糕”（Lagrange 划分与左右陪集对齐检测）、Cauchy 定理素数阶探针 |
| **6.4 同态与同构** | ① **纤维塌缩与商群压缩机**（动画演示第一/二/三同态定理）<br>② **三圆同态基本定理可交互三角图**（核圆+辐射陪集扇区+商圆+像圆）<br>③ 子群对应双格（直击 $N\not\subseteq H$ 时的 $\sigma^{-1}(\sigma(H))=HN$ 吸核膨胀） |
| **6.5 环与理想** | $Z_n$ 零因子雷达、四元数定向循环三角（体未必是域）、“理想黑洞”吸收 vs $\mathbb{Z}\subset\mathbb{Q}$ 逃逸、环论三圆 Venn、三圆环同态三角、极大理想 $\iff$ 单纯环 $\iff$ 域塌缩机 |
| **6.6 域特征与素域** | 整数数轴同态卷绕机 $\sigma: n\mapsto ne$（含合数 $P=6$ 零因子反证）、特征 $p$ 杨辉三角模 $p$ 消融动画 $(a+b)^p=a^p+b^p$ |
| **6.7 多项式与分圆** | 严格降幂带余除法与辗转 Bézout 步进器、$R_p$ 上相等 vs 恒等对照、特征 $0/p$ 微商 $f'(x)$ 重根几何、四域分解与 Eisenstein 探照灯、复平面单位圆分圆仪 $\Phi_n(x)$ |
| **6.8 有限域 $GF(p^n)$** | $GF(4)/GF(8)/GF(9)/GF(16)/GF(25)$ 三步构造流水线、**加法空间（可旋转 3D 立方体/网格）$\leftrightarrow$ 乘法循环圆环** Morph 变形、$R_p[x]\to GF(p^n)$ 三圆同态构造三角、子域整除格与嵌套 Venn 环 |

---

## 快速开始

### 方式一：本地直接打开（零安装）
1. 从 GitHub **Releases** 下载最新的离线便携包 `discrete-math-ii-visual-lab-*.zip` 解压（或直接克隆本仓库）。
2. 用现代浏览器（Chrome / Edge / Firefox / Safari）直接双击打开根目录下的 `index.html`。

### 方式二：本地开发与运行测试
需要 Node.js（推荐 v18+）运行纯代数内核单元测试与语法校验：

```bash
# 运行代数内核单元测试（置换、子群/商群、降幂多项式、分圆多项式、有限域公理）
npm test

# 检查 js/ 下全部脚本语法
npm run check

# （可选）启动本地静态服务预览
python -m http.server 8080
```

---

## 目录结构

```text
discrete-math-ii-visual-lab/
├── index.html                  # 三栏工作台入口（可直接 file:// 双击或 GitHub Pages 托管）
├── DESIGN_PLAN.md              # 长期架构设计与课程术语规范文档
├── CONTRIBUTING.md             # 贡献指南（代码规范、术语准则、测试流程）
├── css/
│   ├── theme.css               # 明亮学术白板 & 暗色 3B1B 双主题 CSS 变量
│   └── app.css                 # 布局、SVG 舞台、7 色卡片抽屉与弹窗样式
├── data/
│   └── knowledge-data.js       # 离线预编译的 222 张知识卡片 / 23 手写 / 8 易错 / 1801 条公式
├── js/
│   ├── app.js                  # 路由、双链抽屉、全局搜索、双主题与术语速查弹窗
│   ├── core/
│   │   ├── math-engine.js      # 纯代数计算内核（无 UI 依赖，支持 Node & 浏览器）
│   │   ├── katex-helper.js     # KaTeX 封装与代数表达式格式化
│   │   ├── svg-helper.js       # 声明式 SVG 图元、箭头标记、缓动补间与悬浮提示
│   │   ├── ring-venn.js        # 环论三圆精确 Venn 组件（clipPath 拓扑 + 公理矩阵）
│   │   └── hom-triangle.js     # 三圆同态基本定理交互三角组件（群 / 环 / 有限域）
│   └── labs/                   # overview + 6.1–6.8 九大交互实验室
├── tests/
│   └── math-engine.test.mjs    # 纯代数内核穷举测试
└── vendor/katex/               # 离线 KaTeX CSS / JS / WebFonts
```

---

## 欢迎共建（Contributing）

我们非常欢迎选修《离散数学 II》或热爱抽象代数可视化的同学一起加入维护与拓展！你可以贡献的方向包括：
- 为现有章节增加更多直观反例、群/环预设或动画细节；
- 新增习题互动演算模式或可自定义的图论/格论探索器；
- 优化移动端触控与高分屏交互体验。

提交 PR 前请务必阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [DESIGN_PLAN.md](./DESIGN_PLAN.md)，并确保 `npm test` 与 `npm run check` 全部通过。

## 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

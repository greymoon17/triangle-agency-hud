# Triangle Agency HUD (TA HUD) | 三角机构行动面板


**TA HUD** 是专为 Foundry VTT [Triangle Agency (三角机构)](https://www.twincitiesrpg.com/mystyldyne/triangleagency/) 系统设计的辅助模组。它在屏幕顶部提供了一个常驻的悬浮面板，集成了掷骰检定、天气查询、天气控制与混沌操作，旨在为 GM 和玩家提供丝滑的“职场”体验。

~~只是想在三重升华的时候放自己做的动画结果就做出了这个mod~~

---

## ✨ 核心特性 (Key Features)

### 1. HUD面板
*   **快捷按钮**：支持[玩家/GM] 进行快捷检定，**请求机构**、**天气查询**、**天气控制**、**混沌效应**，不必再打开角色卡进行检定

### 2. 自定义宏掷骰逻辑与调整和自动化资源增减
*   **全面支持**：支持 d4 (标准)、d20 (技能检定)、d10/d6 (异常能力/规则破坏者) 的掷骰规则。
*   **混合计算**：自动识别 d10 与 d6 的组合，判定混合骰子下的 **三重升华** 触发条件。
*   **自动化资源增减**：自动扣除QA/申诫/混沌等资源，聊天卡片按钮手动添加混沌

### 3. 特殊成功聊天卡片特效
*   **双卡片系统**：
    *   **详情卡**：清晰展示掷骰结果、过载计算、资质消耗等数据。
    *   **奖励卡**：当触发 **三重升华 (Triscendence)** 或 **UNL3ASH** 时，系统会额外发送一张带有特殊动画触发器的奖励卡片，列出可选的强大效果。
*   **动画对接**：内置了与 *Cinematic Cut-ins* 等动画模组的接口，支持为特殊成功播放华丽的视觉特效。

---

## 📦 安装 (Installation)

1.  复制本模组的 Manifest 地址：
    ```
    https://github.com/greymoon17/triangle-agency-hud/releases/latest/download/module.json
    ```
2.  在 Foundry VTT 的 "Add-on Modules" 标签页点击 "Install Module"。
3.  粘贴链接并安装。
4.  在游戏世界中启用模组。

---

## 🎮 使用指南 (Usage)

### HUD 按钮功能
启用模组后，屏幕顶部会出现一组按钮：

*   **🖱️ 请求机构 (Request)**: [玩家/GM] 发起现实改写或异常能力的掷骰检定。支持 d4, d20, d10, d8, d6。
*   **☁️ 天气查询 (Status)**: [玩家/GM] 快速查看当前的分部限制与天气状况。
*   **⚡ 天气控制 (Weather)**: [仅GM] 管理当前的散逸端 (Loose Ends) 与天气事件。
*   **🔥 混沌效应 (Chaos)**: [仅GM] 快速增加系统混沌值或发动异常效应。

### 原生系统检定
在设置中打开[使用系统原生检定]即可用系统的原生检定，注意该模式下音频与动画设置无法生效

### 动画配置 (可选)
本模组支持播放自定义动画（需安装 *Cinematic Cut-ins* 模组）：
1.  创建两个名为 `TA_Triple_Anim` (对应三重升华) 和 `TA_Unleash_Anim` (对应 UNL3ASH) 的宏。
2.  在宏内编写动画播放代码。
3.  当触发对应效果时，TA HUD 会自动调用这些宏。

---

## 🛠️ 依赖 (Dependencies)

*   **Triangle Agency System**: 必须安装三角机构系统。
*   *(可选)* **Dice So Nice!**: 支持 3D 骰子滚动。
*   *(可选)* **Cinematic Cut-ins**: 用于播放进阶的全屏动画。

---

## 📄 许可证 (License)

MIT License.

---
*Created by 肆贰*

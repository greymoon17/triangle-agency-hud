/**
 * 三角机构行动面板 (TA HUD) - v4.3 (异常能力资质显示修复)
 * 修复：原生模式下发动异常能力时，聊天信息中的 [quality] 占位符未被替换的问题。
 */

// ================== 1. 注册设置 ==================
Hooks.once('init', () => {
    const MOD_ID = "triangle-agency-hud";

    game.settings.register(MOD_ID, "useNativeRolling", {
        name: "使用系统原生检定",
        hint: "开启后，点击 HUD 按钮将调用系统自带的检定逻辑。关闭后将使用“自定义宏”模式",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(MOD_ID, "enableTripleSound", {
        name: "启用三重升华音效",
        hint: "仅在“自定义宏”模式下生效。",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MOD_ID, "tripleSoundPath", {
        name: "三重升华音效路径",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: "modules/triangle-agency-hud/assets/sfx_cyber.mp3"
    });

    game.settings.register(MOD_ID, "autoSyncMacros", {
        name: "启动时自动更新宏",
        hint: "自动维护模组所需的自定义宏。",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
    
    registerChatListeners();
    console.log("TA HUD | Settings & Listeners Initialized");
});

// ================== 2. 配置 ==================
const HUD_CONFIG = {
    MACRO_NAMES: {
        REQUEST: "请求机构",       
        STATUS:  "玩家状态查询",   
        WEATHER: "天气事件仪表盘", 
        CHAOS:   "混沌效应控制台"  
    },
    COMPENDIUM_ID: "triangle-agency-hud.ta-hud-macros"
};

const THEME = {
    REALITY: "#c0222f", 
    ANOMALY: "#2752a2"
};

// ================== 3. HUD 界面类 ==================
class TriangleAgencyHUD extends Application {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "ta-hud-container",
            template: "", 
            popOut: false,
        });
    }

    getData() { return { isGM: game.user.isGM }; }

    _render(force, options) {
        $('#ta-hud-container').remove();
        const isGM = game.user.isGM;
        let contentHtml = "";

        // 玩家按钮
        contentHtml += `
        <button class="ta-hud-btn btn-reality" id="hud-request" title="掷骰检定">
            <i class="fas fa-fingerprint"></i> 请求机构
        </button>
        <button class="ta-hud-btn btn-status" id="hud-status" title="查看分部限制与天气">
            <i class="fas fa-cloud"></i> 天气查询
        </button>`;

        // GM 按钮
        if (isGM) {
            contentHtml += `<div class="ta-hud-divider"></div>
            <button class="ta-hud-btn btn-weather" id="hud-weather" title="管理散逸端与事件">
                <i class="fas fa-cloud-bolt"></i> 天气控制
            </button>
            <button class="ta-hud-btn btn-chaos" id="hud-chaos" title="发动异常效应">
                <i class="fas fa-fire"></i> 混沌效应
            </button>`;
        }

        const html = $(`<div id="ta-hud-container">${contentHtml}</div>`);
        $('body').append(html);
        this.activateListeners(html);
        return Promise.resolve();
    }

    activateListeners(html) {
        html.find('#hud-request').click(() => {
            const useNative = game.settings.get("triangle-agency-hud", "useNativeRolling");
            if (useNative) NativeSystemBridge.selectType();
            else this.runMacro(HUD_CONFIG.MACRO_NAMES.REQUEST);
        });

        html.find('#hud-chaos').click(() => {
            const useNative = game.settings.get("triangle-agency-hud", "useNativeRolling");
            if (useNative) NativeSystemBridge.runAnomalyDirect();
            else this.runMacro(HUD_CONFIG.MACRO_NAMES.CHAOS);
        });
        
        html.find('#hud-status').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.STATUS));
        html.find('#hud-weather').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.WEATHER));
    }

    runMacro(macroName) {
        const macro = game.macros.find(m => m.name === macroName);
        if (macro) macro.execute();
        else {
            ui.notifications.warn(`❌ 找不到名为 "${macroName}" 的宏。正在自动修复...`);
            if (game.user.isGM) MacroSyncManager.sync().then(() => {
                const retry = game.macros.find(m => m.name === macroName);
                if(retry) retry.execute();
            });
        }
    }
}

// ================== 4. 原生系统桥接器 (UI统一+功能补全) ==================
const NativeSystemBridge = {
    // 样式助手：统一所有原生弹窗的视觉风格
    styleDialog(html, color) {
        const win = html.closest(".app.window-app.dialog");
        const header = win.find(".window-header");
        const content = win.find(".window-content");
        const btns = html.find("button");

        // 1. 窗口背景改为白色，字体改为 Signika
        content.css({
            "background": "#ffffff",
            "color": "#333333",
            "font-family": "'Signika', sans-serif",
            "padding": "15px"
        });

        // 2. 标题栏染色
        header.css({
            "background": color,
            "color": "white",
            "border": "none"
        });
        header.find(".window-title").css("font-weight", "bold");
        header.find(".close").css("color", "white"); // 关闭按钮白色

        // 3. 按钮染色
        btns.css({
            "background": color,
            "color": "white",
            "border": "none",
            "font-family": "'Signika', sans-serif",
            "font-weight": "bold",
            "box-shadow": "0 2px 4px rgba(0,0,0,0.2)"
        });
        
        // 4. 输入框样式微调
        html.find("select, input[type='text'], input[type='number']").css({
            "border": "1px solid #ccc",
            "background": "#f9f9f9"
        });
    },

    selectType() {
        const actor = canvas.tokens.controlled[0]?.actor || game.user.character;
        if (!actor) return ui.notifications.warn("请先选择一个角色！");

        new Dialog({
            title: `请求机构 - ${actor.name}`,
            content: `<div style="text-align:center; padding:10px; font-weight:bold; font-size:1.1em;">请选择检定类型</div>`,
            buttons: {
                reality: {
                    label: "现实改写",
                    callback: () => this._promptReality(actor)
                },
                anomaly: {
                    label: "异常能力",
                    callback: () => this._promptAnomaly(actor)
                }
            },
            default: "reality",
            render: (html) => {
                // 特殊处理：两个按钮不同颜色
                this.styleDialog(html, "#444"); // 默认灰色底
                const btns = html.find("button");
                $(btns[0]).css("background", THEME.REALITY); // 现实红
                $(btns[1]).css("background", THEME.ANOMALY); // 异常蓝
            }
        }).render(true);
    },

    runAnomalyDirect() {
        const actor = canvas.tokens.controlled[0]?.actor || game.user.character;
        if (!actor) return ui.notifications.warn("请先选择一个角色！");
        this._promptAnomaly(actor);
    },

    // 现实改写 (红色主题)
    _promptReality(actor) {
        const qas = actor.system.qa;
        let options = Object.entries(qas).map(([k, v]) => {
            let label = game.i18n.localize("TA.Quality." + k);
            return `<option value="${k}">${label} (${v.value}/${v.max})</option>`;
        }).join("");

        const hasD20 = actor.system.dice?.d20;
        let d20Html = hasD20 ? `
        <div style="margin-top:10px; padding:8px; background:#fff0f0; border:1px solid ${THEME.REALITY}; border-radius:4px;">
            <label style="display:flex; align-items:center; cursor:pointer;">
                <input type="checkbox" id="use-d20" style="margin-right:8px;"> 
                <b>使用技能检定 (d20)</b>
            </label>
        </div>` : "";

        new Dialog({
            title: "现实改写 (原生)",
            content: `
            <div class="form-group"><label style="font-weight:bold;">选择资质:</label><select id="qa-select" style="width:100%">${options}</select></div>
            ${d20Html}
            `,
            buttons: {
                roll: {
                    label: "请求机构",
                    callback: (html) => {
                        const qaKey = html.find("#qa-select").val();
                        const useD20 = html.find("#use-d20").is(":checked");
                        
                        if (useD20) {
                            game.ta.helpers.taDice.rollD20({
                                actor: actor,
                                quality: null,
                                supplement: null,
                                burnout: 0
                            });
                        } else {
                            const qualityObj = actor.system.qa[qaKey];
                            qualityObj.id = qaKey;
                            let msg = game.i18n.localize("TA.Agent.AskTheAgencyMsg");
                            msg = msg.replaceAll("[quality]", game.i18n.localize("TA.Quality." + qaKey));

                            game.ta.helpers.taDice.rollD4({
                                actor: actor,
                                quality: qualityObj,
                                supplement: actor.system.dice.d8 ? "d8" : undefined,
                                burnout: actor.system.burnout,
                                message: msg,
                                action: "ata"
                            });
                        }
                    }
                }
            },
            render: (html) => this.styleDialog(html, THEME.REALITY)
        }).render(true);
    },

    // 异常能力 (蓝色主题 + 骰子选项补全 + 资质显示修复)
    _promptAnomaly(actor) {
        const abilities = actor.items.filter(i => i.type === "AnomalyAbility");
        if (!abilities.length) return ui.notifications.warn("没有异常能力！");

        let options = abilities.map(i => `<option value="${i.id}">${i.name}</option>`).join("");

        // 检测高级骰子
        const hasD10 = actor.system.dice?.d10 || false;
        const hasD6 = actor.system.dice?.d6 || false;

        let diceOptionsHTML = "";
        if (hasD10 || hasD6) {
            diceOptionsHTML += `<div style="margin-top:10px; padding:5px;">`;
            
            if (hasD10) {
                diceOptionsHTML += `
                <div style="margin-bottom:5px; padding:5px; background:#f0f0ff; border:1px solid ${THEME.ANOMALY}; border-radius:4px;">
                    <label style="display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" id="use-d10" style="margin-right:8px;"> 
                        <b>十面骰 (d10)</b> <span style="font-size:0.8em; color:#666; margin-left:5px;">(替代6d4)</span>
                    </label>
                </div>`;
            }
            if (hasD6) {
                diceOptionsHTML += `
                <div style="padding:5px; border:1px dashed #ccc; border-radius:4px;">
                    <label style="display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" id="use-d6" style="margin-right:8px;"> 
                        <b>规则破坏者 (d6)</b>
                    </label>
                </div>`;
            }
            diceOptionsHTML += `</div>`;
        }

        new Dialog({
            title: "发动异常能力 (原生)",
            content: `
            <div class="form-group"><label style="font-weight:bold;">选择能力:</label><select id="ab-select" style="width:100%">${options}</select></div>
            ${diceOptionsHTML}
            `,
            buttons: {
                roll: {
                    label: "发动能力",
                    callback: (html) => {
                        const abId = html.find("#ab-select").val();
                        const ability = actor.items.get(abId);
                        const qaKey = ability.system.quality;
                        const qualityObj = actor.system.qa[qaKey];
                        if(qualityObj) qualityObj.id = qaKey;

                        let msg = game.i18n.localize("TA.Agent.UseAbilityMsg");
                        
                        // 【修复】手动替换 [quality]
                        const qualityLabel = game.i18n.localize("TA.Quality." + qaKey);
                        msg = msg.replaceAll("[quality]", qualityLabel);
                        
                        // 替换 [ability]
                        msg = msg.replace("[ability]", ability.name); 

                        // 获取勾选状态
                        const useD10 = html.find("#use-d10").is(":checked");
                        const useD6 = html.find("#use-d6").is(":checked");
                        const supplement = useD6 ? "d6" : undefined;

                        // 调用系统逻辑
                        if (useD10) {
                            game.ta.helpers.taDice.rollD10({
                                actor: actor,
                                quality: qualityObj,
                                supplement: supplement,
                                burnout: actor.system.burnout,
                                message: msg,
                                action: "anomaly",
                                ability: ability
                            });
                        } else {
                            game.ta.helpers.taDice.rollD4({
                                actor: actor,
                                quality: qualityObj,
                                supplement: supplement,
                                burnout: actor.system.burnout,
                                message: msg,
                                action: "anomaly",
                                ability: ability
                            });
                        }
                    }
                }
            },
            render: (html) => this.styleDialog(html, THEME.ANOMALY)
        }).render(true);
    }
};

// ================== 5. 聊天监听器 (保持不变) ==================
const _taPlayedAnimations = new Set();

function registerChatListeners() {
    const hookName = "renderChatMessageHTML" in Hooks.events ? "renderChatMessageHTML" : "renderChatMessage";

    Hooks.on(hookName, (message, htmlElement) => {
        const html = $(htmlElement); 

        // 1. 混沌按钮
        html.find(".ta-apply-chaos").click(async (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            const btn = $(ev.currentTarget);
            if (btn.hasClass("applied")) return;
            const increment = parseInt(btn.attr("data-chaos"));
            
            let currentChaos = 0;
            try { currentChaos = game.settings.get("triangleagency", "chaos") || 0; } catch(e){}
            let newChaos = currentChaos + increment;

            if (game.user.isGM) {
                if(game.ta?.applications?.agencyOs) game.ta.applications.agencyOs.setChaos(newChaos);
                else try { await game.settings.set("triangleagency", "chaos", newChaos); } catch(e){}
            } else {
                if (game.system?.socketHandler) game.system.socketHandler.emit("setChaos", newChaos);
            }
            btn.addClass("applied").prop("disabled", true).html(`<i class="fas fa-check"></i> 已应用`);
            ui.notifications.info(`混沌值已增加 ${increment}`);
        });
        
        // 2. 散逸端按钮
        html.find(".ta-apply-le").click(async function(ev) {
            if (!game.user.isGM) return ui.notifications.warn("只有 GM 可以更新散逸端。");
            const btn = $(this);
            if (btn.hasClass("applied")) return;
            const change = parseInt(btn.attr("data-le-change"));
            let current = 0;
            try { current = game.settings.get("triangleagency", "looseends") || 0; } catch(e){}
            let newVal = Math.max(0, current + change);
            try { await game.settings.set("triangleagency", "looseends", newVal); } catch(e){}
            if (game.system?.socketHandler) {
                game.system.socketHandler.emit("syncGlobals", null);
                if (game.ta?.applications?.agencyOs) game.ta.applications.agencyOs.syncData();
            }
            btn.addClass("applied").prop("disabled", true).html(`<i class="fas fa-check"></i> 已更新`);
        });

        // 3. 动画宏触发器
        const cciModule = game.modules.get("cinematic-cut-ins");
        if (cciModule?.active) {
            const timeSinceCreated = Date.now() - message.timestamp;
            if (timeSinceCreated > 5000) return;

            const rewardHeader = html.find(".ta-reward-header");
            if (rewardHeader.length > 0) {
                if (_taPlayedAnimations.has(message.id)) return;
                if (html.attr("data-ta-anim-played") === "true") return;

                const animType = rewardHeader.attr("data-ta-anim");
                let macroName = animType === "unleash" ? "TA_Unleash_Anim" : "TA_Triple_Anim";

                _taPlayedAnimations.add(message.id);
                html.attr("data-ta-anim-played", "true");

                const animMacro = game.macros.find(m => m.name === macroName);
                if (animMacro) animMacro.execute();
            }
        }
    });
}

// ================== 6. 宏同步管理器 (保持不变) ==================
const MacroSyncManager = {
    async sync() {
        if (!game.user.isGM) return;
        const pack = game.packs.get(HUD_CONFIG.COMPENDIUM_ID);
        if (!pack) return;

        try {
            const index = await pack.getIndex();
            const macroList = Object.values(HUD_CONFIG.MACRO_NAMES);
            let updateCount = 0;

            for (const name of macroList) {
                const entry = index.find(i => i.name === name);
                if (!entry) continue;

                const sourceData = await pack.getDocument(entry._id);
                const existingMacro = game.macros.find(m => m.name === name);
                
                let ownership = { default: 0 };
                if (name === HUD_CONFIG.MACRO_NAMES.REQUEST || name === HUD_CONFIG.MACRO_NAMES.STATUS) {
                    ownership = { default: 2 };
                }

                const macroData = {
                    name: sourceData.name,
                    type: sourceData.type,
                    img: sourceData.img,
                    command: sourceData.command,
                    author: game.user.id,
                    ownership: ownership,
                    flags: { ta: { key: "ta_hud_macro", item: { type: "macro" } } }
                };

                if (existingMacro) {
                    if (existingMacro.command !== sourceData.command) {
                        await existingMacro.update(macroData);
                        updateCount++;
                    }
                } else {
                    await Macro.create(macroData);
                    updateCount++;
                }
            }
            if (updateCount > 0) console.log(`TA HUD: 同步了 ${updateCount} 个宏。`);
        } catch (err) {
            console.warn("TA HUD | 宏同步异常:", err);
        }
    }
};

// ================== 7. Ready ==================
Hooks.once('ready', () => {
    new TriangleAgencyHUD().render(true);

    if (game.user.isGM && game.settings.get("triangle-agency-hud", "autoSyncMacros")) {
        MacroSyncManager.sync();
    }
});

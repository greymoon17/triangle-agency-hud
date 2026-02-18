/**
 * 三角机构行动面板 (TA HUD) - v1.6.0 (防双重播放终极版)
 */

// ================== 1. 注册设置 ==================
Hooks.once('init', () => {
    const MOD_ID = "triangle-agency-hud";

    game.settings.register(MOD_ID, "enableTripleSound", {
        name: "启用三重升华音效",
        hint: "当达成三重升华时，是否播放音效。",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MOD_ID, "tripleSoundPath", {
        name: "三重升华音效路径",
        hint: "点击右侧按钮选择音频文件。",
        scope: "world",
        config: true,
        type: String,
        filePicker: "audio",
        default: "modules/triangle-agency-hud/assets/sfx_cyber.mp3"
    });

    game.settings.register(MOD_ID, "autoSyncMacros", {
        name: "启动时自动更新宏",
        hint: "开启后，每次进入游戏会自动将世界中的宏代码更新为模组的最新版本。",
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
        
        // 返回一个 resolve 的 Promise 以兼容 V13
        return Promise.resolve();
    }

    activateListeners(html) {
        html.find('#hud-request').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.REQUEST));
        html.find('#hud-status').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.STATUS));
        html.find('#hud-weather').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.WEATHER));
        html.find('#hud-chaos').click(() => this.runMacro(HUD_CONFIG.MACRO_NAMES.CHAOS));
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

// ================== 4. 聊天监听器 (双重锁版) ==================
// 将 Set 定义在函数外，确保它是真正的单例
const _taPlayedAnimations = new Set();

function registerChatListeners() {
    // 兼容 V13 (HTML Element) 和 V12
    const hookName = "renderChatMessageHTML" in Hooks.events ? "renderChatMessageHTML" : "renderChatMessage";

    Hooks.on(hookName, (message, htmlElement) => {
        const html = $(htmlElement); 

        // 1. 混沌按钮监听
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
        
        // 2. 散逸端按钮监听
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

        // ================== 3. 动画宏触发器 (支持 UNL3ASH 分离) ==================
        const cciModule = game.modules.get("cinematic-cut-ins");
        if (cciModule?.active) {
            
            // 锁1: 时间锁
            const timeSinceCreated = Date.now() - message.timestamp;
            if (timeSinceCreated > 5000) return;

            // 查找奖励标题条
            const rewardHeader = html.find(".ta-reward-header");
            
            if (rewardHeader.length > 0) {
                // 锁2: 内存锁
                if (_taPlayedAnimations.has(message.id)) return;
                // 锁3: DOM锁
                if (html.attr("data-ta-anim-played") === "true") return;

                // --- 读取动画类型 ---
                const animType = rewardHeader.attr("data-ta-anim"); // 获取我们在宏里设置的类型
                
                // 根据类型决定播放哪个宏
                let macroName = "";
                if (animType === "unleash") {
                    macroName = "TA_Unleash_Anim"; // 新的动画宏
                } else {
                    macroName = "TA_Triple_Anim";  // 旧的动画宏 (默认)
                }

                // 立即上锁
                _taPlayedAnimations.add(message.id);
                html.attr("data-ta-anim-played", "true");

                // 执行对应的宏
                const animMacro = game.macros.find(m => m.name === macroName);
                if (animMacro) {
                    animMacro.execute();
                    console.log(`TA HUD | 播放动画宏 [${macroName}] (Msg ID: ${message.id})`);
                }
            }
        }
    });
}

// ================== 5. 宏同步管理器 ==================
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

// ================== 6. Ready ==================
Hooks.once('ready', () => {
    // 渲染 HUD
    new TriangleAgencyHUD().render(true);

    if (game.user.isGM && game.settings.get("triangle-agency-hud", "autoSyncMacros")) {
        MacroSyncManager.sync();
    }
});
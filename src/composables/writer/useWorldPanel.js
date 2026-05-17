/**
 * 世界观管理Composable - 管理世界观CRUD、AI生成、批量生成
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import apiService from "../../services/api.js";
import { useNovelStore } from "../../stores/novel.js";

import { generateUniqueId } from "../../utils/id.js";

export const useWorldPanel = () => {
  const novelStore = useNovelStore();

  // 响应式状态 - 使用 toRef 保持与 store 的响应式链接
  // 注意：toRef 创建的是对源响应式对象的引用，适用于标量值
  // 对于数组，仍需注意深层变更需通过 store action 进行
  const worldSettings = ref(novelStore.worldSettings);
  const showWorldDialog = ref(false);
  const showWorldGenerateDialog = ref(false);
  const worldForm = ref({
    id: null,
    title: "",
    description: "",
    category: "setting",
    details: "",
  });
  const editingWorldSetting = ref(null);

  // 批量生成相关
  const worldGenerateConfig = ref({
    count: 3,
    includeGeography: true,
    includeCulture: true,
    includeHistory: true,
    includeMagic: false,
    includeTechnology: false,
    includePolitics: false,
    includeReligion: false,
    includeEconomy: false,
    includeRaces: false,
    includeLanguage: false,
    customPrompt: "",
  });
  const worldGenerating = ref(false);
  const generatedWorldSettings = ref([]);
  const streamingContent = ref([]);
  const worldSettingSelectedPrompt = ref(null);
  const worldSettingPromptVariables = ref({});
  const worldSettingFinalPrompt = ref("");

  // 停止生成控制器
  let stopController = null;

  // 初始化世界观设定列表 - 使用 Pinia $patch 保持响应式
  const initWorldSettings = (settingsList) => {
    novelStore.$patch((state) => {
      state.worldSettings = settingsList || [];
    });
  };

  // 打开新增世界观对话框
  const addWorldSetting = (formData) => {
    editingWorldSetting.value = null;
    if (formData) {
      worldForm.value = { ...formData };
    } else {
      worldForm.value = {
        id: null,
        title: "",
        description: "",
        category: "setting",
        details: "",
      };
    }
    showWorldDialog.value = true;
  };

  // 打开编辑世界观对话框
  const editWorldSetting = (setting) => {
    editingWorldSetting.value = setting;
    worldForm.value = { ...setting };
    showWorldDialog.value = true;
  };

  // 保存世界观设定
  const saveWorldSetting = (formData) => {
    const data = formData || worldForm.value;
    if (!data.title?.trim()) {
      ElMessage.warning("请输入设定标题");
      return false;
    }

    if (editingWorldSetting.value) {
      // 编辑现有设定
      novelStore.updateWorldSetting(editingWorldSetting.value.id, data);
      ElMessage.success("设定信息已更新");
    } else {
      // 新增设定
      const newSetting = {
        id: generateUniqueId(),
        ...data,
        createdAt: new Date(),
        generated: false,
      };
      novelStore.addWorldSetting(newSetting);
      ElMessage.success("设定创建成功");
    }

    showWorldDialog.value = false;
    return true;
  };

  // 删除世界观设定
  const deleteWorldSetting = (setting) => {
    return ElMessageBox.confirm(
      `确定要删除设定《${setting.title}》吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(() => {
        novelStore.removeWorldSetting(setting.id);
        ElMessage.success("设定已删除");
        return true;
      })
      .catch(() => false);
  };

  // 复制世界观设定
  const duplicateWorldSetting = (setting) => {
    const newSetting = {
      ...setting,
      id: generateUniqueId(),
      title: setting.title + " (副本)",
      createdAt: new Date(),
      generated: false,
    };
    novelStore.addWorldSetting(newSetting);
    ElMessage.success("设定已复制");
  };

  // 处理世界观设定操作
  const handleWorldSettingAction = (command, setting) => {
    switch (command) {
      case "edit":
        editWorldSetting(setting);
        break;
      case "duplicate":
        duplicateWorldSetting(setting);
        break;
      case "delete":
        return deleteWorldSetting(setting);
    }
  };

  // 解析AI生成的世界观设定
  const parseGeneratedWorldSettings = (aiResponse) => {
    const settings = [];
    const sections = aiResponse
      .split(/(?:设定\d+[:：]|\n\n+)/)
      .filter((s) => s.trim());

    for (const section of sections) {
      const titleMatch =
        section.match(/标题[:：]\s*(.+)/) ||
        section.match(/^【?([^【\n]+?)(?=：【|\n|$)/);
      const descMatch = section.match(
        /(?:描述|说明)[:：]\s*([\s\S]+?)(?=\n\n|$)/,
      );

      if (titleMatch) {
        const title = titleMatch[1]
          .trim()
          .split(/[【\n]/)[0]
          .trim();
        if (title && title.length < 50) {
          settings.push({
            id: generateUniqueId(),
            title,
            description: descMatch ? descMatch[1].trim() : "",
            category: "setting",
            details: descMatch ? descMatch[1].trim() : "",
            generated: true,
            createdAt: new Date(),
          });
        }
      }
    }

    return settings;
  };

  // 批量AI生成世界观设定
  const batchGenerateWorldSettings = async (config, novelInfo, aiState) => {
    if (!apiService.getConfig().apiKey) {
      ElMessage.warning("请先配置API密钥");
      return [];
    }

    const cfg = config || worldGenerateConfig.value;
    worldGenerating.value = true;
    generatedWorldSettings.value = [];
    streamingContent.value = [];
    stopController = null;

    try {
      const prompt = buildWorldSettingsPrompt(cfg, novelInfo);
      let fullContent = "";

      const response = await apiService.generateTextStream(
        prompt,
        {
          maxTokens: null,
          temperature: 0.8,
          type: "worldview",
        },
        (chunk) => {
          fullContent += chunk;
          streamingContent.value.push(chunk);
        },
        (ctrl) => {
          stopController = ctrl;
        },
      );

      if (stopController?.cancelled) return;
      const parsed = parseGeneratedWorldSettings(fullContent);
      generatedWorldSettings.value = parsed;
      return parsed;
    } catch (error) {
      console.error("批量生成世界观设定失败:", error);
      if (!stopController?.cancelled) {
        ElMessage.error(`生成失败: ${error.message}`);
      }
      return [];
    } finally {
      worldGenerating.value = false;
    }
  };

  // 停止生成
  const stopWorldGeneration = () => {
    if (stopController) {
      stopController.cancel();
      stopController.cancelled = true;
    }
    worldGenerating.value = false;
  };

  // 构建世界观生成提示词
  const buildWorldSettingsPrompt = (config, novelInfo) => {
    const count = config.count;
    const settingTypes = [];
    if (config.includeGeography) settingTypes.push("地理环境");
    if (config.includeCulture) settingTypes.push("文化社会");
    if (config.includeHistory) settingTypes.push("历史背景");
    if (config.includeMagic) settingTypes.push("魔法体系");
    if (config.includeTechnology) settingTypes.push("科技水平");
    if (config.includePolitics) settingTypes.push("政治势力");
    if (config.includeReligion) settingTypes.push("宗教信仰");
    if (config.includeEconomy) settingTypes.push("经济贸易");
    if (config.includeRaces) settingTypes.push("种族设定");
    if (config.includeLanguage) settingTypes.push("语言文字");

    let prompt = `请为小说《${novelInfo?.title || "未命名小说"}》生成${count}个世界观设定。\n\n`;
    prompt += `小说类型：${novelInfo?.genre || "通用"}\n`;
    prompt += `小说简介：${novelInfo?.description || "暂无简介"}\n\n`;
    prompt += `设定类型：${settingTypes.join("、")}\n`;
    if (config.customPrompt) {
      prompt += `特殊要求：${config.customPrompt}\n`;
    }
    prompt += `\n请严格按照以下格式生成${count}个设定：\n\n`;
    prompt += `设定1：\n标题：[设定标题]\n描述：[详细的世界观描述]\n\n`;
    prompt += `设定2：\n标题：[设定标题]\n描述：[详细的世界观描述]\n\n`;
    prompt += `（以此类推，生成完整的${count}个设定）`;

    return prompt;
  };

  // 将生成的世界观设定添加到列表
  const addGeneratedWorldSettings = (settings) => {
    const list = settings || generatedWorldSettings.value;
    list.forEach((setting) => {
      novelStore.addWorldSetting({
        ...setting,
        id: generateUniqueId(),
        generated: true,
      });
    });
    ElMessage.success(`已添加${list.length}个世界观设定`);
    showWorldGenerateDialog.value = false;
    generatedWorldSettings.value = [];
  };

  // 打开批量生成对话框
  const openWorldGenerateDialog = () => {
    worldGenerateConfig.value = {
      count: 3,
      includeGeography: true,
      includeCulture: true,
      includeHistory: true,
      includeMagic: false,
      includeTechnology: false,
      includePolitics: false,
      includeReligion: false,
      includeEconomy: false,
      includeRaces: false,
      includeLanguage: false,
      customPrompt: "",
    };
    generatedWorldSettings.value = [];
    showWorldGenerateDialog.value = true;
  };

  // 关闭对话框
  const closeWorldDialog = () => {
    showWorldDialog.value = false;
    editingWorldSetting.value = null;
  };

  // 获取世界观设定列表
  const getWorldSettings = () => novelStore.worldSettings;

  return {
    // 状态
    worldSettings,
    showWorldDialog,
    showWorldGenerateDialog,
    worldForm,
    editingWorldSetting,
    worldGenerateConfig,
    worldGenerating,
    generatedWorldSettings,
    streamingContent,
    worldSettingSelectedPrompt,
    worldSettingPromptVariables,
    worldSettingFinalPrompt,

    // 方法
    initWorldSettings,
    addWorldSetting,
    editWorldSetting,
    saveWorldSetting,
    deleteWorldSetting,
    duplicateWorldSetting,
    handleWorldSettingAction,
    parseGeneratedWorldSettings,
    batchGenerateWorldSettings,
    addGeneratedWorldSettings,
    stopWorldGeneration,
    openWorldGenerateDialog,
    closeWorldDialog,
    getWorldSettings,
  };
};

/**
 * 角色管理Composable - 管理角色CRUD、AI生成、批量生成
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import apiService from "../../services/api.js";

import { generateUniqueId } from "../../utils/id.js";

// 统一的角色类型常量 - 解决组件间角色类型枚举混用问题
// 注意：parseGeneratedCharacters 中使用 'supporting' 是因为AI生成结果格式固定，
// 该方法仅用于解析，存入时仍使用 'supporting'
// 注意：key 拼写 PROTAGONIST（P-R-O-T-A-G-O-N-I-S-T）
export const CHARACTER_ROLES = {
  PROTAGONIST: "protagonist", // 主角 (P-R-O-T-A-G-O-N-I-S-T)
  SUPPORTING: "supporting", // 配角
  ANTAGONIST: "antagonist", // 反派
  MINOR: "minor", // 路人
};

// 角色类型到 UI 标签类型的映射
export const CHARACTER_ROLE_TAG_TYPES = {
  [CHARACTER_ROLES.PROTAGONIST]: "primary", // protagonist → 主角
  [CHARACTER_ROLES.SUPPORTING]: "success",
  [CHARACTER_ROLES.ANTAGONIST]: "danger",
  [CHARACTER_ROLES.MINOR]: "info",
};

// 角色类型到中文文本的映射
export const CHARACTER_ROLE_TEXTS = {
  [CHARACTER_ROLES.PROTAGONIST]: "主角", // protagonist → 主角
  [CHARACTER_ROLES.SUPPORTING]: "配角",
  [CHARACTER_ROLES.ANTAGONIST]: "反派",
  [CHARACTER_ROLES.MINOR]: "路人",
};

// 角色类型到 Element Plus Tag 类型的辅助函数
export const getRoleType = (role) => {
  return CHARACTER_ROLE_TAG_TYPES[role] || "info";
};

// 角色类型到中文文本的辅助函数
export const getRoleText = (role) => {
  return CHARACTER_ROLE_TEXTS[role] || role || "未知";
};

export const useCharacterPanel = () => {
  // 响应式状态
  const characters = ref([]);
  const showCharacterDialog = ref(false);
  const showBatchGenerateCharacterDialog = ref(false);
  const characterForm = ref({
    id: null,
    name: "",
    role: "supporting",
    gender: "male",
    age: 25,
    appearance: "",
    personality: "",
    background: "",
    tags: [],
    avatar: "",
  });
  const characterTagInput = ref("");
  const editingCharacter = ref(null);

  // 批量生成相关
  const batchGenerateConfig = ref({
    count: 5,
    includeMainCharacters: true,
    includeSupportingCharacters: true,
    includeMinorCharacters: true,
    customPrompt: "",
    autoAssignRoles: true,
  });
  const batchGenerating = ref(false);
  const generatedCharacters = ref([]);
  const streamingContent = ref([]);
  const batchCharacterSelectedPrompt = ref(null);
  const batchCharacterPromptVariables = ref({});
  const batchCharacterFinalPrompt = ref("");

  // 停止生成控制器
  let stopController = null;

  // 初始化角色列表
  const initCharacters = (characterList) => {
    characters.value = characterList || [];
  };

  // 打开新增角色对话框
  const addCharacter = (formData) => {
    editingCharacter.value = null;
    if (formData) {
      characterForm.value = { ...formData };
    } else {
      characterForm.value = {
        id: null,
        name: "",
        role: "supporting",
        gender: "male",
        age: 25,
        appearance: "",
        personality: "",
        background: "",
        tags: [],
        avatar: "",
      };
    }
    characterTagInput.value = "";
    showCharacterDialog.value = true;
  };

  // 打开编辑角色对话框
  const editCharacter = (character) => {
    editingCharacter.value = character;
    characterForm.value = {
      id: character.id,
      name: character.name,
      role: character.role || "supporting",
      gender: character.gender || "male",
      age: character.age || 25,
      appearance: character.appearance || "",
      personality: character.personality || "",
      background: character.background || "",
      tags: character.tags || [],
      avatar: character.avatar || "",
    };
    characterTagInput.value = "";
    showCharacterDialog.value = true;
  };

  // 保存角色
  const saveCharacter = (formData) => {
    const data = formData || characterForm.value;
    if (!data.name?.trim()) {
      ElMessage.warning("请输入角色姓名");
      return false;
    }

    if (editingCharacter.value) {
      // 编辑现有角色
      Object.assign(editingCharacter.value, {
        name: data.name,
        role: data.role,
        gender: data.gender,
        age: data.age,
        appearance: data.appearance,
        personality: data.personality,
        background: data.background,
        tags: data.tags,
        avatar: data.avatar,
      });
      ElMessage.success("角色信息已更新");
    } else {
      // 新增角色
      const newCharacter = {
        id: generateUniqueId(),
        name: data.name,
        role: data.role || "supporting",
        gender: data.gender || "male",
        age: data.age || 25,
        appearance: data.appearance || "",
        personality: data.personality || "",
        background: data.background || "",
        tags: data.tags || [],
        avatar: data.avatar || "",
        createdAt: new Date(),
      };
      characters.value.push(newCharacter);
      ElMessage.success("角色创建成功");
    }

    showCharacterDialog.value = false;
    return true;
  };

  // 删除角色
  const deleteCharacter = (character) => {
    return ElMessageBox.confirm(
      `确定要删除角色《${character.name}》吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(() => {
        const index = characters.value.findIndex((c) => c.id === character.id);
        if (index > -1) {
          characters.value.splice(index, 1);
          ElMessage.success("角色已删除");
          return true;
        }
        return false;
      })
      .catch(() => false);
  };

  // 处理角色操作
  const handleCharacterAction = (command, character) => {
    switch (command) {
      case "edit":
        editCharacter(character);
        break;
      case "delete":
        return deleteCharacter(character);
    }
  };

  // 添加角色标签
  const addCharacterTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !characterForm.value.tags.includes(trimmedTag)) {
      characterForm.value.tags.push(trimmedTag);
    }
    characterTagInput.value = "";
  };

  // 移除角色标签
  const removeCharacterTag = (tag) => {
    const index = characterForm.value.tags.indexOf(tag);
    if (index > -1) {
      characterForm.value.tags.splice(index, 1);
    }
  };

  // 解析AI生成的角色
  const parseGeneratedCharacters = (aiResponse) => {
    const characters = [];
    const sections = aiResponse
      .split(/(?:角色\d+[:：]|\n\n+)/)
      .filter((s) => s.trim());

    for (const section of sections) {
      const nameMatch =
        section.match(/姓名[:：]\s*(.+)/) ||
        section.match(/^【?([^【\n]+?)(?=：【|\n|$)/);
      const appearanceMatch = section.match(/外貌[:：]\s*(.+)/s);
      const personalityMatch = section.match(/性格[:：]\s*(.+)/s);
      const backgroundMatch = section.match(/背景[:：]\s*(.+)/s);
      const tagsMatch = section.match(/标签[:：]\s*(.+)/);

      if (nameMatch) {
        const name = nameMatch[1]
          .trim()
          .split(/[【\n]/)[0]
          .trim();
        if (name && name.length < 20) {
          const character = {
            id: generateUniqueId(),
            name,
            role: "supporting",
            gender: "male",
            age: 25,
            appearance: appearanceMatch ? appearanceMatch[1].trim() : "",
            personality: personalityMatch ? personalityMatch[1].trim() : "",
            background: backgroundMatch ? backgroundMatch[1].trim() : "",
            tags: tagsMatch
              ? tagsMatch[1]
                  .split(/[,，、]/)
                  .map((t) => t.trim())
                  .filter((t) => t)
              : [],
            avatar: "",
            generated: true,
            createdAt: new Date(),
          };
          characters.push(character);
        }
      }
    }

    return characters;
  };

  // 批量AI生成角色
  const batchGenerateCharacters = async (config, novelInfo, aiState) => {
    if (!apiService.getConfig().apiKey) {
      ElMessage.warning("请先配置API密钥");
      return [];
    }

    const cfg = config || batchGenerateConfig.value;
    batchGenerating.value = true;
    generatedCharacters.value = [];
    streamingContent.value = [];
    stopController = null;

    try {
      const prompt = buildBatchCharacterPrompt(cfg, novelInfo);
      let fullContent = "";

      const response = await apiService.generateTextStream(
        prompt,
        {
          maxTokens: null,
          temperature: 0.8,
          type: "character",
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
      const parsed = parseGeneratedCharacters(fullContent);
      generatedCharacters.value = parsed;
      return parsed;
    } catch (error) {
      console.error("批量生成角色失败:", error);
      if (!stopController?.cancelled) {
        ElMessage.error(`批量生成失败: ${error.message}`);
      }
      return [];
    } finally {
      batchGenerating.value = false;
    }
  };

  // 停止批量生成
  const stopBatchGeneration = () => {
    if (stopController) {
      stopController.cancel();
      stopController.cancelled = true;
    }
    batchGenerating.value = false;
  };

  // 构建批量角色生成提示词
  const buildBatchCharacterPrompt = (config, novelInfo) => {
    const count = config.count;
    const characterTypes = [];
    if (config.includeMainCharacters) characterTypes.push("主角");
    if (config.includeSupportingCharacters) characterTypes.push("配角");
    if (config.includeMinorCharacters) characterTypes.push("次要角色");

    let prompt = `请为小说《${novelInfo?.title || "未命名小说"}》生成${count}个角色。\n\n`;
    prompt += `小说类型：${novelInfo?.genre || "通用"}\n`;
    prompt += `小说简介：${novelInfo?.description || "暂无简介"}\n\n`;
    prompt += `角色类型：${characterTypes.join("、")}\n`;
    if (config.customPrompt) {
      prompt += `特殊要求：${config.customPrompt}\n`;
    }
    prompt += `\n请严格按照以下格式生成${count}个角色，每个角色包含：姓名、外貌、性格、背景、标签\n\n`;
    prompt += `角色1：\n姓名：[角色姓名]\n外貌：[详细的外貌描述]\n性格：[性格特点]\n背景：[背景故事]\n标签：[标签1,标签2,标签3]\n\n`;
    prompt += `角色2：\n姓名：[角色姓名]\n外貌：[详细的外貌描述]\n性格：[性格特点]\n背景：[背景故事]\n标签：[标签1,标签2,标签3]\n\n`;
    prompt += `（以此类推，生成完整的${count}个角色）`;

    return prompt;
  };

  // 将生成的角色添加到列表
  const addGeneratedCharacters = (chars) => {
    const list = chars || generatedCharacters.value;
    list.forEach((char) => {
      characters.value.push({
        ...char,
        id: generateUniqueId(),
        generated: true,
      });
    });
    ElMessage.success(`已添加${list.length}个角色`);
    showBatchGenerateCharacterDialog.value = false;
    generatedCharacters.value = [];
  };

  // 打开批量生成对话框
  const openBatchGenerateDialog = () => {
    batchGenerateConfig.value = {
      count: 5,
      includeMainCharacters: true,
      includeSupportingCharacters: true,
      includeMinorCharacters: true,
      customPrompt: "",
      autoAssignRoles: true,
    };
    generatedCharacters.value = [];
    showBatchGenerateCharacterDialog.value = true;
  };

  // 关闭对话框
  const closeCharacterDialog = () => {
    showCharacterDialog.value = false;
    editingCharacter.value = null;
  };

  // 获取角色列表
  const getCharacters = () => characters.value;

  return {
    // 状态
    characters,
    showCharacterDialog,
    showBatchGenerateCharacterDialog,
    characterForm,
    characterTagInput,
    editingCharacter,
    batchGenerateConfig,
    batchGenerating,
    generatedCharacters,
    streamingContent,
    batchCharacterSelectedPrompt,
    batchCharacterPromptVariables,
    batchCharacterFinalPrompt,

    // 方法
    initCharacters,
    addCharacter,
    editCharacter,
    saveCharacter,
    deleteCharacter,
    handleCharacterAction,
    addCharacterTag,
    removeCharacterTag,
    parseGeneratedCharacters,
    batchGenerateCharacters,
    addGeneratedCharacters,
    stopBatchGeneration,
    openBatchGenerateDialog,
    closeCharacterDialog,
    getCharacters,

    // 导出角色类型工具函数，供外部组件使用
    CHARACTER_ROLES,
    getRoleType,
    getRoleText,
  };
};

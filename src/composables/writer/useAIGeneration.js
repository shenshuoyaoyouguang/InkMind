/**
 * AI生成Composable - 管理AI生成核心逻辑（流式生成、章节解析、提示词构建）
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import apiService from "../../services/api.js";

export const useAIGeneration = () => {
  const router = useRouter();

  // 响应式状态
  const isGeneratingContent = ref(false);
  const isGeneratingChapters = ref(false);
  const isOptimizing = ref(false);
  const isStreaming = ref(false);
  const streamingContent = ref("");
  const streamingType = ref("");

  // 提示词相关
  const showPromptDialog = ref(false);
  const selectedPromptCategory = ref("");
  const availablePrompts = ref([]);
  const selectedPrompt = ref(null);
  const promptVariables = ref({});
  const finalPrompt = ref("");

  // 章节生成配置
  const showChapterGenerateDialog = ref(false);
  const selectedMaterials = ref({
    characters: [],
    worldSettings: [],
    corpus: [],
    events: [],
    chapters: [],
  });
  const selectedContextChapters = ref([]);
  const generateConfig = ref({
    wordCount: 2000,
    style: "third-person",
    focus: "",
  });

  // 小说类型映射
  const genreMap = {
    fantasy: "玄幻小说",
    urban: "都市言情",
    historical: "历史架空",
    martial: "武侠修仙",
    science: "科幻未来",
    romance: "现代言情",
    mystery: "悬疑推理",
    adventure: "冒险奇幻",
    horror: "恐怖惊悚",
    general: "通用小说",
  };

  // 获取中文类型
  const getChineseGenre = (genre) => {
    return genreMap[genre] || "通用小说";
  };

  // 检查API配置
  const checkApiConfig = () => {
    const config = apiService.getConfig();
    if (!config.apiKey || !config.baseURL) {
      ElMessageBox.confirm(
        "检测到您还未配置AI API，需要先配置API密钥才能使用AI功能。是否前往配置？",
        "需要配置API",
        {
          confirmButtonText: "去配置",
          cancelButtonText: "稍后配置",
          type: "warning",
        },
      )
        .then(() => {
          router.push("/config");
        })
        .catch(() => {});
      return false;
    }
    return true;
  };

  // 加载提示词
  const loadPrompts = () => {
    const savedPrompts = localStorage.getItem("prompts");
    if (savedPrompts) {
      try {
        availablePrompts.value = JSON.parse(savedPrompts);
      } catch (error) {
        console.error("加载提示词失败:", error);
        availablePrompts.value = getDefaultPrompts();
        savePrompts();
      }
    } else {
      availablePrompts.value = getDefaultPrompts();
      savePrompts();
    }
  };

  // 保存提示词
  const savePrompts = () => {
    localStorage.setItem("prompts", JSON.stringify(availablePrompts.value));
  };

  // 获取默认提示词
  const getDefaultPrompts = () => {
    return [
      {
        id: 1,
        title: "小说大纲生成器",
        category: "outline",
        description: "根据关键词和类型生成详细的小说大纲",
        content:
          "请为我创作一个{类型}小说的大纲，主题是{主题}，主角是{主角设定}。要求包含：\n1. 故事背景设定\n2. 主要人物介绍\n3. 核心冲突\n4. 章节大纲（至少10章）\n5. 结局走向",
        tags: ["大纲", "结构", "创作"],
        isDefault: true,
      },
      {
        id: 2,
        title: "基础章节生成器",
        category: "content",
        description: "基于章节大纲生成详细的正文内容",
        content:
          "请为小说《{小说标题}》的章节《{章节标题}》写正文内容。\n\n章节大纲：{章节大纲}\n\n要求：\n1. 字数控制在{目标字数}字左右\n2. 采用{写作视角}视角\n3. 包含丰富的对话、描写和细节\n4. 保持情节连贯性\n5. 突出{重点内容}",
        tags: ["正文", "章节", "基础生成"],
        isDefault: true,
      },
      {
        id: 6,
        title: "全素材章节生成器",
        category: "content",
        description: "结合人物、世界观、语料库等素材生成章节内容",
        content:
          "请为小说《{小说标题}》的章节《{章节标题}》写正文内容。\n\n章节大纲：{章节大纲}\n\n{主要人物}\n\n{世界观设定}\n\n{参考语料}\n\n{前文概要}\n\n创作要求：\n1. 字数控制在{目标字数}字左右\n2. 采用{写作视角}视角\n3. 突出重点：{重点内容}\n4. 充分运用提供的人物设定和世界观背景\n5. 参考语料库的写作风格和表达方式\n6. 与前文保持连贯性和一致性\n7. 包含丰富的对话、心理活动、环境描写",
        tags: ["全素材", "章节", "综合生成"],
        isDefault: true,
      },
      {
        id: 4,
        title: "智能续写助手",
        category: "continue",
        description: "基于现有内容进行智能续写",
        content:
          "请为小说《{小说标题}》的章节《{章节标题}》续写内容。\n\n当前已写内容：\n{当前内容}\n\n续写要求：\n1. 保持原有风格和语调\n2. 情节自然连贯\n3. 长度约{续写字数}字\n4. 推进剧情发展",
        tags: ["续写", "连贯", "发展"],
        isDefault: true,
      },
      {
        id: 3,
        title: "文本润色优化",
        category: "polish",
        description: "优化文本的表达和文采，提升阅读体验",
        content:
          "请帮我润色以下文本，要求：\n1. 保持原意不变\n2. 提升文采和表达力\n3. 优化句式结构\n4. 增强画面感\n\n原文：{原文内容}",
        tags: ["润色", "优化", "文采"],
        isDefault: true,
      },
    ];
  };

  // 选择提示词
  const selectPrompt = (prompt) => {
    selectedPrompt.value = prompt;
    // 提取变量
    const matches = prompt.content.match(/\{([^}]+)\}/g);
    promptVariables.value = {};
    if (matches) {
      matches.forEach((match) => {
        const variable = match.slice(1, -1);
        promptVariables.value[variable] = "";
      });
    }
    generateFinalPrompt();
  };

  // 生成最终提示词
  const generateFinalPrompt = () => {
    if (!selectedPrompt.value) {
      finalPrompt.value = "";
      return;
    }
    let result = selectedPrompt.value.content;
    Object.keys(promptVariables.value).forEach((variable) => {
      const value = promptVariables.value[variable] || `{${variable}}`;
      result = result.replace(new RegExp(`\\{${variable}\\}`, "g"), value);
    });
    finalPrompt.value = result;
  };

  // 构建生成上下文
  const buildGenerationContext = (novelInfo, materials) => {
    const context = [];

    // 人物信息
    if (materials.characters && materials.characters.length > 0) {
      context.push("=== 主要人物 ===");
      materials.characters.forEach((char) => {
        context.push(
          `【${char.name}】${char.role || "角色"} | ${char.gender || ""} | ${char.age || ""}岁 | ${char.personality || ""} | ${char.background || ""}`,
        );
      });
      context.push("");
    }

    // 世界观设定
    if (materials.worldSettings && materials.worldSettings.length > 0) {
      context.push("=== 世界观设定 ===");
      materials.worldSettings.forEach((setting) => {
        context.push(`【${setting.title}】${setting.description || ""}`);
      });
      context.push("");
    }

    // 语料库
    if (materials.corpus && materials.corpus.length > 0) {
      context.push("=== 参考语料 ===");
      materials.corpus.slice(0, 5).forEach((item) => {
        context.push(`- ${item.content || item.title}`);
      });
      context.push("");
    }

    // 事件线
    if (materials.events && materials.events.length > 0) {
      context.push("=== 重要事件 ===");
      materials.events.slice(0, 5).forEach((event) => {
        context.push(`- ${event.title}: ${event.description || ""}`);
      });
      context.push("");
    }

    return context.join("\n");
  };

  // 构建章节内容生成提示词
  const buildContentPrompt = (chapter, context, novelInfo, config) => {
    const wordCount = config?.wordCount || 2000;
    const style = config?.style || "third-person";
    const focus = config?.focus || "情节发展";

    let prompt = `=== 小说基本信息 ===\n`;
    prompt += `小说标题：${novelInfo?.title || "未命名小说"}\n`;
    prompt += `小说类型：${getChineseGenre(novelInfo?.genre)}\n`;
    prompt += `小说简介：${novelInfo?.description || "暂无简介"}\n\n`;

    prompt += `=== 当前章节信息 ===\n`;
    prompt += `章节标题：${chapter?.title || "未命名章节"}\n`;
    prompt += `章节大纲：${chapter?.description || "暂无大纲"}\n\n`;

    if (context) {
      prompt += `=== 参考素材 ===\n${context}\n`;
    }

    prompt += `=== 正文生成要求 ===\n`;
    prompt += `1. 字数控制在${wordCount}字左右\n`;
    prompt += `2. 采用${style === "third-person" ? "第三人称" : "第一人称"}视角\n`;
    prompt += `3. 包含丰富的对话、动作、心理和场景描写\n`;
    prompt += `4. 突出重点：${focus}\n`;
    prompt += `5. 保持与前文的连贯性\n`;
    prompt += `6. 适当制造情节起伏和悬念\n\n`;
    prompt += `请开始生成正文内容：`;

    return prompt;
  };

  // 格式化生成的内容
  const formatGeneratedContent = (content, chapterTitle) => {
    let formatted = content.replace(/\n\n/g, "</p><p>");
    formatted = `<p>${formatted}</p>`;
    formatted = formatted.replace(/<p><br\/>/g, "<p>");
    return formatted;
  };

  // 解析章节响应（5种策略）
  const parseChapterResponse = (aiResponse) => {
    const chapters = [];

    // 策略1: 匹配 "章节X：" 格式
    const pattern1 =
      /(?:章节|第)([一二三四五六七八九十百千万\d]+)[：:]\s*\n*(?:标题[：:]\s*)?(.+?)\s*\n*(?:大纲[：:]\s*)?([\s\S]*?)(?=(?:章节|第)([一二三四五六七八九十百千万\d]+)[：:]|$)/g;
    let match;
    while ((match = pattern1.exec(aiResponse)) !== null) {
      const title = match[2].trim();
      const description = match[3].trim();
      if (title && description) {
        chapters.push({ title, description });
      }
    }

    // 策略2: 匹配 "标题：xxx" 和 "大纲：xxx" 格式
    if (chapters.length === 0) {
      const pattern2 =
        /标题[：:]\s*(.+?)\s*(?:[\n\r]+)大纲[：:]\s*([\s\S]*?)(?=\n*(?:标题[：:]|$(?=\n)))/g;
      while ((match = pattern2.exec(aiResponse)) !== null) {
        const title = match[1].trim();
        const description = match[2].trim();
        if (title && description) {
          chapters.push({ title, description });
        }
      }
    }

    // 策略3: 匹配数字编号格式 "1. xxx"
    if (chapters.length === 0) {
      const pattern3 = /(\d+)[\.、]\s*(.+?)\s*\n([\s\S]*?)(?=\d+[\.、]|$)/g;
      while ((match = pattern3.exec(aiResponse)) !== null) {
        const title = match[2].trim();
        const description = match[3].trim();
        if (title && description) {
          chapters.push({ title, description });
        }
      }
    }

    // 策略4: 按换行分割
    if (chapters.length === 0) {
      const lines = aiResponse.split(/\n\n+/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 20) {
          const firstLine = trimmed.split("\n")[0].trim();
          const rest = trimmed.split("\n").slice(1).join("\n").trim();
          if (firstLine && rest) {
            chapters.push({ title: firstLine, description: rest });
          }
        }
      }
    }

    // 策略5: 整块内容作为一个章节
    if (chapters.length === 0 && aiResponse.trim().length > 50) {
      chapters.push({
        title: "AI生成章节",
        description: aiResponse.trim(),
      });
    }

    return chapters;
  };

  // 生成正文内容
  const generateContent = async (
    chapter,
    novelInfo,
    materials,
    config,
    callbacks = {},
  ) => {
    if (!checkApiConfig()) return null;

    isGeneratingContent.value = true;
    isStreaming.value = true;
    streamingType.value = "content";
    streamingContent.value = "";

    try {
      const context = buildGenerationContext(novelInfo, materials);
      const prompt = buildContentPrompt(chapter, context, novelInfo, config);

      const response = await apiService.generateTextStream(
        prompt,
        {
          maxTokens: null,
          temperature: 0.8,
          type: "generation",
        },
        (chunk, fullContent) => {
          streamingContent.value = fullContent;
          if (callbacks.onChunk) {
            callbacks.onChunk(chunk, fullContent);
          }
        },
      );

      if (!response.trim()) {
        throw new Error("AI返回内容为空");
      }

      const formattedContent = formatGeneratedContent(response, chapter?.title);

      if (callbacks.onComplete) {
        callbacks.onComplete(formattedContent);
      }

      ElMessage.success("正文生成成功");
      return formattedContent;
    } catch (error) {
      console.error("AI生成正文失败:", error);
      ElMessage.error(`正文生成失败: ${error.message}`);
      return null;
    } finally {
      isGeneratingContent.value = false;
      isStreaming.value = false;
      streamingContent.value = "";
    }
  };

  // 优化文本
  const optimizeText = async (content, optimizeType, callbacks = {}) => {
    if (!checkApiConfig()) return null;

    isOptimizing.value = true;
    isStreaming.value = true;
    streamingType.value = "optimize";
    streamingContent.value = "";

    try {
      const optimizeInstructions = {
        grammar:
          "检查并修正语法错误、错别字、标点符号问题；优化句式结构，使表达更加流畅；保持原文的意思和风格不变",
        style:
          "优化文字表达，使语言更加优美流畅；增强文字的感染力和表现力；统一文章的语言风格",
        emotion:
          "加强情感描写，使情感表达更加深刻；增加心理描写和情感细节；提升读者的情感共鸣",
        logic:
          "梳理故事情节的逻辑关系；检查人物行为的合理性；优化情节发展的连贯性",
      };

      const prompt = `请对以下小说内容进行${optimizeType === "grammar" ? "语法润色" : optimizeType === "style" ? "文风优化" : optimizeType === "emotion" ? "情感增强" : "逻辑梳理"}。

原文内容：
${content.replace(/<[^>]*>/g, "")}

优化要求：
${optimizeInstructions[optimizeType] || optimizeInstructions.grammar}

请返回优化后的内容：`;

      const response = await apiService.generateTextStream(
        prompt,
        {
          maxTokens: null,
          temperature: 0.3,
          type: "polish",
        },
        (chunk, fullContent) => {
          streamingContent.value = fullContent;
          if (callbacks.onChunk) {
            callbacks.onChunk(chunk, fullContent);
          }
        },
      );

      if (!response.trim()) {
        throw new Error("AI返回内容为空");
      }

      if (callbacks.onComplete) {
        callbacks.onComplete(response);
      }

      ElMessage.success("文本优化完成");
      return response;
    } catch (error) {
      console.error("AI文本优化失败:", error);
      ElMessage.error(`文本优化失败: ${error.message}`);
      return null;
    } finally {
      isOptimizing.value = false;
      isStreaming.value = false;
      streamingContent.value = "";
    }
  };

  // 续写内容
  const continueWriting = async (
    chapter,
    content,
    direction,
    wordCount,
    callbacks = {},
  ) => {
    if (!checkApiConfig()) return null;

    isGeneratingContent.value = true;
    isStreaming.value = true;
    streamingType.value = "continue";
    streamingContent.value = "";

    try {
      const prompt = `请为小说章节续写内容。

章节标题：${chapter?.title || "未命名章节"}

当前已写内容：
${content.replace(/<[^>]*>/g, "")}

续写要求：
1. 长度约${wordCount || 500}字
2. 方向：${direction || "推进情节发展"}
3. 保持原有风格和语调
4. 自然衔接前文

请开始续写：`;

      const response = await apiService.generateTextStream(
        prompt,
        {
          maxTokens: null,
          temperature: 0.8,
          type: "continue",
        },
        (chunk, fullContent) => {
          streamingContent.value = fullContent;
          if (callbacks.onChunk) {
            callbacks.onChunk(chunk, fullContent);
          }
        },
      );

      if (!response.trim()) {
        throw new Error("AI返回内容为空");
      }

      if (callbacks.onComplete) {
        callbacks.onComplete(response);
      }

      ElMessage.success("续写完成");
      return response;
    } catch (error) {
      console.error("AI续写失败:", error);
      ElMessage.error(`续写失败: ${error.message}`);
      return null;
    } finally {
      isGeneratingContent.value = false;
      isStreaming.value = false;
      streamingContent.value = "";
    }
  };

  // 停止流式生成
  const stopStreaming = () => {
    isStreaming.value = false;
    isGeneratingContent.value = false;
    isGeneratingChapters.value = false;
    isOptimizing.value = false;
    streamingContent.value = "";
    streamingType.value = "";
    ElMessage.info("已停止AI生成");
  };

  // 获取前文章节详情
  const getRecentChaptersDetail = (chapters, count = 5) => {
    if (!chapters || chapters.length === 0) return "暂无前文章节";

    const recentChapters = chapters.slice(-count);
    return recentChapters
      .map(
        (ch, idx) =>
          `第${chapters.indexOf(ch) + 1}章：${ch.title} - ${ch.description || "暂无描述"}`,
      )
      .join("\n");
  };

  // 生成章节大纲（AI辅助）
  const isGeneratingOutline = ref(false);
  const generateChapterOutline = async (description, novelInfo) => {
    if (!checkApiConfig()) return null;
    isGeneratingOutline.value = true;
    try {
      const prompt = `为小说《${novelInfo?.title || ""}》的章节生成详细大纲。

已有描述：${description || "暂无"}

请根据以上信息，生成一个完整的章节大纲，要求：
1. 包含章节的核心情节
2. 明确关键场景
3. 列出主要人物互动
4. 预留悬念或转折点

请直接输出大纲内容：`;

      let result = "";
      await apiService.generateTextStream(
        prompt,
        {
          maxTokens: 500,
          temperature: 0.7,
          type: "outline",
        },
        (chunk) => {
          result += chunk;
        },
      );
      return result;
    } catch (error) {
      console.error("生成章节大纲失败:", error);
      ElMessage.error(`生成大纲失败: ${error.message}`);
      return null;
    } finally {
      isGeneratingOutline.value = false;
    }
  };

  // 生成世界观描述
  const generateWorldDescription = async (title, novelInfo) => {
    if (!checkApiConfig()) return null;
    try {
      const prompt = `为小说《${novelInfo?.title || ""}》的世界观设定「${title}」生成详细描述。

请生成一段详细的世界观描述，包含：
1. 设定背景
2. 主要特征
3. 在故事中的作用

请直接输出描述内容：`;

      let result = "";
      await apiService.generateTextStream(
        prompt,
        {
          maxTokens: 800,
          temperature: 0.7,
          type: "worldview",
        },
        (chunk) => {
          result += chunk;
        },
      );
      return result;
    } catch (error) {
      console.error("生成世界观描述失败:", error);
      ElMessage.error(`生成世界观描述失败: ${error.message}`);
      return null;
    }
  };

  return {
    // 状态
    isGeneratingContent,
    isGeneratingChapters,
    isGeneratingOutline,
    isOptimizing,
    isStreaming,
    streamingContent,
    streamingType,
    showPromptDialog,
    selectedPromptCategory,
    availablePrompts,
    selectedPrompt,
    promptVariables,
    finalPrompt,
    showChapterGenerateDialog,
    selectedMaterials,
    selectedContextChapters,
    generateConfig,
    // 注意：contentCategories 已移除（定义后未被使用）

    // 方法
    checkApiConfig,
    loadPrompts,
    savePrompts,
    getDefaultPrompts,
    selectPrompt,
    generateFinalPrompt,
    buildGenerationContext,
    buildContentPrompt,
    formatGeneratedContent,
    parseChapterResponse,
    generateContent,
    optimizeText,
    continueWriting,
    stopStreaming,
    getRecentChaptersDetail,
    getChineseGenre,
    generateChapterOutline,
    generateWorldDescription,
  };
};

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiService from "../services/api.js";
import storage from "../services/storage.js";

export const useNovelStore = defineStore("novel", () => {
  // 状态
  const currentNovel = ref("");
  const generatedContent = ref("");
  const isGenerating = ref(false);
  const corpus = ref([]);

  // 写作工具数据
  const characters = ref([]);
  const worldSettings = ref([]);

  // API配置 - 分离官方和自定义配置
  const officialApiConfig = ref({
    apiKey: "",
    baseURL: "https://ai.91hub.vip/v1",
    selectedModel: "claude-4-sonnet",
    maxTokens: 2000000,
    unlimitedTokens: false,
    temperature: 0.7,
  });

  const customApiConfig = ref({
    apiKey: "",
    baseURL: "https://api.openai.com/v1",
    selectedModel: "gpt-3.5-turbo",
    maxTokens: 2000000,
    unlimitedTokens: false,
    temperature: 0.7,
  });

  const currentConfigType = ref("official"); // 'official' 或 'custom'
  const isApiConfigured = ref(false);

  // 获取当前活动的API配置
  const getCurrentApiConfig = () => {
    return currentConfigType.value === "official"
      ? officialApiConfig.value
      : customApiConfig.value;
  };

  // 初始化时检查API配置
  const initializeApiConfig = async () => {
    try {
      // 加载配置类型
      const savedType = await storage.get("apiConfigType", "official");
      currentConfigType.value = savedType;

      // 加载官方配置
      const savedOfficial = await storage.get("officialApiConfig");
      if (savedOfficial) {
        const config = savedOfficial;
        // 官方配置只允许覆盖API密钥等参数，baseURL始终保持固定
        officialApiConfig.value = {
          ...officialApiConfig.value,
          ...config,
          baseURL: "https://ai.91hub.vip/v1", // 强制保持官方地址
        };
      }

      // 加载自定义配置
      const savedCustom = await storage.get("customApiConfig");
      if (savedCustom) {
        const config = savedCustom;
        customApiConfig.value = { ...customApiConfig.value, ...config };
      }

      // 使用当前配置类型的配置
      const currentConfig = getCurrentApiConfig();
      isApiConfigured.value = !!currentConfig.apiKey;
      apiService.updateConfig(currentConfig);
    } catch (error) {
      console.error("初始化API配置失败:", error);
    }
  };

  // 立即执行初始化
  initializeApiConfig();

  // 摘要功能
  const articleSummary = ref("");
  const isGeneratingSummary = ref(false);

  // 写作建议
  const writingAdvice = ref("");
  const isGeneratingAdvice = ref(false);

  // 文章统计信息
  const articleStats = ref({
    wordCount: 0,
    readingTime: 0,
    sentiment: "",
    tags: [],
    category: "",
    score: 0,
  });

  // 计算属性
  const wordCount = computed(() => {
    // 去除HTML标签，计算纯文本字数，与文章统计保持一致
    return currentNovel.value.replace(/<[^>]*>/g, "").length;
  });

  const readingTime = computed(() => {
    // 按照每分钟200字的阅读速度计算
    return Math.ceil(wordCount.value / 200);
  });

  // 方法
  const setCurrentNovel = async (content) => {
    currentNovel.value = content;
    await updateStats();
  };

  const addCorpus = (text) => {
    corpus.value.push({
      id: Date.now(),
      content: text,
      createdAt: new Date().toISOString(),
    });
  };

  const removeCorpus = (id) => {
    const index = corpus.value.findIndex((item) => item.id === id);
    if (index > -1) {
      corpus.value.splice(index, 1);
    }
  };

  const updateStats = async () => {
    // 从HTML中提取纯文本进行统计
    const content = currentNovel.value.replace(/<[^>]*>/g, "");

    // 基础统计（立即更新）
    articleStats.value = {
      wordCount: content.length,
      readingTime: Math.ceil(content.length / 200),
      sentiment: analyzeSentiment(content),
      tags: generateTags(content),
      category: categorizeContent(content),
      score: calculateScore(content),
    };

    // 如果配置了API且内容足够长，使用AI进行深度分析
    if (isApiConfigured.value && content.length > 100) {
      try {
        await updateStatsWithAI(content);
      } catch (error) {
        console.log("AI分析失败，使用本地分析结果:", error.message);
      }
    }
  };

  // 使用AI进行深度文章分析
  const updateStatsWithAI = async (content) => {
    try {
      const analysis = await apiService.analyzeArticle(content);

      // 更新AI分析结果
      articleStats.value = {
        ...articleStats.value,
        sentiment: analysis.sentiment || articleStats.value.sentiment,
        tags: analysis.tags || articleStats.value.tags,
        category: analysis.category || articleStats.value.category,
        score: analysis.score || articleStats.value.score,
        aiAnalysis: analysis, // 保存完整的AI分析结果
      };
    } catch (error) {
      console.error("AI文章分析失败:", error);
      throw error;
    }
  };

  // API配置方法
  const updateApiConfig = (config, configType = null) => {
    // 如果没有指定类型，使用当前配置类型
    const targetType = configType || currentConfigType.value;

    if (targetType === "official") {
      // 官方配置：强制保持官方API地址
      officialApiConfig.value = {
        ...officialApiConfig.value,
        ...config,
        baseURL: "https://ai.91hub.vip/v1",
      };
    } else {
      // 自定义配置：允许所有参数更新
      customApiConfig.value = { ...customApiConfig.value, ...config };
    }

    // 更新apiService配置为当前活动配置
    const currentConfig = getCurrentApiConfig();
    apiService.updateConfig(currentConfig);
    isApiConfigured.value = !!currentConfig.apiKey;
  };

  // 切换配置类型
  const switchConfigType = async (type) => {
    currentConfigType.value = type;
    await storage.set("apiConfigType", type);

    // 更新apiService配置
    const currentConfig = getCurrentApiConfig();
    apiService.updateConfig(currentConfig);
    isApiConfigured.value = !!currentConfig.apiKey;
  };

  const validateApiKey = async () => {
    try {
      const isValid = await apiService.validateAPIKey();
      isApiConfigured.value = isValid;
      return isValid;
    } catch (error) {
      console.error("API密钥验证失败:", error);
      isApiConfigured.value = false;
      return false;
    }
  };

  // 摘要相关方法
  const setGeneratingSummary = (status) => {
    isGeneratingSummary.value = status;
  };

  const setArticleSummary = (summary) => {
    articleSummary.value = summary;
  };

  // 生成文章摘要
  const generateSummaryWithAPI = async (options = {}) => {
    if (!isApiConfigured.value) {
      throw new Error("请先配置API密钥");
    }

    if (!currentNovel.value) {
      throw new Error("请先输入文章内容");
    }

    isGeneratingSummary.value = true;
    try {
      const content = currentNovel.value.replace(/<[^>]*>/g, "");
      const summary = await apiService.generateSummary(content, options);
      articleSummary.value = summary;
      return summary;
    } catch (error) {
      console.error("生成摘要失败:", error);
      throw error;
    } finally {
      isGeneratingSummary.value = false;
    }
  };

  // 获取写作建议
  const getWritingAdviceWithAPI = async () => {
    if (!isApiConfigured.value) {
      throw new Error("请先配置API密钥");
    }

    if (!currentNovel.value) {
      throw new Error("请先输入文章内容");
    }

    isGeneratingAdvice.value = true;
    try {
      const content = currentNovel.value.replace(/<[^>]*>/g, "");
      const advice = await apiService.getWritingAdvice(content);
      writingAdvice.value = advice;
      return advice;
    } catch (error) {
      console.error("获取写作建议失败:", error);
      throw error;
    } finally {
      isGeneratingAdvice.value = false;
    }
  };

  // 基于语料库生成个性化内容
  const generatePersonalizedContent = async (prompt) => {
    if (!isApiConfigured.value) {
      throw new Error("请先配置API密钥");
    }

    if (corpus.value.length === 0) {
      throw new Error("请先添加语料库内容");
    }

    setGenerating(true);
    try {
      const result = await apiService.generatePersonalizedContent(
        prompt,
        corpus.value,
      );
      setGeneratedContent(result);
      return result;
    } catch (error) {
      console.error("生成个性化内容失败:", error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  // 语料库管理
  const addCorpusFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        addCorpus(content);
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const exportCorpus = () => {
    const data = JSON.stringify(corpus.value, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corpus.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCorpus = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          corpus.value = data;
          resolve(data);
        } catch (error) {
          reject(new Error("语料库文件格式错误"));
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // 简单的情感分析
  const analyzeSentiment = (content) => {
    const positiveWords = [
      "快乐",
      "幸福",
      "美好",
      "成功",
      "胜利",
      "爱",
      "喜欢",
    ];
    const negativeWords = [
      "悲伤",
      "痛苦",
      "失败",
      "死亡",
      "恐惧",
      "愤怒",
      "绝望",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      positiveCount += (content.match(new RegExp(word, "g")) || []).length;
    });

    negativeWords.forEach((word) => {
      negativeCount += (content.match(new RegExp(word, "g")) || []).length;
    });

    if (positiveCount > negativeCount) return "积极";
    if (negativeCount > positiveCount) return "消极";
    return "中性";
  };

  // 生成标签
  const generateTags = (content) => {
    const tags = [];
    if (content.includes("修仙") || content.includes("仙人")) tags.push("修仙");
    if (content.includes("爱情") || content.includes("恋人")) tags.push("爱情");
    if (content.includes("悬疑") || content.includes("推理")) tags.push("悬疑");
    if (content.includes("科幻") || content.includes("未来")) tags.push("科幻");
    if (content.includes("古代") || content.includes("穿越")) tags.push("古代");
    return tags;
  };

  // 内容分类
  const categorizeContent = (content) => {
    if (content.includes("修仙") || content.includes("异世界")) return "玄幻";
    if (content.includes("都市") || content.includes("现代")) return "都市";
    if (content.includes("悬疑") || content.includes("推理")) return "悬疑";
    if (content.includes("科幻") || content.includes("未来")) return "科幻";
    if (content.includes("古代") || content.includes("历史")) return "历史";
    return "其他";
  };

  // 计算文章评分
  const calculateScore = (content) => {
    let score = 50; // 基础分

    // 根据字数调整分数
    if (content.length > 1000) score += 10;
    if (content.length > 3000) score += 10;
    if (content.length > 5000) score += 10;

    // 根据段落数调整分数
    const paragraphs = content.split("\n\n").filter((p) => p.trim());
    if (paragraphs.length > 3) score += 5;
    if (paragraphs.length > 6) score += 5;

    // 根据对话调整分数
    const dialogues = (content.match(/[""]/g) || []).length;
    if (dialogues > 4) score += 5;

    return Math.min(100, score);
  };

  // 人物管理方法
  const addCharacter = (character) => {
    characters.value.push({
      id: Date.now(),
      ...character,
      traits: character.traitsInput
        ? character.traitsInput
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : [],
    });
  };

  const removeCharacter = (id) => {
    characters.value = characters.value.filter((char) => char.id !== id);
  };

  // 世界观设定管理方法
  const addWorldSetting = (setting) => {
    // 生成唯一ID，避免快速操作时ID重复
    const generateUniqueId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return timestamp + random;
    };

    worldSettings.value.push({
      id: generateUniqueId(),
      ...setting,
    });
  };

  const removeWorldSetting = (id) => {
    worldSettings.value = worldSettings.value.filter(
      (setting) => setting.id !== id,
    );
  };

  const updateWorldSetting = (id, updatedSetting) => {
    const index = worldSettings.value.findIndex((setting) => setting.id === id);
    if (index > -1) {
      worldSettings.value[index] = {
        ...worldSettings.value[index],
        ...updatedSetting,
      };
    }
  };

  // 通用内容生成方法
  const generateContent = async (prompt, onChunk = null) => {
    if (!isApiConfigured.value) {
      throw new Error("请先配置API");
    }

    try {
      isGenerating.value = true;

      // 如果提供了onChunk回调，使用流式API
      if (onChunk) {
        const result = await apiService.generateTextStream(
          prompt,
          {
            type: "content_generation",
          },
          (chunk, fullContent) => {
            onChunk(chunk);
          },
        );

        return result;
      } else {
        // 否则使用流式API（不提供回调）
        const result = await apiService.generateTextStream(
          prompt,
          {
            type: "content_generation",
          },
          null,
        );

        return result;
      }
    } catch (error) {
      console.error("生成内容失败:", error);
      throw error;
    } finally {
      isGenerating.value = false;
    }
  };

  return {
    // 状态
    currentNovel,
    generatedContent,
    isGenerating,
    corpus,
    characters,
    worldSettings,
    articleStats,
    officialApiConfig,
    customApiConfig,
    currentConfigType,
    isApiConfigured,
    articleSummary,
    isGeneratingSummary,
    writingAdvice,
    isGeneratingAdvice,

    // 计算属性
    wordCount,
    readingTime,

    // 方法
    setCurrentNovel,
    addCorpus,
    removeCorpus,
    addCharacter,
    removeCharacter,
    addWorldSetting,
    removeWorldSetting,
    updateWorldSetting,
    updateStats,

    // API相关方法
    updateApiConfig,
    switchConfigType,
    getCurrentApiConfig,
    validateApiKey,
    generateSummaryWithAPI,
    getWritingAdviceWithAPI,
    generatePersonalizedContent,
    addCorpusFromFile,
    exportCorpus,
    importCorpus,
    setGeneratingSummary,
    setArticleSummary,
    generateContent,
  };
});

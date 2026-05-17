/**
 * Writer事件处理Composable - 管理所有视图级事件处理逻辑
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

export const useWriterHandlers = (options = {}) => {
  const {
    chapterListState,
    characterState,
    worldState,
    corpusState,
    eventState,
    editorState,
    aiState,
    viewState, // useWriterView 实例，提供 saveNovelData
  } = options;

  // ============ 续写对话框状态 ============
  const showContinueDialog = ref(false);
  const isContinueStreaming = ref(false);
  const continueStreamingContent = ref("");

  // ============ 优化对话框状态 ============
  const showOptimizeDialog = ref(false);
  const isOptimizeStreaming = ref(false);
  const optimizeStreamingContent = ref("");
  const optimizedContent = ref("");

  // ============ 提示词相关 ============
  const batchCharacterPromptTitle = ref("");
  const worldPromptTitle = ref("");

  // ============ 章节相关 ============
  const onSelectChapter = (chapter) => {
    chapterListState.selectChapter(chapter);
    editorState.setContent(chapter.content || "");
  };

  const onChapterAction = (action, chapter) => {
    if (action === "edit") {
      chapterListState.editChapterTitle(chapter);
    } else if (action === "generate") {
      chapterListState.selectChapter(chapter);
      aiState.showChapterGenerateDialog.value = true;
    } else if (action === "delete") {
      ElMessageBox.confirm("确定要删除该章节吗？", "提示", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          chapterListState.deleteChapter(chapter);
          viewState.saveNovelData();
          ElMessage.success("删除成功");
        })
        .catch(() => {});
    }
  };

  const onChapterCommand = (command) => {
    if (command === "manual") chapterListState.addNewChapter();
  };

  const onSaveChapter = (form) => {
    const result = chapterListState.saveChapter(form);
    chapterListState.showChapterDialog = false;
    viewState.saveNovelData();
    if (result?.autoSelect) editorState.setContent("");
    ElMessage.success("保存成功");
  };

  const onGenerateChapterOutline = async () => {
    if (!aiState.checkApiConfig()) return;
    try {
      const result = await aiState.generateChapterOutline(
        chapterListState.chapterForm.value?.description || "",
        viewState.currentNovel.value,
      );
      if (result) chapterListState.chapterForm.value.description = result;
    } catch (error) {
      console.error("生成大纲失败:", error);
      ElMessage.error("生成大纲失败");
    }
  };

  const onUpdateChapterStatus = (status) => {
    if (chapterListState.currentChapter.value) {
      chapterListState.updateChapterStatus(status);
      viewState.saveNovelData();
    }
  };

  // ============ 角色相关 ============
  const onCharacterAction = (action, character) => {
    if (action === "edit") {
      characterState.editCharacter(character);
    } else if (action === "delete") {
      ElMessageBox.confirm("确定要删除该角色吗？", "提示", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          characterState.deleteCharacter(character);
          viewState.saveNovelData();
          ElMessage.success("删除成功");
        })
        .catch(() => {});
    }
  };

  const onSaveCharacter = (form) => {
    if (characterState.editingCharacter.value) {
      characterState.saveCharacter(form);
    } else {
      characterState.addCharacter(form);
    }
    characterState.showCharacterDialog.value = false;
    viewState.saveNovelData();
    ElMessage.success("保存成功");
  };

  const onBatchGenerateCharacters = async (config) => {
    if (!aiState.checkApiConfig()) return;
    characterState.batchGenerating.value = true;
    characterState.generatedCharacters.value = [];
    try {
      await characterState.batchGenerateCharacters(
        config,
        viewState.currentNovel.value,
        aiState,
      );
    } catch (error) {
      console.error("批量生成角色失败:", error);
      ElMessage.error("批量生成角色失败");
    } finally {
      characterState.batchGenerating.value = false;
    }
  };

  const onConfirmAddCharacters = (characters) => {
    const selected = characters.filter((c) => c.selected !== false);
    characterState.addGeneratedCharacters(selected);
    characterState.showBatchGenerateCharacterDialog.value = false;
    characterState.generatedCharacters.value = [];
    viewState.saveNovelData();
    ElMessage.success(`成功添加 ${selected.length} 个角色`);
  };

  const onSelectBatchCharacterPrompt = () => {
    aiState.selectedPromptCategory.value = "character";
    aiState.showPromptDialog.value = true;
  };

  const onClearBatchCharacterPrompt = () => {
    characterState.batchCharacterSelectedPrompt.value = null;
    batchCharacterPromptTitle.value = "";
  };

  // ============ 世界观相关 ============
  const onWorldAction = (action, setting) => {
    if (action === "edit") {
      worldState.editWorldSetting(setting);
    } else if (action === "duplicate") {
      worldState.duplicateWorldSetting(setting);
      viewState.saveNovelData();
      ElMessage.success("复制成功");
    } else if (action === "delete") {
      ElMessageBox.confirm("确定要删除该设定吗？", "提示", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          worldState.deleteWorldSetting(setting);
          viewState.saveNovelData();
          ElMessage.success("删除成功");
        })
        .catch(() => {});
    }
  };

  const onSaveWorld = (form) => {
    if (worldState.editingWorldSetting.value) {
      worldState.saveWorldSetting(form);
    } else {
      worldState.addWorldSetting(form);
    }
    worldState.showWorldDialog.value = false;
    viewState.saveNovelData();
    ElMessage.success("保存成功");
  };

  const onGenerateWorldDescription = async () => {
    if (!aiState.checkApiConfig()) return;
    try {
      const result = await aiState.generateWorldDescription(
        worldState.worldForm.value?.title || "",
        viewState.currentNovel.value,
      );
      if (result) worldState.worldForm.value.description = result;
    } catch (error) {
      console.error("生成世界观描述失败:", error);
      ElMessage.error("生成世界观描述失败");
    }
  };

  const onGenerateWorldSettings = async (config) => {
    if (!aiState.checkApiConfig()) return;
    worldState.worldGenerating.value = true;
    worldState.generatedWorldSettings.value = [];
    try {
      await worldState.batchGenerateWorldSettings(
        config,
        viewState.currentNovel.value,
        aiState,
      );
    } catch (error) {
      console.error("生成世界观设定失败:", error);
      ElMessage.error("生成世界观设定失败");
    } finally {
      worldState.worldGenerating.value = false;
    }
  };

  const onConfirmAddWorldSettings = (settings) => {
    const selected = settings.filter((s) => s.selected !== false);
    worldState.addGeneratedWorldSettings(selected);
    worldState.showWorldGenerateDialog.value = false;
    worldState.generatedWorldSettings.value = [];
    viewState.saveNovelData();
    ElMessage.success(`成功添加 ${selected.length} 个设定`);
  };

  const onSelectWorldPrompt = () => {
    aiState.selectedPromptCategory.value = "worldview";
    aiState.showPromptDialog.value = true;
  };

  const onClearWorldPrompt = () => {
    worldState.worldSettingSelectedPrompt.value = null;
    worldPromptTitle.value = "";
  };

  // ============ 语料相关 ============
  const onSaveCorpus = (form) => {
    if (corpusState.editingCorpus.value) {
      corpusState.saveCorpus(form);
    } else {
      corpusState.addCorpus(form);
    }
    corpusState.showCorpusDialog.value = false;
    viewState.saveNovelData();
    ElMessage.success("保存成功");
  };

  // ============ 事件相关 ============
  const onEventAction = (action, eventItem) => {
    if (action === "edit") {
      eventState.editEvent(eventItem);
    } else if (action === "delete") {
      ElMessageBox.confirm("确定要删除该事件吗？", "提示", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          eventState.deleteEvent(eventItem);
          viewState.saveNovelData();
          ElMessage.success("删除成功");
        })
        .catch(() => {});
    }
  };

  const onSaveEvent = (form) => {
    if (eventState.editingEvent.value) {
      eventState.saveEvent(form);
    } else {
      eventState.addEvent(form);
    }
    eventState.showEventDialog.value = false;
    viewState.saveNovelData();
    ElMessage.success("保存成功");
  };

  // ============ AI生成 - 章节内容 ============
  const onGenerateFromOutline = () => {
    if (!chapterListState.currentChapter.value?.description) {
      ElMessage.warning("请先填写章节大纲");
      return;
    }
    aiState.showChapterGenerateDialog.value = true;
  };

  const onChapterGenerate = async ({ config, materials }) => {
    if (!aiState.checkApiConfig()) return;
    if (!chapterListState.currentChapter.value) {
      ElMessage.warning("请先选择一个章节");
      return;
    }
    const chapter = chapterListState.currentChapter.value;
    const novelInfo = viewState.currentNovel.value;
    const mergedMaterials = {
      ...materials,
      characters: characterState.characters.value,
      worldSettings: worldState.worldSettings.value,
      corpus: corpusState.corpusData.value,
      events: eventState.events.value,
    };
    let accumulated = "";
    try {
      await aiState.generateContent(
        chapter,
        novelInfo,
        mergedMaterials,
        config,
        {
          onChunk: (chunk) => {
            accumulated += chunk;
            chapterListState.updateChapterContent(accumulated, chapter);
          },
        },
      );
      editorState.setContent(accumulated);
      aiState.showChapterGenerateDialog.value = false;
      viewState.saveNovelData();
      ElMessage.success("章节内容生成完成");
    } catch (error) {
      console.error("生成章节内容失败:", error);
      ElMessage.error("生成章节内容失败");
    }
  };

  // ============ 续写 ============
  const openContinueDialog = () => {
    if (!chapterListState.currentChapter.value) {
      ElMessage.warning("请先选择一个章节");
      return;
    }
    showContinueDialog.value = true;
    isContinueStreaming.value = false;
    continueStreamingContent.value = "";
  };

  const closeContinueDialog = () => {
    showContinueDialog.value = false;
    continueStreamingContent.value = "";
    isContinueStreaming.value = false;
  };

  const onContinueWriting = async ({ direction, wordCount }) => {
    if (!aiState.checkApiConfig()) return;
    if (!chapterListState.currentChapter.value) {
      ElMessage.warning("请先选择一个章节");
      return;
    }
    isContinueStreaming.value = true;
    continueStreamingContent.value = "";
    const chapter = chapterListState.currentChapter.value;
    const currentContent = chapter.content || "";
    let accumulated = "";
    try {
      await aiState.continueWriting(
        chapter,
        currentContent,
        direction,
        wordCount,
        {
          onChunk: (chunk) => {
            accumulated += chunk;
            continueStreamingContent.value = accumulated;
          },
        },
      );
      const newContent = currentContent + accumulated;
      chapterListState.updateChapterContent(newContent, chapter);
      editorState.setContent(newContent);
      viewState.saveNovelData();
      ElMessage.success("续写完成");
    } catch (error) {
      console.error("续写失败:", error);
      ElMessage.error("续写失败");
    } finally {
      isContinueStreaming.value = false;
    }
  };

  const onStopContinue = () => {
    aiState.stopStreaming();
    isContinueStreaming.value = false;
  };

  // ============ 内容优化 ============
  const onEnhanceContent = () => {
    if (!chapterListState.currentChapter.value?.content) {
      ElMessage.warning("当前章节没有内容可优化");
      return;
    }
    showOptimizeDialog.value = true;
    isOptimizeStreaming.value = false;
    optimizeStreamingContent.value = "";
    optimizedContent.value = "";
  };

  const closeOptimizeDialog = () => {
    showOptimizeDialog.value = false;
    optimizeStreamingContent.value = "";
    optimizedContent.value = "";
  };

  const onOptimizeContent = async ({ optimizeType }) => {
    if (!aiState.checkApiConfig()) return;
    isOptimizeStreaming.value = true;
    optimizeStreamingContent.value = "";
    let accumulated = "";
    try {
      await aiState.optimizeText(
        chapterListState.currentChapter.value?.content || "",
        optimizeType,
        {
          onChunk: (chunk) => {
            accumulated += chunk;
            optimizeStreamingContent.value = accumulated;
          },
        },
      );
      optimizedContent.value = accumulated;
    } catch (error) {
      console.error("优化失败:", error);
      ElMessage.error("内容优化失败");
    } finally {
      isOptimizeStreaming.value = false;
    }
  };

  const onStopOptimize = () => {
    aiState.stopStreaming();
    isOptimizeStreaming.value = false;
  };

  const onApplyOptimized = (content) => {
    const chapter = chapterListState.currentChapter.value;
    if (chapter) {
      chapterListState.updateChapterContent(content, chapter);
      editorState.setContent(content);
      viewState.saveNovelData();
    }
    closeOptimizeDialog();
    ElMessage.success("优化结果已应用");
  };

  // ============ 提示词选择 ============
  const onPromptSelect = ({ prompt, variables, finalPrompt: fp }) => {
    const category = aiState.selectedPromptCategory.value;
    if (category === "character") {
      characterState.batchCharacterSelectedPrompt.value = prompt;
      batchCharacterPromptTitle.value = prompt.title;
      characterState.batchCharacterPromptVariables.value = variables;
      characterState.batchCharacterFinalPrompt.value = fp || prompt.content;
    } else if (category === "worldview") {
      worldState.worldSettingSelectedPrompt.value = prompt;
      worldPromptTitle.value = prompt.title;
      worldState.worldSettingPromptVariables.value = variables;
      worldState.worldSettingFinalPrompt.value = fp || prompt.content;
    } else {
      aiState.selectedPrompt.value = prompt;
      aiState.promptVariables.value = variables;
      aiState.finalPrompt.value = fp || prompt.content;
    }
    aiState.showPromptDialog.value = false;
  };

  // ============ 编辑器事件 ============
  const onEditorCreated = (editor) => {
    editorState.handleCreated(editor);
  };

  const onEditorContentChange = (html) => {
    editorState.onContentChange(html);
    if (chapterListState.currentChapter.value) {
      chapterListState.updateChapterContent(html);
      editorState.triggerAutoSave(() => viewState.saveNovelData());
    }
  };

  return {
    // 状态
    showContinueDialog,
    isContinueStreaming,
    continueStreamingContent,
    showOptimizeDialog,
    isOptimizeStreaming,
    optimizeStreamingContent,
    optimizedContent,
    batchCharacterPromptTitle,
    worldPromptTitle,

    // 章节
    onSelectChapter,
    onChapterAction,
    onChapterCommand,
    onSaveChapter,
    onGenerateChapterOutline,
    onUpdateChapterStatus,
    onGenerateFromOutline,
    onChapterGenerate,

    // 角色
    onCharacterAction,
    onSaveCharacter,
    onBatchGenerateCharacters,
    onConfirmAddCharacters,
    onSelectBatchCharacterPrompt,
    onClearBatchCharacterPrompt,

    // 世界观
    onWorldAction,
    onSaveWorld,
    onGenerateWorldDescription,
    onGenerateWorldSettings,
    onConfirmAddWorldSettings,
    onSelectWorldPrompt,
    onClearWorldPrompt,

    // 语料
    onSaveCorpus,

    // 事件
    onEventAction,
    onSaveEvent,

    // 续写
    openContinueDialog,
    closeContinueDialog,
    onContinueWriting,
    onStopContinue,

    // 优化
    onEnhanceContent,
    closeOptimizeDialog,
    onOptimizeContent,
    onStopOptimize,
    onApplyOptimized,

    // 提示词
    onPromptSelect,

    // 编辑器
    onEditorCreated,
    onEditorContentChange,
  };
};

/**
 * 章节列表Composable - 管理章节CRUD、选择、排序、状态
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useNovelStore } from "../../stores/novel.js";

export const useChapterList = () => {
  const novelStore = useNovelStore();

  // 响应式状态
  const chapters = ref([]);
  const currentChapter = ref(null);
  const editingChapter = ref(null);
  const showChapterDialog = ref(false);
  const chapterForm = ref({
    title: "",
    description: "",
    status: "draft",
  });

  // 章节状态映射
  const getChapterStatusType = (status) => {
    const statusMap = {
      draft: "warning",
      completed: "success",
      published: "primary",
    };
    return statusMap[status] || "warning";
  };

  const getChapterStatusText = (status) => {
    const statusMap = {
      draft: "草稿",
      completed: "完成",
      published: "发表",
    };
    return statusMap[status] || "草稿";
  };

  // 初始化章节列表（从外部加载）
  const initChapters = (chapterList) => {
    chapters.value = chapterList.map((chapter) => {
      let fixedStatus = chapter.status || "draft";
      if (fixedStatus === "outline") fixedStatus = "draft";
      return {
        ...chapter,
        createdAt: chapter.createdAt ? new Date(chapter.createdAt) : new Date(),
        updatedAt: chapter.updatedAt ? new Date(chapter.updatedAt) : new Date(),
        status: fixedStatus,
      };
    });
  };

  // 选择章节
  const selectChapter = (chapter) => {
    if (!chapter.status || chapter.status === "outline") {
      chapter.status = "draft";
    }
    currentChapter.value = chapter;
  };

  // 加载章节内容
  const loadChapter = (chapter) => {
    if (!chapter.status || chapter.status === "outline") {
      chapter.status = "draft";
    }
    currentChapter.value = chapter;
    return chapter.content || "";
  };

  // 新增章节
  const addNewChapter = () => {
    editingChapter.value = null;
    chapterForm.value = {
      title: "",
      description: "",
      status: "draft",
    };
    showChapterDialog.value = true;
  };

  // 编辑章节信息
  const editChapterTitle = (chapter) => {
    editingChapter.value = chapter;
    chapterForm.value = {
      title: chapter.title,
      description: chapter.description || "",
      status: chapter.status || "draft",
    };
    showChapterDialog.value = true;
  };

  // 保存章节（新增或编辑）
  const saveChapter = (formData) => {
    const data = formData || chapterForm.value;
    if (!data.title?.trim()) {
      ElMessage.warning("请输入章节标题");
      return false;
    }

    if (editingChapter.value) {
      // 编辑现有章节
      editingChapter.value.title = data.title;
      editingChapter.value.description = data.description || "";
      editingChapter.value.status = data.status || "draft";
      editingChapter.value.updatedAt = new Date();
      ElMessage.success("章节信息已更新");
    } else {
      // 新增章节
      const newChapter = {
        id: Date.now(),
        title: data.title,
        description: data.description || "",
        content: "",
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || "draft",
      };
      chapters.value.push(newChapter);
      ElMessage.success("章节创建成功");
      return { autoSelect: newChapter };
    }

    showChapterDialog.value = false;
    return true;
  };

  // 删除章节
  const deleteChapter = (chapter) => {
    return ElMessageBox.confirm(
      `确定要删除章节《${chapter.title}》吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(() => {
        const index = chapters.value.findIndex((c) => c.id === chapter.id);
        if (index > -1) {
          chapters.value.splice(index, 1);
          // 如果删除的是当前章节
          if (currentChapter.value?.id === chapter.id) {
            currentChapter.value = null;
            // 自动选择第一个章节
            if (chapters.value.length > 0) {
              selectChapter(chapters.value[0]);
            }
          }
          ElMessage.success("章节已删除");
          return true;
        }
        return false;
      })
      .catch(() => {
        return false;
      });
  };

  // 更新章节状态
  const updateChapterStatus = (status) => {
    if (!currentChapter.value) return;
    currentChapter.value.status = status;
    currentChapter.value.updatedAt = new Date();
    // 同步更新章节列表中的状态
    const chapterIndex = chapters.value.findIndex(
      (ch) => ch.id === currentChapter.value.id,
    );
    if (chapterIndex > -1) {
      chapters.value[chapterIndex].status = status;
      chapters.value[chapterIndex].updatedAt = new Date();
    }
    ElMessage.success(`章节状态已更新为：${getChapterStatusText(status)}`);
  };

  // 保存章节内容
  const updateChapterContent = (content, chapter) => {
    const target = chapter || currentChapter.value;
    if (!target) return;
    const textContent = content?.replace
      ? content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
      : "";
    const wordCount = textContent.length;
    target.content = content;
    target.wordCount = wordCount;
    target.updatedAt = new Date();
    // 同步更新章节列表
    const chapterIndex = chapters.value.findIndex((ch) => ch.id === target.id);
    if (chapterIndex > -1) {
      chapters.value[chapterIndex].content = content;
      chapters.value[chapterIndex].wordCount = wordCount;
      chapters.value[chapterIndex].updatedAt = new Date();
    }
  };

  // 处理章节操作命令
  const handleChapterCommand = (command) => {
    switch (command) {
      case "manual":
        addNewChapter();
        break;
    }
  };

  // 处理章节动作
  const handleChapterAction = (command, chapter) => {
    switch (command) {
      case "edit":
        editChapterTitle(chapter);
        break;
      case "generate":
        return { action: "generate", chapter };
      case "delete":
        return { action: "delete", chapter };
    }
  };

  // 关闭对话框
  const closeChapterDialog = () => {
    showChapterDialog.value = false;
    editingChapter.value = null;
  };

  // 获取章节列表（用于保存）
  const getChapters = () => chapters.value;

  return {
    // 状态
    chapters,
    currentChapter,
    editingChapter,
    showChapterDialog,
    chapterForm,

    // 方法
    initChapters,
    selectChapter,
    loadChapter,
    addNewChapter,
    editChapterTitle,
    saveChapter,
    deleteChapter,
    updateChapterStatus,
    updateChapterContent,
    handleChapterCommand,
    handleChapterAction,
    closeChapterDialog,
    getChapters,
    getChapterStatusType,
    getChapterStatusText,
  };
};

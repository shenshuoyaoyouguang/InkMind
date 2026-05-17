/**
 * 语料库Composable - 管理语料CRUD
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 语料类型常量 - 提取为模块级导出，供组件和对话框统一使用
export const CORPUS_TYPES = [
  { key: "description", name: "描写类", icon: "🏞️" },
  { key: "dialogue", name: "对话类", icon: "💬" },
  { key: "action", name: "动作类", icon: "⚡" },
  { key: "psychology", name: "心理类", icon: "🧠" },
  { key: "environment", name: "环境类", icon: "🌍" },
  { key: "custom", name: "自定义", icon: "📝" },
];

export const useCorpusPanel = () => {
  // 响应式状态
  const corpusData = ref([]);
  const showCorpusDialog = ref(false);
  const corpusForm = ref({
    id: null,
    title: "",
    type: "description",
    content: "",
    tags: [],
  });
  const editingCorpus = ref(null);

  // 语料类型选项 - 引用模块级常量，保持单一数据源
  const corpusTypes = ref(CORPUS_TYPES);

  // 初始化语料库列表
  const initCorpusData = (corpusList) => {
    corpusData.value = corpusList || [];
  };

  // 打开新增语料对话框
  const addCorpus = () => {
    editingCorpus.value = null;
    corpusForm.value = {
      id: null,
      title: "",
      type: "description",
      content: "",
      tags: [],
    };
    showCorpusDialog.value = true;
  };

  // 打开编辑语料对话框
  const editCorpus = (corpus) => {
    editingCorpus.value = corpus;
    corpusForm.value = { ...corpus };
    showCorpusDialog.value = true;
  };

  // 保存语料
  const saveCorpus = () => {
    if (!corpusForm.value.title.trim()) {
      ElMessage.warning("请输入语料标题");
      return false;
    }

    if (editingCorpus.value) {
      // 编辑现有语料
      const index = corpusData.value.findIndex(
        (c) => c.id === editingCorpus.value.id,
      );
      if (index > -1) {
        corpusData.value[index] = { ...corpusForm.value };
      }
      ElMessage.success("语料信息已更新");
    } else {
      // 新增语料
      const newCorpus = {
        ...corpusForm.value,
        id: Date.now(),
        createdAt: new Date(),
      };
      corpusData.value.push(newCorpus);
      ElMessage.success("语料创建成功");
    }

    showCorpusDialog.value = false;
    return true;
  };

  // 删除语料
  const deleteCorpus = async (corpus) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除语料"${corpus.title}"吗？`,
        "删除确认",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        },
      );

      const index = corpusData.value.findIndex((item) => item.id === corpus.id);
      if (index > -1) {
        corpusData.value.splice(index, 1);
        ElMessage.success("语料删除成功");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // 处理语料操作
  const handleCorpusAction = (command, corpus) => {
    switch (command) {
      case "edit":
        editCorpus(corpus);
        break;
      case "delete":
        return deleteCorpus(corpus);
    }
  };

  // 关闭对话框
  const closeCorpusDialog = () => {
    showCorpusDialog.value = false;
    editingCorpus.value = null;
  };

  // 获取语料列表
  const getCorpusData = () => corpusData.value;

  return {
    // 状态
    corpusData,
    showCorpusDialog,
    corpusForm,
    editingCorpus,
    corpusTypes,

    // 方法
    initCorpusData,
    addCorpus,
    editCorpus,
    saveCorpus,
    deleteCorpus,
    handleCorpusAction,
    closeCorpusDialog,
    getCorpusData,
  };
};

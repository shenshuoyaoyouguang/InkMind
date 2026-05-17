/**
 * 编辑器Composable - 管理编辑器状态、自动保存、字数统计
 */
import { ref, computed, shallowRef, onBeforeUnmount } from "vue";

export const useEditor = () => {
  // 响应式状态
  const content = ref("");
  const editorRef = shallowRef(null);
  const isSaving = ref(false);
  const hasUnsavedChanges = ref(false);
  const isPreviewMode = ref(false);
  const previewContent = ref("");

  // 自动保存防抖定时器
  let autoSaveTimer = null;

  // 编辑器配置 - 在函数内部定义，每次调用生成新引用，避免配置污染
  const toolbarConfig = {};
  const editorConfig = {
    placeholder: "开始您的创作...",
    MENU_CONF: {
      uploadImage: {
        server: "/api/upload-image",
        fieldName: "file",
        maxFileSize: 5 * 1024 * 1024,
        allowedFileTypes: ["image/*"],
      },
    },
  };

  // 计算字数（去除HTML标签）
  const contentWordCount = computed(() => {
    if (!content.value) return 0;
    const textContent = content.value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ");
    return textContent.length;
  });

  // 编辑器创建完成回调
  const handleCreated = (editor) => {
    editorRef.value = editor;
  };

  // 编辑器内容变化回调
  const handleChange = (editor) => {
    const html = editor.getHtml();
    content.value = html;
    hasUnsavedChanges.value = true;
  };

  // 内容变化处理（触发自动保存）
  const onContentChange = (newContent) => {
    content.value = newContent;
    hasUnsavedChanges.value = true;

    // 清除之前的定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // 设置新的定时器，2秒后自动保存
    autoSaveTimer = setTimeout(() => {
      if (hasUnsavedChanges.value) {
        hasUnsavedChanges.value = false;
      }
    }, 2000);
  };

  // 手动触发保存
  const triggerAutoSave = (saveCallback) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    if (saveCallback) {
      isSaving.value = true;
      saveCallback().finally(() => {
        isSaving.value = false;
      });
    }
  };

  // 设置内容
  const setContent = (newContent) => {
    content.value = newContent || "";
    hasUnsavedChanges.value = false;
  };

  // 清空内容
  const clearContent = () => {
    content.value = "";
    hasUnsavedChanges.value = false;
    if (editorRef.value) {
      editorRef.value.setHtml("");
    }
  };

  // 切换预览模式
  const togglePreview = () => {
    isPreviewMode.value = !isPreviewMode.value;
    if (isPreviewMode.value) {
      previewContent.value = content.value;
    }
  };

  // 获取纯文本内容
  const getPlainText = computed(() => {
    return content.value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  });

  // 销毁编辑器
  const destroyEditor = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    if (editorRef.value) {
      editorRef.value.destroy();
      editorRef.value = null;
    }
  };

  // 组件销毁时清理
  onBeforeUnmount(() => {
    destroyEditor();
  });

  return {
    // 状态
    content,
    editorRef,
    isSaving,
    hasUnsavedChanges,
    isPreviewMode,
    previewContent,
    toolbarConfig,
    editorConfig,

    // 计算属性
    contentWordCount,
    getPlainText,

    // 方法
    handleCreated,
    handleChange,
    onContentChange,
    triggerAutoSave,
    setContent,
    clearContent,
    togglePreview,
    destroyEditor,
  };
};

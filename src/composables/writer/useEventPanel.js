/**
 * 事件线Composable - 管理事件时间线CRUD
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

export const useEventPanel = () => {
  // 响应式状态
  const events = ref([]);
  const showEventDialog = ref(false);
  const eventForm = ref({
    id: null,
    title: "",
    description: "",
    chapter: "",
    time: "",
    importance: "normal",
  });
  const editingEvent = ref(null);

  // 事件重要性选项
  const importanceOptions = ref([
    { value: "major", label: "重大", type: "danger" },
    { value: "important", label: "重要", type: "warning" },
    { value: "normal", label: "一般", type: "info" },
  ]);

  // 初始化事件列表
  const initEvents = (eventList) => {
    events.value = eventList || [];
  };

  // 打开新增事件对话框
  const addEvent = (currentChapterTitle = "") => {
    editingEvent.value = null;
    eventForm.value = {
      id: null,
      title: "",
      description: "",
      chapter: currentChapterTitle,
      time: new Date().toISOString().slice(0, 16),
      importance: "normal",
    };
    showEventDialog.value = true;
  };

  // 打开编辑事件对话框
  const editEvent = (event) => {
    editingEvent.value = event;
    eventForm.value = { ...event };
    showEventDialog.value = true;
  };

  // 保存事件
  const saveEvent = () => {
    if (!eventForm.value.title.trim()) {
      ElMessage.warning("请输入事件标题");
      return false;
    }

    if (editingEvent.value) {
      // 编辑现有事件 - 保留原对象的 id 和 createdAt
      const index = events.value.findIndex(
        (e) => e.id === editingEvent.value.id,
      );
      if (index > -1) {
        events.value[index] = {
          ...events.value[index], // 保留原对象属性（id、createdAt等）
          ...eventForm.value, // 用表单数据覆盖其他字段
        };
      }
      ElMessage.success("事件信息已更新");
    } else {
      // 新增事件
      const newEvent = {
        ...eventForm.value,
        id: Date.now(),
        createdAt: new Date(),
      };
      events.value.push(newEvent);
      ElMessage.success("事件创建成功");
    }

    showEventDialog.value = false;
    return true;
  };

  // 删除事件
  const deleteEvent = (event) => {
    return ElMessageBox.confirm(
      `确定要删除事件《${event.title}》吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      },
    )
      .then(() => {
        const index = events.value.findIndex((e) => e.id === event.id);
        if (index > -1) {
          events.value.splice(index, 1);
          ElMessage.success("事件已删除");
          return true;
        }
        return false;
      })
      .catch(() => false);
  };

  // 处理事件操作
  const handleEventAction = (command, event) => {
    switch (command) {
      case "edit":
        editEvent(event);
        break;
      case "delete":
        return deleteEvent(event);
    }
  };

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取事件重要性类型
  const getImportanceType = (importance) => {
    const typeMap = {
      major: "danger",
      important: "warning",
      normal: "info",
    };
    return typeMap[importance] || "info";
  };

  // 关闭对话框
  const closeEventDialog = () => {
    showEventDialog.value = false;
    editingEvent.value = null;
  };

  // 获取事件列表
  const getEvents = () => events.value;

  return {
    // 状态
    events,
    showEventDialog,
    eventForm,
    editingEvent,
    importanceOptions,

    // 方法
    initEvents,
    addEvent,
    editEvent,
    saveEvent,
    deleteEvent,
    handleEventAction,
    formatDate,
    getImportanceType,
    closeEventDialog,
    getEvents,
  };
};

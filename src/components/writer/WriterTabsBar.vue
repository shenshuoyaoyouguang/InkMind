<template>
  <div class="tabs-bar">
    <el-tabs
      v-model="activeTabModel"
      class="main-tabs"
      @tab-change="handleTabChange"
    >
      <el-tab-pane label="📝 编辑" name="editor"></el-tab-pane>
      <el-tab-pane label="👥 人物" name="characters"></el-tab-pane>
      <el-tab-pane label="🌍 世界观" name="worldview"></el-tab-pane>
      <el-tab-pane label="📚 语料库" name="corpus"></el-tab-pane>
      <el-tab-pane label="📊 事件线" name="events"></el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:activeTab", "tab-change"]);

const activeTabModel = computed({
  get: () => props.activeTab,
  set: (value) => emit("update:activeTab", value),
});

const handleTabChange = (tabName) => {
  emit("tab-change", tabName);
};
</script>

<style scoped>
.tabs-bar {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
}

.main-tabs {
  --el-tabs-header-height: 50px;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style>

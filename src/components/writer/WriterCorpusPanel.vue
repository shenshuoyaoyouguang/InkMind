<template>
  <div class="panel-content">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>📚 语料库</span>
          <el-button size="small" type="primary" @click="$emit('add-corpus')">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
        </div>
      </template>

      <div class="corpus-list">
        <div v-for="corpus in corpusData" :key="corpus.id" class="corpus-item">
          <div class="corpus-content">
            <div class="corpus-header">
              <h4>{{ corpus.title }}</h4>
              <el-tag :type="getCorpusType(corpus.type)">{{
                getCorpusTypeText(corpus.type)
              }}</el-tag>
            </div>
            <el-tooltip
              :content="corpus.content"
              placement="right"
              :disabled="corpus.content.length <= PREVIEW_MAX_LENGTH"
              effect="light"
              :show-after="300"
            >
              <p class="corpus-preview corpus-preview-truncated">
                {{
                  corpus.content.length > PREVIEW_MAX_LENGTH
                    ? corpus.content.substring(0, PREVIEW_MAX_LENGTH) + "..."
                    : corpus.content
                }}
              </p>
            </el-tooltip>
          </div>
          <div class="corpus-actions">
            <el-button size="small" @click="$emit('edit-corpus', corpus)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="$emit('delete-corpus', corpus)"
              >删除</el-button
            >
          </div>
        </div>

        <div v-if="corpusData.length === 0" class="empty-state">
          <p>暂无语料数据</p>
          <el-button size="small" @click="$emit('add-corpus')"
            >添加第一个语料</el-button
          >
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Plus } from "@element-plus/icons-vue";
import { CORPUS_TYPES } from "../../composables/writer/useCorpusPanel.js";

defineProps({
  corpusData: {
    type: Array,
    required: true,
  },
});

defineEmits(["add-corpus", "edit-corpus", "delete-corpus"]);

// 语料预览截断字数
const PREVIEW_MAX_LENGTH = 100;

// 从统一数据源构建 lookup Maps
const corpusTypeMap = Object.fromEntries(CORPUS_TYPES.map((t) => [t.key, t]));
const corpusTagTypeMap = {
  description: "primary",
  dialogue: "success",
  action: "info",
  psychology: "danger",
  environment: "warning",
  custom: "",
};

const getCorpusType = (type) => corpusTagTypeMap[type] || "";
const getCorpusTypeText = (type) => corpusTypeMap[type]?.name || type || "";
</script>

<style scoped>
.panel-content {
  height: 100%;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.corpus-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.corpus-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.corpus-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.corpus-content {
  flex: 1;
}

.corpus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.corpus-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 8px;
}

.corpus-preview {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.corpus-preview-truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.corpus-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin-bottom: 16px;
}
</style>

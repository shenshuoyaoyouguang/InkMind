<template>
  <!-- 内容优化对话框 -->
  <el-dialog
    v-model="visible"
    title="内容优化"
    width="700px"
    @close="handleClose"
  >
    <div class="optimize-content">
      <el-form :model="form" label-width="100px">
        <el-form-item label="优化类型">
          <el-radio-group v-model="form.optimizeType">
            <el-radio label="grammar">语法润色</el-radio>
            <el-radio label="style">文风优化</el-radio>
            <el-radio label="emotion">情感增强</el-radio>
            <el-radio label="logic">逻辑梳理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自定义要求">
          <el-input
            v-model="form.customRequirement"
            type="textarea"
            :rows="2"
            placeholder="如有特殊优化要求，请在此说明"
          />
        </el-form-item>
      </el-form>

      <!-- 原文预览 -->
      <div class="original-section">
        <div class="section-title">原文内容</div>
        <div class="original-box">
          <pre>{{ originalContent || "暂无内容" }}</pre>
        </div>
        <div class="content-stats">
          {{ originalContent ? originalContent.length : 0 }} 字
        </div>
      </div>

      <!-- 优化结果 -->
      <div v-if="optimizedContent" class="result-section">
        <div class="section-title">优化结果</div>
        <div class="result-box">
          <pre>{{ optimizedContent }}</pre>
        </div>
      </div>

      <!-- 流式内容 -->
      <div v-if="isStreaming && streamingContent" class="streaming-area">
        <div class="section-title">优化中...</div>
        <div class="streaming-content-box">
          <div class="streaming-text">{{ streamingContent }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button v-if="isStreaming" type="danger" @click="handleStop"
        >停止</el-button
      >
      <el-button type="primary" :loading="isStreaming" @click="handleOptimize">
        开始优化
      </el-button>
      <el-button
        v-if="optimizedContent && !isStreaming"
        type="success"
        @click="handleApply"
      >
        应用优化结果
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  originalContent: { type: String, default: "" },
  isStreaming: Boolean,
  streamingContent: { type: String, default: "" },
  optimizedContent: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "optimize",
  "apply",
  "stop",
  "close",
]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = ref({
  optimizeType: "grammar",
  customRequirement: "",
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.value = {
        optimizeType: "grammar",
        customRequirement: "",
      };
    }
  },
);

const handleOptimize = () => {
  emit("optimize", form.value);
};

const handleApply = () => {
  emit("apply", props.optimizedContent);
};

const handleStop = () => {
  emit("stop");
};

const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.optimize-content {
  max-height: 60vh;
  overflow-y: auto;
}

.original-section,
.result-section,
.streaming-area {
  margin-top: 16px;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.original-box,
.result-box {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.original-box pre,
.result-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.6;
  font-family: inherit;
}

.content-stats {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.streaming-content-box {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.streaming-text {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 13px;
  color: #303133;
}
</style>

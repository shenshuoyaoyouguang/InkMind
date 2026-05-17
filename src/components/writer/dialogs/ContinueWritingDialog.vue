<template>
  <!-- 续写对话框 -->
  <el-dialog
    v-model="visible"
    title="智能续写"
    width="700px"
    @close="handleClose"
  >
    <div class="continue-content">
      <el-form :model="form" label-width="100px">
        <el-form-item label="续写方向">
          <el-input
            v-model="form.direction"
            type="textarea"
            :rows="3"
            placeholder="描述续写的发展方向，例如：情节继续发展，主角遇到新的挑战..."
          />
        </el-form-item>
        <el-form-item label="续写字数">
          <el-input-number
            v-model="form.wordCount"
            :min="200"
            :max="3000"
            :step="100"
          />
          <span style="margin-left: 8px; color: #909399">字</span>
        </el-form-item>
      </el-form>

      <!-- 当前内容预览 -->
      <div class="current-preview">
        <div class="section-title">当前内容预览</div>
        <div class="preview-box">
          <!-- 使用 v-text 防止 XSS 攻击，currentContent 可能包含用户输入或 AI 生成内容 -->
          <div v-text="currentContent || '暂无内容'" />
        </div>
      </div>

      <!-- 流式内容显示 -->
      <div v-if="isStreaming" class="streaming-area">
        <div class="section-title">续写内容</div>
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
      <el-button type="primary" :loading="isStreaming" @click="handleContinue">
        开始续写
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  currentContent: { type: String, default: "" },
  isStreaming: Boolean,
  streamingContent: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "continue", "stop", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const form = ref({
  direction: "",
  wordCount: 500,
});

const handleContinue = () => {
  emit("continue", form.value);
};

const handleStop = () => {
  emit("stop");
};

const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.continue-content {
  max-height: 60vh;
  overflow-y: auto;
}

.current-preview {
  margin-top: 16px;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.preview-box {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  max-height: 150px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.8;
}

.streaming-area {
  margin-top: 16px;
}

.streaming-content-box {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.streaming-text {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
}
</style>

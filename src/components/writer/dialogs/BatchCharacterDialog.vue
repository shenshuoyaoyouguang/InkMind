<template>
  <!-- AI批量生成角色对话框 -->
  <el-dialog
    v-model="visible"
    title="AI批量生成角色"
    width="900px"
    @close="handleClose"
  >
    <div class="batch-generate-content">
      <!-- 配置区域 -->
      <el-card
        v-if="!isGenerating && generatedCharacters.length === 0"
        shadow="never"
        class="config-section"
      >
        <template #header>
          <span>生成配置</span>
        </template>

        <el-form label-width="120px" size="default">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生成数量">
                <el-input-number v-model="config.count" :min="2" :max="10" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色类型">
                <div class="character-type-options">
                  <el-checkbox v-model="config.includeMainCharacters"
                    >主角</el-checkbox
                  >
                  <el-checkbox v-model="config.includeSupportingCharacters"
                    >配角</el-checkbox
                  >
                  <el-checkbox v-model="config.includeMinorCharacters"
                    >次要角色</el-checkbox
                  >
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 提示词选择 -->
          <el-form-item label="使用提示词">
            <div style="display: flex; gap: 10px; align-items: center">
              <el-button
                type="primary"
                plain
                size="small"
                @click="emit('selectPrompt', 'character')"
              >
                选择提示词
              </el-button>
              <span v-if="selectedPromptTitle" class="selected-prompt-info">
                已选择：{{ selectedPromptTitle }}
              </span>
              <el-button
                v-if="selectedPromptTitle"
                link
                size="small"
                type="danger"
                @click="emit('clearPrompt')"
              >
                清除
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="特殊要求">
            <el-input
              v-model="config.customPrompt"
              type="textarea"
              :rows="3"
              placeholder="例如：需要包含反派角色、特定职业角色、具有魔法能力的角色等..."
            />
          </el-form-item>

          <el-form-item label="智能分配">
            <el-checkbox v-model="config.autoAssignRoles"
              >自动平衡角色关系和重要性</el-checkbox
            >
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 流式生成区域 -->
      <el-card v-if="isGenerating" shadow="never" class="streaming-section">
        <template #header>
          <div class="streaming-header">
            <span>AI正在生成角色...</span>
            <el-button size="small" type="danger" @click="emit('stop')"
              >停止</el-button
            >
          </div>
        </template>
        <div class="streaming-content-container">
          <!-- 使用文本插值而非 v-html，防止 XSS 攻击 -->
          <div class="streaming-content">
            {{
              typeof streamingContent === "string"
                ? streamingContent
                : streamingContent.join("")
            }}
          </div>
        </div>
      </el-card>

      <!-- 生成结果区域 -->
      <el-card
        v-if="!isGenerating && generatedCharacters.length > 0"
        shadow="never"
        class="results-section"
      >
        <template #header>
          <div class="results-header">
            <span>生成结果 ({{ localSelectedCharacters.length }}个角色)</span>
            <div class="result-actions">
              <el-button size="small" @click="selectAll">全选</el-button>
              <el-button size="small" @click="selectNone">全不选</el-button>
            </div>
          </div>
        </template>

        <div class="generated-characters-grid">
          <div
            v-for="character in localSelectedCharacters"
            :key="character.id"
            class="generated-character-card"
            :class="{ selected: character.selected !== false }"
            @click="toggleSelection(character)"
          >
            <div class="character-header">
              <div class="character-avatar-preview">
                <div class="default-avatar">
                  {{ character.name?.charAt(0) || "?" }}
                </div>
              </div>
              <div class="character-basic-info">
                <h4>{{ character.name }}</h4>
                <div class="character-meta">
                  <el-tag :type="getRoleType(character.role)" size="small">{{
                    getRoleText(character.role)
                  }}</el-tag>
                  <el-tag type="info" size="small">{{
                    getGenderText(character.gender)
                  }}</el-tag>
                  <span class="age-text">{{ character.age }}岁</span>
                </div>
              </div>
              <div class="selection-indicator">
                <el-icon
                  v-if="character.selected !== false"
                  class="selected-icon"
                  ><Check
                /></el-icon>
              </div>
            </div>

            <div class="character-details">
              <div class="detail-item">
                <label>外貌：</label>
                <p>{{ character.appearance || "暂无描述" }}</p>
              </div>
              <div class="detail-item">
                <label>性格：</label>
                <p>{{ character.personality || "暂无描述" }}</p>
              </div>
              <div class="detail-item">
                <label>背景：</label>
                <p>{{ character.background || "暂无描述" }}</p>
              </div>
              <div v-if="character.tags?.length" class="character-tags-preview">
                <el-tag v-for="tag in character.tags" :key="tag" size="small">{{
                  tag
                }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!isGenerating && generatedCharacters.length === 0"
          type="primary"
          :disabled="
            !config.includeMainCharacters &&
            !config.includeSupportingCharacters &&
            !config.includeMinorCharacters
          "
          @click="emit('generate', config)"
        >
          开始生成
        </el-button>
        <el-button
          v-if="!isGenerating && generatedCharacters.length > 0"
          @click="emit('regenerate', config)"
        >
          重新生成
        </el-button>
        <el-button
          v-if="!isGenerating && generatedCharacters.length > 0"
          type="primary"
          @click="handleConfirm"
        >
          添加选中角色
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Check } from "@element-plus/icons-vue";
// 导入角色类型工具函数，保持组件间枚举值一致
import {
  getRoleType,
  getRoleText,
} from "../../../composables/writer/useCharacterPanel.js";

const props = defineProps({
  modelValue: Boolean,
  isGenerating: Boolean,
  streamingContent: { type: String, default: "" },
  generatedCharacters: { type: Array, default: () => [] },
  selectedPromptTitle: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "generate",
  "regenerate",
  "confirm",
  "stop",
  "close",
  "selectPrompt",
  "clearPrompt",
]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const config = ref({
  count: 3,
  includeMainCharacters: true,
  includeSupportingCharacters: true,
  includeMinorCharacters: true,
  customPrompt: "",
  autoAssignRoles: true,
});

// 本地选中状态，避免直接修改 props（Vue 不可变原则）
const localSelectedCharacters = ref([]);

// 监听 props 变化，同步到本地状态
watch(
  () => props.generatedCharacters,
  (newVal) => {
    localSelectedCharacters.value = newVal.map((char) => ({
      ...char,
      selected: char.selected !== false,
    }));
  },
  { immediate: true, deep: true },
);

const getGenderText = (gender) => {
  const map = { male: "男", female: "女", other: "其他" };
  return map[gender] || gender || "未知";
};

const toggleSelection = (character) => {
  const index = localSelectedCharacters.value.findIndex(
    (c) => c.id === character.id,
  );
  if (index > -1) {
    localSelectedCharacters.value[index].selected =
      !localSelectedCharacters.value[index].selected;
  }
};

const selectAll = () => {
  localSelectedCharacters.value.forEach((char) => {
    char.selected = true;
  });
};

const selectNone = () => {
  localSelectedCharacters.value.forEach((char) => {
    char.selected = false;
  });
};

const handleClose = () => {
  emit("close");
};

// 确认时返回本地选中状态（而非直接修改 props）
const handleConfirm = () => {
  emit("confirm", localSelectedCharacters.value);
};
</script>

<style scoped>
.batch-generate-content {
  max-height: 70vh;
  overflow-y: auto;
}

.config-section,
.streaming-section,
.results-section {
  margin-bottom: 16px;
}

.character-type-options,
.world-type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.selected-prompt-info {
  color: #409eff;
  font-size: 13px;
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.streaming-content-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
}

.streaming-content {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.generated-characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.generated-character-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.generated-character-card:hover {
  border-color: #409eff;
}

.generated-character-card.selected {
  border-color: #67c23a;
  background-color: #f0fdf4;
}

.character-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.character-avatar-preview {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.default-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.character-basic-info {
  flex: 1;
}

.character-basic-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.character-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.age-text {
  font-size: 12px;
  color: #909399;
}

.selection-indicator {
  width: 24px;
  text-align: center;
}

.selected-icon {
  color: #67c23a;
  font-size: 20px;
}

.character-details {
  padding-left: 60px;
}

.detail-item {
  margin-bottom: 8px;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  font-size: 12px;
}

.detail-item p {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.character-tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

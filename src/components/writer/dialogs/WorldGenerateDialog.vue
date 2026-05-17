<template>
  <!-- AI生成世界观设定对话框 -->
  <el-dialog
    v-model="visible"
    title="AI生成世界观设定"
    width="800px"
    @close="handleClose"
  >
    <div class="world-generate-content">
      <!-- 配置区域 -->
      <el-card
        v-if="!isGenerating && generatedWorldSettings.length === 0"
        shadow="never"
        class="config-section"
      >
        <template #header>
          <span>生成配置</span>
        </template>

        <el-form label-width="120px" size="default">
          <el-form-item label="生成数量">
            <el-input-number v-model="config.count" :min="1" :max="8" />
          </el-form-item>

          <el-form-item label="设定类型">
            <div class="world-type-options">
              <el-checkbox v-model="config.includeGeography"
                >地理环境</el-checkbox
              >
              <el-checkbox v-model="config.includeCulture"
                >文化社会</el-checkbox
              >
              <el-checkbox v-model="config.includeHistory"
                >历史背景</el-checkbox
              >
              <el-checkbox v-model="config.includeMagic">魔法体系</el-checkbox>
              <el-checkbox v-model="config.includeTechnology"
                >科技水平</el-checkbox
              >
              <el-checkbox v-model="config.includePolitics"
                >政治势力</el-checkbox
              >
              <el-checkbox v-model="config.includeReligion"
                >宗教信仰</el-checkbox
              >
              <el-checkbox v-model="config.includeEconomy"
                >经济贸易</el-checkbox
              >
              <el-checkbox v-model="config.includeRaces">种族设定</el-checkbox>
              <el-checkbox v-model="config.includeLanguage"
                >语言文字</el-checkbox
              >
            </div>
          </el-form-item>

          <!-- 提示词选择 -->
          <el-form-item label="使用提示词">
            <div style="display: flex; gap: 10px; align-items: center">
              <el-button
                type="primary"
                plain
                size="small"
                @click="emit('selectPrompt', 'worldview')"
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
              placeholder="例如：需要包含特定的种族设定、独特的政治制度、特殊的自然现象等..."
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 流式生成区域 -->
      <el-card v-if="isGenerating" shadow="never" class="streaming-section">
        <template #header>
          <div class="streaming-header">
            <span>AI正在生成世界观设定...</span>
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
        v-if="!isGenerating && generatedWorldSettings.length > 0"
        shadow="never"
        class="results-section"
      >
        <template #header>
          <div class="results-header">
            <span>生成结果 ({{ generatedWorldSettings.length }}个设定)</span>
            <div class="result-actions">
              <el-button size="small" @click="selectAll">全选</el-button>
              <el-button size="small" @click="selectNone">全不选</el-button>
            </div>
          </div>
        </template>

        <div class="generated-settings-list">
          <div
            v-for="setting in generatedWorldSettings"
            :key="setting.id"
            class="generated-setting-card"
            :class="{ selected: setting.selected !== false }"
            @click="toggleSelection(setting)"
          >
            <div class="setting-header">
              <div class="setting-basic-info">
                <h4>{{ setting.title }}</h4>
                <el-tag :type="getSettingType(setting.type)" size="small">{{
                  getSettingTypeText(setting.type)
                }}</el-tag>
              </div>
              <div class="selection-indicator">
                <el-icon v-if="setting.selected !== false" class="selected-icon"
                  ><Check
                /></el-icon>
              </div>
            </div>

            <div class="setting-content">
              <p>{{ setting.description || "暂无描述" }}</p>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="!isGenerating && generatedWorldSettings.length === 0"
          type="primary"
          :disabled="!hasAnyTypeSelected"
          @click="emit('generate', config)"
        >
          开始生成
        </el-button>
        <el-button
          v-if="!isGenerating && generatedWorldSettings.length > 0"
          @click="emit('regenerate', config)"
        >
          重新生成
        </el-button>
        <el-button
          v-if="!isGenerating && generatedWorldSettings.length > 0"
          type="primary"
          @click="emit('confirm', generatedWorldSettings)"
        >
          添加选中设定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { Check } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: Boolean,
  isGenerating: Boolean,
  streamingContent: { type: String, default: "" },
  generatedWorldSettings: { type: Array, default: () => [] },
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
  includeGeography: true,
  includeCulture: true,
  includeHistory: false,
  includeMagic: false,
  includeTechnology: false,
  includePolitics: false,
  includeReligion: false,
  includeEconomy: false,
  includeRaces: false,
  includeLanguage: false,
  customPrompt: "",
});

const typeConfigMap = {
  geography: "地理环境",
  culture: "文化社会",
  history: "历史背景",
  magic: "魔法体系",
  technology: "科技水平",
  politics: "政治势力",
  religion: "宗教信仰",
  economy: "经济贸易",
  races: "种族设定",
  language: "语言文字",
};

const hasAnyTypeSelected = computed(() => {
  return Object.entries(config.value).some(([key, val]) => {
    if (key.startsWith("include") && val === true) return true;
    return false;
  });
});

const getSettingType = (type) => {
  const map = {
    geography: "primary",
    culture: "success",
    history: "warning",
    magic: "danger",
    technology: "info",
    politics: "warning",
    religion: "danger",
    economy: "success",
    races: "primary",
    language: "info",
  };
  return map[type] || "info";
};

const getSettingTypeText = (type) => {
  return typeConfigMap[type] || type || "未知";
};

const toggleSelection = (setting) => {
  setting.selected = setting.selected === false ? true : false;
};

const selectAll = () => {
  props.generatedWorldSettings.forEach((s) => {
    s.selected = true;
  });
};

const selectNone = () => {
  props.generatedWorldSettings.forEach((s) => {
    s.selected = false;
  });
};

const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.world-generate-content {
  max-height: 70vh;
  overflow-y: auto;
}

.config-section,
.streaming-section,
.results-section {
  margin-bottom: 16px;
}

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

.generated-settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.generated-setting-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.generated-setting-card:hover {
  border-color: #409eff;
}

.generated-setting-card.selected {
  border-color: #67c23a;
  background-color: #f0fdf4;
}

.setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.setting-basic-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-basic-info h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.selection-indicator {
  width: 24px;
  text-align: center;
}

.selected-icon {
  color: #67c23a;
  font-size: 20px;
}

.setting-content p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

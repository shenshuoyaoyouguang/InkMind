<template>
  <!-- 提示词选择对话框 -->
  <el-dialog
    v-model="visible"
    title="选择提示词模板"
    width="700px"
    @close="handleClose"
  >
    <div class="prompt-selection">
      <!-- 分类选择 -->
      <div class="category-selection">
        <el-radio-group v-model="selectedCategory" size="small">
          <el-radio-button
            v-for="cat in categories"
            :key="cat.key"
            :label="cat.key"
          >
            {{ cat.name }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 提示词列表 -->
      <div class="prompt-list">
        <el-empty
          v-if="filteredPrompts.length === 0"
          description="该分类暂无提示词"
        />

        <div
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="prompt-item"
          :class="{ active: selectedPrompt?.id === prompt.id }"
          @click="handleSelect(prompt)"
        >
          <div class="prompt-info">
            <div class="prompt-title">{{ prompt.title }}</div>
            <div class="prompt-desc">{{ prompt.description }}</div>
            <div class="prompt-tags">
              <el-tag
                v-for="tag in prompt.tags"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <el-icon v-if="selectedPrompt?.id === prompt.id" class="check-icon"
            ><Check
          /></el-icon>
        </div>
      </div>

      <!-- 变量填写区域 -->
      <div v-if="selectedPrompt" class="variables-section">
        <div class="section-title">填写变量</div>
        <el-form label-width="100px">
          <el-form-item
            v-for="variable in promptVariables"
            :key="variable"
            :label="variable"
          >
            <el-input
              v-model="variables[variable]"
              :placeholder="`请输入${variable}`"
              @input="updateFinalPrompt"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 预览区域 -->
      <div v-if="selectedPrompt" class="preview-section">
        <div class="section-title">提示词预览</div>
        <div class="preview-box">
          <pre>{{ finalPrompt || selectedPrompt.content }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button
        type="primary"
        :disabled="!selectedPrompt"
        @click="handleConfirm"
      >
        使用此提示词
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Check } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: Boolean,
  prompts: {
    type: Array,
    default: () => [],
  },
  category: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "select", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const selectedCategory = ref(props.category || "all");
const selectedPrompt = ref(null);
const variables = ref({});
const finalPrompt = ref("");

const categories = [
  { key: "all", name: "全部" },
  { key: "outline", name: "大纲" },
  { key: "content", name: "正文" },
  { key: "character", name: "角色" },
  { key: "worldview", name: "世界观" },
  { key: "polish", name: "润色" },
  { key: "continue", name: "续写" },
];

const filteredPrompts = computed(() => {
  if (selectedCategory.value === "all") return props.prompts;
  return props.prompts.filter((p) => p.category === selectedCategory.value);
});

watch(selectedCategory, () => {
  selectedPrompt.value = null;
  variables.value = {};
  finalPrompt.value = "";
});

const handleSelect = (prompt) => {
  selectedPrompt.value = prompt;
  // 提取变量
  const matches = prompt.content.match(/\{([^}]+)\}/g) || [];
  variables.value = {};
  matches.forEach((match) => {
    const variable = match.slice(1, -1);
    variables.value[variable] = "";
  });
  updateFinalPrompt();
};

const updateFinalPrompt = () => {
  if (!selectedPrompt.value) return;
  let result = selectedPrompt.value.content;
  Object.keys(variables.value).forEach((variable) => {
    const value = variables.value[variable] || `{${variable}}`;
    result = result.replace(new RegExp(`\\{${variable}\\}`, "g"), value);
  });
  finalPrompt.value = result;
};

const handleReset = () => {
  selectedPrompt.value = null;
  variables.value = {};
  finalPrompt.value = "";
};

const handleClose = () => {
  emit("close");
};

const handleConfirm = () => {
  if (selectedPrompt.value) {
    emit("select", {
      prompt: selectedPrompt.value,
      variables: variables.value,
      finalPrompt: finalPrompt.value || selectedPrompt.value.content,
    });
    visible.value = false;
  }
};
</script>

<style scoped>
.prompt-selection {
  max-height: 60vh;
  overflow-y: auto;
}

.category-selection {
  margin-bottom: 16px;
}

.prompt-list {
  margin-bottom: 16px;
}

.prompt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.prompt-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.prompt-info {
  flex: 1;
}

.prompt-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.prompt-desc {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.check-icon {
  color: #409eff;
  font-size: 20px;
}

.variables-section,
.preview-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.preview-box {
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
  font-family: "Monaco", "Menlo", monospace;
}
</style>

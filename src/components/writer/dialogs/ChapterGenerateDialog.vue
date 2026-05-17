<template>
  <!-- 章节内容生成对话框 -->
  <el-dialog
    v-model="visible"
    title="生成章节正文"
    width="900px"
    @close="handleClose"
  >
    <div class="generate-content">
      <!-- 配置区域 -->
      <el-card shadow="never" class="config-card">
        <template #header>
          <div class="card-header">
            <span>生成配置</span>
          </div>
        </template>
        <el-form :model="config" label-width="100px" size="small">
          <el-form-item label="目标字数">
            <el-input-number
              v-model="config.wordCount"
              :min="500"
              :max="10000"
              :step="500"
            />
            <span style="margin-left: 8px; color: #909399">字</span>
          </el-form-item>
          <el-form-item label="写作视角">
            <el-radio-group v-model="config.style">
              <el-radio label="third-person">第三人称</el-radio>
              <el-radio label="first-person">第一人称</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="重点内容">
            <el-input
              v-model="config.focus"
              placeholder="指定本次生成的重点内容"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 素材选择区域 -->
      <el-card shadow="never" class="materials-card">
        <template #header>
          <div class="card-header">
            <span>选择参考素材</span>
            <el-space>
              <el-button size="small" @click="selectAllMaterials"
                >全选</el-button
              >
              <el-button size="small" @click="clearAllMaterials"
                >清空</el-button
              >
            </el-space>
          </div>
        </template>
        <el-tabs v-model="activeMaterialTab">
          <el-tab-pane label="人物" name="characters">
            <div v-if="characters.length > 0" class="materials-grid">
              <div
                v-for="char in characters"
                :key="char.id"
                class="material-card"
                :class="{ selected: isSelected('characters', char) }"
                @click="toggleMaterial('characters', char)"
              >
                <div class="material-name">{{ char.name }}</div>
                <div class="material-desc">
                  {{ char.background || char.personality || "暂无描述" }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无人物数据" />
          </el-tab-pane>
          <el-tab-pane label="世界观" name="worldSettings">
            <div v-if="worldSettings.length > 0" class="materials-grid">
              <div
                v-for="setting in worldSettings"
                :key="setting.id"
                class="material-card"
                :class="{ selected: isSelected('worldSettings', setting) }"
                @click="toggleMaterial('worldSettings', setting)"
              >
                <div class="material-name">{{ setting.title }}</div>
                <div class="material-desc">
                  {{ setting.description || "暂无描述" }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无世界观设定" />
          </el-tab-pane>
          <el-tab-pane label="语料" name="corpus">
            <div v-if="corpus.length > 0" class="materials-grid">
              <div
                v-for="item in corpus"
                :key="item.id"
                class="material-card"
                :class="{ selected: isSelected('corpus', item) }"
                @click="toggleMaterial('corpus', item)"
              >
                <div class="material-name">{{ item.title }}</div>
                <div class="material-desc">
                  {{ item.content || "暂无内容" }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无语料数据" />
          </el-tab-pane>
          <el-tab-pane label="事件线" name="events">
            <div v-if="events.length > 0" class="materials-grid">
              <div
                v-for="event in events"
                :key="event.id"
                class="material-card"
                :class="{ selected: isSelected('events', event) }"
                @click="toggleMaterial('events', event)"
              >
                <div class="material-name">{{ event.title }}</div>
                <div class="material-desc">
                  {{ event.description || "暂无描述" }}
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无事件数据" />
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 流式内容显示 -->
      <div v-if="isStreaming" class="streaming-area">
        <el-card shadow="never" class="streaming-card">
          <template #header>
            <div class="streaming-header">
              <span class="streaming-status">AI正在生成中...</span>
              <el-button size="small" type="danger" @click="handleStop"
                >停止</el-button
              >
            </div>
          </template>
          <div class="streaming-content-box">
            <div class="streaming-text">{{ streamingContent }}</div>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="isGenerating" @click="handleGenerate">
        开始生成
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  modelValue: Boolean,
  chapter: { type: Object, default: null },
  characters: { type: Array, default: () => [] },
  worldSettings: { type: Array, default: () => [] },
  corpus: { type: Array, default: () => [] },
  events: { type: Array, default: () => [] },
  isGenerating: Boolean,
  isStreaming: Boolean,
  streamingContent: { type: String, default: null },
});

const emit = defineEmits(["update:modelValue", "generate", "stop", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const activeMaterialTab = ref("characters");
const config = ref({
  wordCount: 2000,
  style: "third-person",
  focus: "",
});
const selectedMaterials = ref({
  characters: [],
  worldSettings: [],
  corpus: [],
  events: [],
});

const isSelected = (type, item) => {
  return selectedMaterials.value[type].some((i) => i.id === item.id);
};

const toggleMaterial = (type, item) => {
  const index = selectedMaterials.value[type].findIndex(
    (i) => i.id === item.id,
  );
  if (index > -1) {
    selectedMaterials.value[type].splice(index, 1);
  } else {
    selectedMaterials.value[type].push(item);
  }
};

const selectAllMaterials = () => {
  const typeMap = {
    characters: props.characters,
    worldSettings: props.worldSettings,
    corpus: props.corpus,
    events: props.events,
  };
  const tabMap = {
    characters: "characters",
    worldSettings: "worldSettings",
    corpus: "corpus",
    events: "events",
  };
  const currentType =
    tabMap[activeMaterialTab.value] || activeMaterialTab.value;
  if (typeMap[currentType]) {
    selectedMaterials.value[currentType] = [...typeMap[currentType]];
  }
};

const clearAllMaterials = () => {
  selectedMaterials.value = {
    characters: [],
    worldSettings: [],
    corpus: [],
    events: [],
  };
  ElMessage.success("已清空选择");
};

const handleGenerate = () => {
  emit("generate", {
    chapter: props.chapter,
    config: config.value,
    materials: selectedMaterials.value,
  });
};

const handleStop = () => {
  emit("stop");
};

const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.generate-content {
  max-height: 70vh;
  overflow-y: auto;
}

.config-card,
.materials-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.material-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.material-card:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.material-card.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.material-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.material-desc {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.streaming-area {
  margin-top: 16px;
}

.streaming-card {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.streaming-status {
  color: #67c23a;
  font-weight: 600;
}

.streaming-content-box {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 12px;
}

.streaming-text {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 14px;
  color: #303133;
}
</style>

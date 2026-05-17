<template>
  <div class="writing-tools">
    <!-- 人物管理 -->
    <el-card class="tool-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>👥 人物管理</span>
          <div class="header-buttons">
            <el-button
              size="small"
              type="success"
              @click="generateCharacterWithAI"
              >AI生成</el-button
            >
            <el-button size="small" type="primary" @click="addCharacter"
              >添加人物</el-button
            >
          </div>
        </div>
      </template>
      <div class="characters-list">
        <div
          v-for="character in characters"
          :key="character.id"
          class="character-item"
        >
          <div class="character-info">
            <h4>{{ character.name }}</h4>
            <p>{{ character.description }}</p>
            <div class="character-tags">
              <el-tag
                v-for="trait in character.traits"
                :key="trait"
                size="small"
                >{{ trait }}</el-tag
              >
            </div>
          </div>
          <el-button
            size="small"
            type="danger"
            @click="removeCharacter(character.id)"
            >删除</el-button
          >
        </div>
        <div v-if="characters.length === 0" class="empty-state">
          📝 暂无人物，点击添加按钮创建角色
        </div>
      </div>
    </el-card>

    <!-- 世界观设定 -->
    <el-card class="tool-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>🌍 世界观设定</span>
          <div class="header-buttons">
            <el-button
              size="small"
              type="success"
              @click="generateWorldSettingWithAI"
              >AI生成</el-button
            >
            <el-button size="small" type="primary" @click="addWorldSetting"
              >添加设定</el-button
            >
          </div>
        </div>
      </template>
      <div class="world-settings">
        <div
          v-for="setting in worldSettings"
          :key="setting.id"
          class="setting-item"
        >
          <div class="setting-info">
            <h4>{{ setting.title }}</h4>
            <p>{{ setting.description }}</p>
          </div>
          <el-button
            size="small"
            type="danger"
            @click="removeWorldSetting(setting.id)"
            >删除</el-button
          >
        </div>
        <div v-if="worldSettings.length === 0" class="empty-state">
          🏰 暂无世界观设定，点击添加按钮创建
        </div>
      </div>
    </el-card>

    <!-- 写作进度 -->
    <el-card class="tool-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📊 写作进度</span>
          <el-button size="small" @click="updateProgress">更新进度</el-button>
        </div>
      </template>
      <div class="progress-info">
        <div class="progress-item">
          <span>目标字数：</span>
          <el-input-number
            v-model="targetWordCount"
            :min="1000"
            :step="1000"
            size="small"
          />
        </div>
        <div class="progress-item">
          <span>当前字数：{{ currentWordCount }}</span>
        </div>
        <div class="progress-item">
          <span>完成进度：</span>
          <el-progress
            :percentage="progressPercentage"
            :color="progressColor"
          />
        </div>
        <div class="progress-item">
          <span>预计完成时间：{{ estimatedTime }}</span>
        </div>
      </div>
    </el-card>

    <!-- 灵感记录 -->
    <el-card class="tool-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>💡 灵感记录</span>
          <el-button size="small" type="primary" @click="addInspiration"
            >记录灵感</el-button
          >
        </div>
      </template>
      <div class="inspirations-list">
        <div
          v-for="inspiration in inspirations"
          :key="inspiration.id"
          class="inspiration-item"
        >
          <div class="inspiration-content">
            <p>{{ inspiration.content }}</p>
            <small>{{ inspiration.timestamp }}</small>
          </div>
          <el-button
            size="small"
            type="danger"
            @click="removeInspiration(inspiration.id)"
            >删除</el-button
          >
        </div>
        <div v-if="inspirations.length === 0" class="empty-state">
          ✨ 暂无灵感记录，随时记录你的创作想法
        </div>
      </div>
    </el-card>

    <!-- 人物对话框 -->
    <el-dialog v-model="characterDialogVisible" title="添加人物" width="500px">
      <el-form :model="newCharacter" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="newCharacter.name" placeholder="请输入人物姓名" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newCharacter.description"
            type="textarea"
            :rows="3"
            placeholder="请输入人物描述"
          />
        </el-form-item>
        <el-form-item label="特征">
          <el-input
            v-model="newCharacter.traitsInput"
            placeholder="请输入特征，用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="characterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCharacter">保存</el-button>
      </template>
    </el-dialog>

    <!-- 世界观设定对话框 -->
    <el-dialog
      v-model="worldDialogVisible"
      title="添加世界观设定"
      width="500px"
    >
      <el-form :model="newWorldSetting" label-width="80px">
        <el-form-item label="标题">
          <el-input
            v-model="newWorldSetting.title"
            placeholder="请输入设定标题"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newWorldSetting.description"
            type="textarea"
            :rows="4"
            placeholder="请输入详细描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="worldDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWorldSetting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 灵感记录对话框 -->
    <el-dialog
      v-model="inspirationDialogVisible"
      title="记录灵感"
      width="500px"
    >
      <el-form :model="newInspiration" label-width="80px">
        <el-form-item label="内容">
          <el-input
            v-model="newInspiration.content"
            type="textarea"
            :rows="4"
            placeholder="记录你的创作灵感..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspirationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveInspiration">保存</el-button>
      </template>
    </el-dialog>

    <!-- AI生成人物对话框 -->
    <el-dialog
      v-model="aiCharacterDialogVisible"
      title="AI生成人物"
      width="500px"
    >
      <el-form :model="aiCharacterForm" label-width="80px">
        <el-form-item label="主题">
          <el-input
            v-model="aiCharacterForm.theme"
            placeholder="请输入小说主题，如：修仙、都市、悬疑等"
          />
        </el-form-item>
        <el-form-item label="角色类型">
          <el-select
            v-model="aiCharacterForm.characterType"
            placeholder="请选择角色类型（可选）"
            clearable
          >
            <el-option label="主角" value="主角" />
            <el-option label="配角" value="配角" />
            <el-option label="反派" value="反派" />
            <el-option label="导师" value="导师" />
            <el-option label="朋友" value="朋友" />
            <el-option label="敌人" value="敌人" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiCharacterDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="generatingCharacter"
          @click="generateCharacter"
          >生成</el-button
        >
      </template>
    </el-dialog>

    <!-- AI生成世界观对话框 -->
    <el-dialog
      v-model="aiWorldDialogVisible"
      title="AI生成世界观设定"
      width="500px"
    >
      <el-form :model="aiWorldForm" label-width="80px">
        <el-form-item label="主题">
          <el-input
            v-model="aiWorldForm.theme"
            placeholder="请输入小说主题，如：修仙、都市、悬疑等"
          />
        </el-form-item>
        <el-form-item label="设定类型">
          <el-select
            v-model="aiWorldForm.settingType"
            placeholder="请选择设定类型（可选）"
            clearable
          >
            <el-option label="世界背景" value="世界背景" />
            <el-option label="魔法体系" value="魔法体系" />
            <el-option label="社会制度" value="社会制度" />
            <el-option label="地理环境" value="地理环境" />
            <el-option label="历史事件" value="历史事件" />
            <el-option label="文化习俗" value="文化习俗" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiWorldDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="generatingWorld"
          @click="generateWorldSetting"
          >生成</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useNovelStore } from "../stores/novel";
import apiService from "../services/api";

const novelStore = useNovelStore();

// 人物管理
const characters = computed(() => novelStore.characters);
const characterDialogVisible = ref(false);
const newCharacter = ref({
  name: "",
  description: "",
  traitsInput: "",
});

// 世界观设定
const worldSettings = computed(() => novelStore.worldSettings);
const worldDialogVisible = ref(false);
const newWorldSetting = ref({
  title: "",
  description: "",
});

// 写作进度
const targetWordCount = ref(50000);
const currentWordCount = computed(() => novelStore.wordCount);
const progressPercentage = computed(() => {
  return Math.min(
    Math.round((currentWordCount.value / targetWordCount.value) * 100),
    100,
  );
});
const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage < 30) return "#f56c6c";
  if (percentage < 70) return "#e6a23c";
  return "#67c23a";
});
const estimatedTime = computed(() => {
  const remaining = targetWordCount.value - currentWordCount.value;
  if (remaining <= 0) return "已完成";
  const daysRemaining = Math.ceil(remaining / 1000); // 假设每天写1000字
  return `约${daysRemaining}天`;
});

// 灵感记录
const inspirations = ref([]);
const inspirationDialogVisible = ref(false);
const newInspiration = ref({
  content: "",
});

// AI生成相关
// apiService 已通过 import 导入
const aiCharacterDialogVisible = ref(false);
const aiWorldDialogVisible = ref(false);
const generatingCharacter = ref(false);
const generatingWorld = ref(false);

const aiCharacterForm = ref({
  theme: "",
  characterType: "",
});

const aiWorldForm = ref({
  theme: "",
  settingType: "",
});

// 人物管理方法
const addCharacter = () => {
  characterDialogVisible.value = true;
  newCharacter.value = { name: "", description: "", traitsInput: "" };
};

const saveCharacter = () => {
  if (!newCharacter.value.name.trim()) {
    ElMessage.warning("请输入人物姓名");
    return;
  }

  novelStore.addCharacter(newCharacter.value);

  characterDialogVisible.value = false;
  ElMessage.success("人物添加成功");
};

const removeCharacter = (id) => {
  novelStore.removeCharacter(id);
  ElMessage.success("人物删除成功");
};

// 世界观设定方法
const addWorldSetting = () => {
  worldDialogVisible.value = true;
  newWorldSetting.value = { title: "", description: "" };
};

const saveWorldSetting = () => {
  if (!newWorldSetting.value.title.trim()) {
    ElMessage.warning("请输入设定标题");
    return;
  }

  novelStore.addWorldSetting(newWorldSetting.value);

  worldDialogVisible.value = false;
  ElMessage.success("世界观设定添加成功");
};

const removeWorldSetting = (id) => {
  novelStore.removeWorldSetting(id);
  ElMessage.success("设定删除成功");
};

// 写作进度方法
const updateProgress = () => {
  ElMessage.success("进度已更新");
};

// 灵感记录方法
const addInspiration = () => {
  inspirationDialogVisible.value = true;
  newInspiration.value = { content: "" };
};

const saveInspiration = () => {
  if (!newInspiration.value.content.trim()) {
    ElMessage.warning("请输入灵感内容");
    return;
  }

  inspirations.value.unshift({
    id: Date.now(),
    content: newInspiration.value.content,
    timestamp: new Date().toLocaleString(),
  });

  inspirationDialogVisible.value = false;
  ElMessage.success("灵感记录成功");
};

const removeInspiration = (id) => {
  inspirations.value = inspirations.value.filter(
    (inspiration) => inspiration.id !== id,
  );
  ElMessage.success("灵感删除成功");
};

// AI生成方法
const generateCharacterWithAI = () => {
  aiCharacterDialogVisible.value = true;
  aiCharacterForm.value = { theme: "", characterType: "" };
};

const generateCharacter = async () => {
  if (!aiCharacterForm.value.theme.trim()) {
    ElMessage.warning("请输入小说主题");
    return;
  }

  generatingCharacter.value = true;
  try {
    const characterData = await apiService.generateCharacter(
      aiCharacterForm.value.theme,
      aiCharacterForm.value.characterType,
    );

    // 将AI生成的人物数据转换为本地格式
    const character = {
      name: characterData.name,
      description: `${characterData.appearance}\n\n性格：${characterData.personality}\n\n背景：${characterData.background}`,
      traitsInput: characterData.traits ? characterData.traits.join(", ") : "",
    };

    novelStore.addCharacter(character);
    aiCharacterDialogVisible.value = false;
    ElMessage.success("AI人物生成成功");
  } catch (error) {
    console.error("AI生成人物失败:", error);
    ElMessage.error("AI生成失败，请检查API配置");
  } finally {
    generatingCharacter.value = false;
  }
};

const generateWorldSettingWithAI = () => {
  aiWorldDialogVisible.value = true;
  aiWorldForm.value = { theme: "", settingType: "" };
};

const generateWorldSetting = async () => {
  if (!aiWorldForm.value.theme.trim()) {
    ElMessage.warning("请输入小说主题");
    return;
  }

  generatingWorld.value = true;
  try {
    const worldData = await apiService.generateWorldSetting(
      aiWorldForm.value.theme,
      aiWorldForm.value.settingType,
    );

    // 将AI生成的世界观数据转换为本地格式
    const setting = {
      title: worldData.title,
      description: `${worldData.overview}\n\n${worldData.description}\n\n地理环境：${worldData.geography}\n\n历史背景：${worldData.history}`,
    };

    novelStore.addWorldSetting(setting);
    aiWorldDialogVisible.value = false;
    ElMessage.success("AI世界观设定生成成功");
  } catch (error) {
    console.error("AI生成世界观失败:", error);
    ElMessage.error("AI生成失败，请检查API配置");
  } finally {
    generatingWorld.value = false;
  }
};
</script>

<style scoped>
.writing-tools {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.characters-list,
.world-settings,
.inspirations-list {
  max-height: 300px;
  overflow-y: auto;
}

.character-item,
.setting-item,
.inspiration-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
}

.character-info,
.setting-info,
.inspiration-content {
  flex: 1;
  margin-right: 12px;
}

.character-info h4,
.setting-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.character-info p,
.setting-info p {
  margin: 0 0 8px 0;
  color: #606266;
  line-height: 1.4;
}

.character-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-item span {
  min-width: 100px;
  color: #606266;
}

.inspiration-content p {
  margin: 0 0 4px 0;
  color: #303133;
  line-height: 1.4;
}

.inspiration-content small {
  color: #909399;
}

.empty-state {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
  font-style: italic;
}
</style>

<template>
  <div class="chapter-manager">
    <!-- 章节列表 -->
    <div class="chapter-list-section">
      <div class="section-header">
        <h3>📖 章节管理</h3>
        <div class="header-actions">
          <el-button
            type="primary"
            size="small"
            @click="showAddChapterDialog = true"
          >
            <el-icon><Plus /></el-icon>
            新增章节
          </el-button>
          <el-button
            size="small"
            :disabled="chapters.length === 0"
            @click="exportChapters"
          >
            <el-icon><Download /></el-icon>
            导出章节
          </el-button>
          <el-button size="small" @click="importChapters">
            <el-icon><Upload /></el-icon>
            导入章节
          </el-button>
        </div>
      </div>

      <!-- 章节统计 -->
      <div class="chapter-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ chapters.length }}</div>
              <div class="stat-label">总章节数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ completedChapters }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ totalWords }}</div>
              <div class="stat-label">总字数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ Math.round(completionRate) }}%</div>
              <div class="stat-label">完成率</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 章节列表 -->
      <div class="chapters-container">
        <div v-if="chapters.length === 0" class="empty-state">
          <el-empty description="暂无章节，点击新增章节开始创作" />
        </div>
        <div v-else class="chapters-grid">
          <div
            v-for="(chapter, index) in chapters"
            :key="chapter.id"
            class="chapter-card"
            :class="{ selected: selectedChapter?.id === chapter.id }"
            @click="selectChapter(chapter)"
          >
            <div class="chapter-header">
              <div class="chapter-number">第{{ index + 1 }}章</div>
              <div class="chapter-actions">
                <el-dropdown trigger="click">
                  <el-button type="text" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="editChapter(chapter)">
                        <el-icon><Edit /></el-icon>
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item @click="duplicateChapter(chapter)">
                        <el-icon><CopyDocument /></el-icon>
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item
                        :disabled="index === 0"
                        @click="moveChapterUp(index)"
                      >
                        <el-icon><ArrowUp /></el-icon>
                        上移
                      </el-dropdown-item>
                      <el-dropdown-item
                        :disabled="index === chapters.length - 1"
                        @click="moveChapterDown(index)"
                      >
                        <el-icon><ArrowDown /></el-icon>
                        下移
                      </el-dropdown-item>
                      <el-dropdown-item
                        divided
                        @click="deleteChapter(chapter.id)"
                      >
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="chapter-title">{{ chapter.title }}</div>
            <div class="chapter-summary">
              {{ chapter.summary || "暂无简介" }}
            </div>
            <div class="chapter-meta">
              <div class="meta-item">
                <el-icon><Document /></el-icon>
                <span>{{ chapter.wordCount || 0 }} 字</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatDate(chapter.updatedAt) }}</span>
              </div>
              <div class="meta-item">
                <el-tag
                  :type="
                    chapter.status === 'completed'
                      ? 'success'
                      : chapter.status === 'writing'
                        ? 'warning'
                        : 'info'
                  "
                  size="small"
                >
                  {{ getStatusText(chapter.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 章节详情 -->
    <div v-if="selectedChapter" class="chapter-detail-section">
      <el-card shadow="hover">
        <template #header>
          <div class="detail-header">
            <span>{{ selectedChapter.title }}</span>
            <div class="detail-actions">
              <el-button
                type="primary"
                size="small"
                @click="generateChapterContent"
              >
                <el-icon><MagicStick /></el-icon>
                AI生成内容
              </el-button>
              <el-button
                size="small"
                :disabled="!selectedChapter.content"
                @click="addToEditor"
              >
                <el-icon><EditPen /></el-icon>
                添加到编辑器
              </el-button>
            </div>
          </div>
        </template>

        <div class="chapter-content">
          <div class="content-section">
            <h4>章节大纲</h4>
            <p>{{ selectedChapter.outline || "暂无大纲" }}</p>
          </div>

          <div v-if="selectedChapter.content" class="content-section">
            <h4>章节内容</h4>
            <div class="content-preview">{{ selectedChapter.content }}</div>
          </div>

          <div v-if="selectedChapter.notes" class="content-section">
            <h4>创作笔记</h4>
            <p>{{ selectedChapter.notes }}</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑章节对话框 -->
    <el-dialog
      v-model="showAddChapterDialog"
      :title="editingChapter ? '编辑章节' : '新增章节'"
      width="600px"
    >
      <el-form
        ref="chapterFormRef"
        :model="chapterForm"
        :rules="chapterRules"
        label-width="80px"
      >
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="chapterForm.title" placeholder="请输入章节标题" />
        </el-form-item>

        <el-form-item label="章节简介" prop="summary">
          <el-input
            v-model="chapterForm.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入章节简介"
          />
        </el-form-item>

        <el-form-item label="章节大纲" prop="outline">
          <el-input
            v-model="chapterForm.outline"
            type="textarea"
            :rows="4"
            placeholder="请输入章节大纲"
          />
        </el-form-item>

        <el-form-item label="创作笔记">
          <el-input
            v-model="chapterForm.notes"
            type="textarea"
            :rows="3"
            placeholder="记录创作想法和注意事项"
          />
        </el-form-item>

        <el-form-item label="章节状态">
          <el-select v-model="chapterForm.status" placeholder="选择章节状态">
            <el-option label="计划中" value="planned" />
            <el-option label="写作中" value="writing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddChapterDialog = false">取消</el-button>
          <el-button type="primary" @click="saveChapter">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useNovelStore } from "@/stores/novel";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Download,
  Upload,
  MoreFilled,
  Edit,
  CopyDocument,
  ArrowUp,
  ArrowDown,
  Delete,
  Document,
  Clock,
  MagicStick,
  EditPen,
} from "@element-plus/icons-vue";

const novelStore = useNovelStore();

// 响应式数据
const chapters = ref([]);
const selectedChapter = ref(null);
const showAddChapterDialog = ref(false);
const editingChapter = ref(null);
const chapterFormRef = ref();

const chapterForm = ref({
  title: "",
  summary: "",
  outline: "",
  notes: "",
  status: "planned",
});

const chapterRules = {
  title: [{ required: true, message: "请输入章节标题", trigger: "blur" }],
};

// 计算属性
const completedChapters = computed(() => {
  return chapters.value.filter((chapter) => chapter.status === "completed")
    .length;
});

const totalWords = computed(() => {
  return chapters.value.reduce(
    (total, chapter) => total + (chapter.wordCount || 0),
    0,
  );
});

const completionRate = computed(() => {
  if (chapters.value.length === 0) return 0;
  return (completedChapters.value / chapters.value.length) * 100;
});

// 方法
const selectChapter = (chapter) => {
  selectedChapter.value = chapter;
};

const editChapter = (chapter) => {
  editingChapter.value = chapter;
  chapterForm.value = { ...chapter };
  showAddChapterDialog.value = true;
};

const duplicateChapter = (chapter) => {
  const newChapter = {
    ...chapter,
    id: Date.now(),
    title: chapter.title + " (副本)",
    status: "planned",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  chapters.value.push(newChapter);
  saveChapters();
  ElMessage.success("章节复制成功");
};

const moveChapterUp = (index) => {
  if (index > 0) {
    const temp = chapters.value[index];
    chapters.value[index] = chapters.value[index - 1];
    chapters.value[index - 1] = temp;
    saveChapters();
  }
};

const moveChapterDown = (index) => {
  if (index < chapters.value.length - 1) {
    const temp = chapters.value[index];
    chapters.value[index] = chapters.value[index + 1];
    chapters.value[index + 1] = temp;
    saveChapters();
  }
};

const deleteChapter = async (chapterId) => {
  try {
    await ElMessageBox.confirm("确定要删除这个章节吗？", "确认删除", {
      type: "warning",
    });

    chapters.value = chapters.value.filter(
      (chapter) => chapter.id !== chapterId,
    );
    if (selectedChapter.value?.id === chapterId) {
      selectedChapter.value = null;
    }
    saveChapters();
    ElMessage.success("章节删除成功");
  } catch {
    // 用户取消删除
  }
};

const saveChapter = async () => {
  try {
    await chapterFormRef.value.validate();

    if (editingChapter.value) {
      // 编辑现有章节
      const index = chapters.value.findIndex(
        (c) => c.id === editingChapter.value.id,
      );
      if (index !== -1) {
        chapters.value[index] = {
          ...chapters.value[index],
          ...chapterForm.value,
          updatedAt: new Date(),
        };
      }
    } else {
      // 新增章节
      const newChapter = {
        id: Date.now(),
        ...chapterForm.value,
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      chapters.value.push(newChapter);
    }

    saveChapters();
    showAddChapterDialog.value = false;
    editingChapter.value = null;
    resetForm();
    ElMessage.success(editingChapter.value ? "章节更新成功" : "章节创建成功");
  } catch (error) {
    console.error("保存章节失败:", error);
  }
};

const resetForm = () => {
  chapterForm.value = {
    title: "",
    summary: "",
    outline: "",
    notes: "",
    status: "planned",
  };
};

const generateChapterContent = async () => {
  if (!selectedChapter.value) return;

  try {
    // 这里调用AI生成内容的逻辑
    ElMessage.info("AI内容生成功能开发中...");
  } catch (error) {
    ElMessage.error("生成内容失败");
  }
};

const addToEditor = () => {
  if (selectedChapter.value?.content) {
    novelStore.setCurrentNovel(selectedChapter.value.content);
    ElMessage.success("章节内容已添加到编辑器");
  }
};

const exportChapters = () => {
  const data = JSON.stringify(chapters.value, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chapters_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("章节导出成功");
};

const importChapters = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedChapters = JSON.parse(e.target.result);
          chapters.value = [...chapters.value, ...importedChapters];
          saveChapters();
          ElMessage.success("章节导入成功");
        } catch (error) {
          ElMessage.error("导入失败，文件格式错误");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const saveChapters = () => {
  localStorage.setItem("novel_chapters", JSON.stringify(chapters.value));
};

const loadChapters = () => {
  try {
    const saved = localStorage.getItem("novel_chapters");
    if (saved) {
      chapters.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载章节失败:", error);
  }
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

const getStatusText = (status) => {
  const statusMap = {
    planned: "计划中",
    writing: "写作中",
    completed: "已完成",
  };
  return statusMap[status] || "未知";
};

// 生命周期
onMounted(() => {
  loadChapters();
});
</script>

<style scoped>
.chapter-manager {
  display: flex;
  gap: 20px;
  height: 100%;
}

.chapter-list-section {
  flex: 1;
  min-width: 0;
}

.chapter-detail-section {
  width: 400px;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chapter-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.chapter-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.chapter-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chapter-card.selected {
  border-color: #409eff;
  background: #f0f9ff;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chapter-number {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.chapter-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.chapter-summary {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapter-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.chapter-content {
  max-height: 600px;
  overflow-y: auto;
}

.content-section {
  margin-bottom: 20px;
}

.content-section h4 {
  margin-bottom: 8px;
  color: #303133;
}

.content-preview {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.mr-2 {
  margin-right: 8px;
}
</style>

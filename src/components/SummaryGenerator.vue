<template>
  <div class="summary-generator">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📄 文章摘要生成</span>
          <el-button
            type="primary"
            size="small"
            :loading="isGeneratingSummary"
            :disabled="!hasContent"
            @click="generateSummary"
          >
            {{ isGeneratingSummary ? "生成中..." : "生成摘要" }}
          </el-button>
        </div>
      </template>

      <div class="summary-content">
        <div v-if="hasContent" class="source-info">
          <el-tag type="info" size="small">
            原文字数：{{ sourceWordCount }} 字
          </el-tag>
          <el-tag type="success" size="small" style="margin-left: 8px">
            预计阅读时间：{{ estimatedReadTime }} 分钟
          </el-tag>
        </div>

        <div v-if="hasContent" class="summary-settings">
          <el-row :gutter="16">
            <el-col :span="12">
              <label class="setting-label">摘要长度</label>
              <el-select
                v-model="summaryLength"
                size="small"
                style="width: 100%"
              >
                <el-option label="简短 (50-100字)" value="short" />
                <el-option label="中等 (100-200字)" value="medium" />
                <el-option label="详细 (200-300字)" value="long" />
              </el-select>
            </el-col>
            <el-col :span="12">
              <label class="setting-label">摘要类型</label>
              <el-select v-model="summaryType" size="small" style="width: 100%">
                <el-option label="关键要点" value="keypoints" />
                <el-option label="故事梗概" value="plot" />
                <el-option label="人物分析" value="character" />
                <el-option label="主题思想" value="theme" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <div v-if="articleSummary" class="summary-result">
          <h4>📋 生成的摘要</h4>
          <div class="summary-text">
            {{ articleSummary }}
          </div>
          <div class="summary-actions">
            <el-button size="small" @click="copySummary">
              <el-icon><DocumentCopy /></el-icon>
              复制摘要
            </el-button>
            <el-button size="small" @click="exportSummary">
              <el-icon><Download /></el-icon>
              导出摘要
            </el-button>
            <el-button size="small" type="danger" @click="clearSummary">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <div v-if="!hasContent" class="empty-state">
          <el-empty description="请先在编辑器中输入内容，然后生成摘要" />
        </div>

        <div
          v-if="hasContent && !articleSummary && !isGeneratingSummary"
          class="no-summary"
        >
          <el-empty description="点击上方按钮生成文章摘要" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useNovelStore } from "@/stores/novel";
import { ElMessage } from "element-plus";
import { DocumentCopy, Download, Delete } from "@element-plus/icons-vue";

const novelStore = useNovelStore();

// 响应式数据
const summaryLength = ref("medium");
const summaryType = ref("keypoints");

// 计算属性
const hasContent = computed(() => {
  return novelStore.currentNovel && novelStore.currentNovel.trim().length > 0;
});

const sourceWordCount = computed(() => {
  if (!hasContent.value) return 0;
  return novelStore.currentNovel.replace(/\s+/g, "").length;
});

const estimatedReadTime = computed(() => {
  if (!hasContent.value) return 0;
  // 按照每分钟300字的阅读速度计算
  return Math.ceil(sourceWordCount.value / 300);
});

const articleSummary = computed(() => novelStore.articleSummary);
const isGeneratingSummary = computed(() => novelStore.isGeneratingSummary);
const isApiConfigured = computed(() => novelStore.isApiConfigured);

// 方法
const generateSummary = async () => {
  if (!hasContent.value) {
    ElMessage.warning("请先输入内容");
    return;
  }

  try {
    if (isApiConfigured.value) {
      // 使用真实API生成摘要
      await novelStore.generateSummaryWithAPI({
        content: novelStore.currentNovel,
        length: summaryLength.value,
        type: summaryType.value,
      });
      ElMessage.success("摘要生成成功！");
    } else {
      // 使用模拟数据
      novelStore.setGeneratingSummary(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockSummary = generateMockSummary();
      novelStore.setArticleSummary(mockSummary);
      ElMessage.success("摘要生成成功！（使用模拟数据）");
      novelStore.setGeneratingSummary(false);
    }
  } catch (error) {
    ElMessage.error("摘要生成失败：" + error.message);
    if (!isApiConfigured.value) {
      novelStore.setGeneratingSummary(false);
    }
  }
};

const generateMockSummary = () => {
  const content = novelStore.currentNovel;
  const wordCount = sourceWordCount.value;

  let summary = "";

  switch (summaryType.value) {
    case "keypoints":
      summary = `本文主要包含以下要点：\n\n1. 核心内容围绕主要情节展开\n2. 人物关系复杂，情感线丰富\n3. 故事背景设定独特，世界观完整\n4. 文笔流畅，描写生动细腻\n\n全文共${wordCount}字，预计阅读时间${estimatedReadTime.value}分钟。`;
      break;
    case "plot":
      summary = `故事梗概：\n\n这是一个引人入胜的故事，主角在面临重重困难时展现出坚韧不拔的精神。故事情节跌宕起伏，从开始的平静生活到后来的惊心动魄，每一个转折都牵动着读者的心。通过精彩的情节设计和深刻的人物刻画，作者成功地构建了一个完整而富有张力的故事世界。`;
      break;
    case "character":
      summary = `人物分析：\n\n主要人物性格鲜明，各具特色。主角具有强烈的正义感和责任心，在困境中不断成长和蜕变。配角们也都有着自己的故事线和性格特点，为整个故事增添了丰富的层次。人物之间的关系错综复杂，既有友情的温暖，也有爱情的甜蜜，更有敌对的紧张，这些关系的交织构成了故事的主要矛盾和推动力。`;
      break;
    case "theme":
      summary = `主题思想：\n\n本文深刻探讨了人性、成长、友情等永恒主题。通过主角的经历，作者传达了积极向上的人生态度和价值观念。故事强调了坚持梦想、勇于面对困难的重要性，同时也展现了人与人之间真挚情感的珍贵。整部作品充满正能量，给读者带来思考和启发。`;
      break;
  }

  // 根据长度设置调整摘要
  if (summaryLength.value === "short") {
    summary = summary.substring(0, 100) + "...";
  } else if (summaryLength.value === "long") {
    summary +=
      "\n\n这部作品不仅具有很强的可读性，也具有一定的文学价值和教育意义，值得细细品味。";
  }

  return summary;
};

const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(articleSummary.value);
    ElMessage.success("摘要已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

const exportSummary = () => {
  if (!articleSummary.value) {
    ElMessage.warning("没有可导出的摘要");
    return;
  }

  const blob = new Blob([articleSummary.value], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `文章摘要_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("摘要导出成功");
};

const clearSummary = () => {
  novelStore.setArticleSummary("");
  ElMessage.success("摘要已清空");
};
</script>

<style scoped>
.summary-generator {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.summary-content {
  min-height: 200px;
}

.source-info {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.summary-settings {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafbfc;
}

.setting-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.summary-result {
  margin-top: 20px;
}

.summary-result h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.summary-text {
  padding: 16px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  line-height: 1.6;
  color: #1e40af;
  white-space: pre-wrap;
  margin-bottom: 12px;
}

.summary-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.empty-state,
.no-summary {
  padding: 40px 20px;
  text-align: center;
}

:deep(.el-empty__description) {
  color: #909399;
}
</style>

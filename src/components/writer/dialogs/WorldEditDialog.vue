<template>
  <!-- 世界观设定编辑对话框 -->
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑世界观设定' : '新增世界观设定'"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="设定标题" required>
        <el-input
          v-model="form.title"
          placeholder="请输入设定标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="设定分类">
        <el-select v-model="form.category" style="width: 100%">
          <el-option label="基础设定" value="setting" />
          <el-option label="地理环境" value="geography" />
          <el-option label="文化社会" value="culture" />
          <el-option label="历史背景" value="history" />
          <el-option label="魔法体系" value="magic" />
          <el-option label="科技水平" value="technology" />
          <el-option label="政治势力" value="politics" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="设定描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入设定描述"
        />
      </el-form-item>

      <el-form-item label="详细内容">
        <el-input
          v-model="form.details"
          type="textarea"
          :rows="6"
          placeholder="请输入详细的设定内容"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="display: flex; gap: 8px; justify-content: flex-end">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="form.title"
          :loading="isGenerating"
          @click="emit('generate')"
        >
          AI生成描述
        </el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  form: {
    type: Object,
    default: () => ({
      id: null,
      title: "",
      description: "",
      category: "setting",
      details: "",
    }),
  },
  isEditing: Boolean,
  isGenerating: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "generate", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const handleClose = () => {
  emit("close");
};

const handleSave = () => {
  emit("save", props.form);
};
</script>

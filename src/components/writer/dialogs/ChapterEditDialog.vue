<template>
  <!-- 章节编辑对话框 -->
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑章节' : '新增章节'"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="章节标题" required>
        <el-input
          v-model="form.title"
          placeholder="请输入章节标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="章节大纲">
        <div style="display: flex; gap: 8px; align-items: flex-start">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入章节大纲描述"
            maxlength="500"
            show-word-limit
            style="flex: 1"
          />
          <el-button
            :loading="isGeneratingOutline"
            style="flex-shrink: 0; height: 80px"
            @click="emit('generate-outline')"
          >
            AI生成
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="章节状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option label="草稿" value="draft" />
          <el-option label="完成" value="completed" />
          <el-option label="发表" value="published" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
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
      title: "",
      description: "",
      status: "draft",
    }),
  },
  isEditing: Boolean,
  isGeneratingOutline: Boolean,
});

const emit = defineEmits([
  "update:modelValue",
  "save",
  "generate-outline",
  "close",
]);

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

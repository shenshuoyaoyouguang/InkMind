<template>
  <!-- 事件编辑对话框 -->
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑事件' : '新增事件'"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="事件标题" required>
        <el-input
          v-model="form.title"
          placeholder="请输入事件标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="事件时间">
        <el-date-picker
          v-model="form.time"
          type="datetime"
          placeholder="选择事件发生时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>

      <el-form-item label="所属章节">
        <el-input v-model="form.chapter" placeholder="请输入所属章节" />
      </el-form-item>

      <el-form-item label="重要程度">
        <el-select v-model="form.importance" style="width: 100%">
          <el-option label="重大事件" value="major" />
          <el-option label="重要事件" value="important" />
          <el-option label="一般事件" value="normal" />
        </el-select>
      </el-form-item>

      <el-form-item label="事件描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入事件描述"
        />
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
      id: null,
      title: "",
      description: "",
      chapter: "",
      time: "",
      importance: "normal",
    }),
  },
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "close"]);

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

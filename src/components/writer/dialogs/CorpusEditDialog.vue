<template>
  <!-- 语料库编辑对话框 -->
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑语料' : '新增语料'"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="语料标题" required>
        <el-input
          v-model="form.title"
          placeholder="请输入语料标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="语料类型">
        <el-select v-model="form.type" style="width: 100%">
          <el-option
            v-for="type in corpusTypes"
            :key="type.key"
            :label="type.name"
            :value="type.key"
          >
            <span>{{ type.icon }} {{ type.name }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="语料内容">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入语料内容"
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
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
      id: null,
      title: "",
      type: "description",
      content: "",
      tags: [],
    }),
  },
  isEditing: Boolean,
  corpusTypes: {
    type: Array,
    default: () => [
      { key: "description", name: "描写类" },
      { key: "dialogue", name: "对话类" },
      { key: "action", name: "动作类" },
      { key: "psychology", name: "心理类" },
      { key: "environment", name: "环境类" },
      { key: "custom", name: "自定义" },
    ],
  },
});

const emit = defineEmits(["update:modelValue", "save", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const commonTags = [
  "人物描写",
  "场景描写",
  "心理描写",
  "动作描写",
  "对话描写",
  "环境描写",
  "氛围渲染",
  "细节描写",
  "比喻修辞",
  "古风",
  "现代",
  "都市",
  "玄幻",
  "仙侠",
  "科幻",
];

const handleClose = () => {
  emit("close");
};

const handleSave = () => {
  emit("save", props.form);
};
</script>

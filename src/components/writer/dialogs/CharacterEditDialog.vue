<template>
  <!-- 角色编辑对话框 -->
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑角色' : '新增角色'"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="角色姓名" required>
        <el-input
          v-model="form.name"
          placeholder="请输入角色姓名"
          maxlength="50"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="角色定位">
            <el-select v-model="form.role" style="width: 100%">
              <el-option label="主角" value="main" />
              <el-option label="配角" value="supporting" />
              <el-option label="次要角色" value="minor" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别">
            <el-select v-model="form.gender" style="width: 100%">
              <el-option label="男" value="male" />
              <el-option label="女" value="female" />
              <el-option label="未知" value="unknown" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="年龄">
        <el-input-number
          v-model="form.age"
          :min="0"
          :max="999"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="外貌">
        <el-input
          v-model="form.appearance"
          type="textarea"
          :rows="2"
          placeholder="描述角色外貌特征"
        />
      </el-form-item>

      <el-form-item label="性格">
        <el-input
          v-model="form.personality"
          type="textarea"
          :rows="2"
          placeholder="描述角色性格特点"
        />
      </el-form-item>

      <el-form-item label="背景">
        <el-input
          v-model="form.background"
          type="textarea"
          :rows="3"
          placeholder="描述角色背景故事"
        />
      </el-form-item>

      <el-form-item label="角色标签">
        <div class="tags-input">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            style="margin-right: 8px; margin-bottom: 4px"
            @close="removeTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
        <el-input
          v-model="tagInput"
          placeholder="输入标签后按回车添加"
          size="small"
          style="margin-top: 8px"
          @keyup.enter="addTag"
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
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  form: {
    type: Object,
    default: () => ({
      id: null,
      name: "",
      role: "supporting",
      gender: "male",
      age: 25,
      appearance: "",
      personality: "",
      background: "",
      tags: [],
      avatar: "",
    }),
  },
  isEditing: Boolean,
});

const emit = defineEmits(["update:modelValue", "save", "close"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const tagInput = ref("");

const removeTag = (tag) => {
  const index = props.form.tags.indexOf(tag);
  if (index > -1) {
    props.form.tags.splice(index, 1);
  }
};

const addTag = () => {
  const trimmed = tagInput.value.trim();
  if (trimmed && !props.form.tags.includes(trimmed)) {
    props.form.tags.push(trimmed);
  }
  tagInput.value = "";
};

const handleClose = () => {
  tagInput.value = "";
  emit("close");
};

const handleSave = () => {
  emit("save", props.form);
};
</script>

<style scoped>
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

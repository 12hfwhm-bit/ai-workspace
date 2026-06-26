<template>
  <div class="form-renderer" v-if="schema">
    <h3 class="form-renderer__title">{{ schema.title }}</h3>
    <el-form
      ref="formRef"
      :model="formData"
      label-width="100px"
      label-position="top"
      size="default"
    >
      <el-form-item
        v-for="field in schema.fields"
        :key="field.prop"
        :label="field.label"
        :required="field.required"
        :prop="field.prop"
        :rules="field.required ? [{ required: true, message: '请填写' + field.label, trigger: 'blur' }] : []"
      >
        <!-- input -->
        <el-input
          v-if="field.type === 'input'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请输入' + field.label"
          clearable
        />

        <!-- textarea -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请输入' + field.label"
          type="textarea"
          :rows="3"
          clearable
        />

        <!-- select -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="opt in field.options || []"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>

        <!-- date -->
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="formData[field.prop]"
          type="date"
          :placeholder="field.placeholder || '选择日期'"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />

        <!-- number -->
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.prop]"
          :placeholder="field.placeholder || '请输入'"
          style="width: 100%"
          :min="0"
        />
      </el-form-item>

      <el-form-item>
        <div class="form-actions">
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { FormSchema } from '@/api/ai'

const props = defineProps<{ schema: FormSchema | null }>()
const emit = defineEmits<{ submit: [data: Record<string, any>] }>()

const formRef = ref<FormInstance>()
const formData = reactive<Record<string, any>>({})

// Schema 变化时重建 formData
watch(() => props.schema, (val) => {
  Object.keys(formData).forEach(k => delete formData[k])
  if (val?.fields) {
    val.fields.forEach(f => {
      formData[f.prop] = f.type === 'number' ? undefined : ''
    })
  }
}, { immediate: true })

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善表单信息')
    return
  }
  emit('submit', { ...formData })
}

function resetForm() {
  if (props.schema?.fields) {
    props.schema.fields.forEach(f => {
      formData[f.prop] = f.type === 'number' ? undefined : ''
    })
  }
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.form-renderer {
  padding: 4px 0;
}

.form-renderer__title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}
</style>

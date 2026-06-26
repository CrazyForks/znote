<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { NInput, NModal, NSelect, useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import req from "@/utils/req";

const { t } = useI18n();
const message = useMessage();

const props = defineProps<{
    show: boolean;
    /** 编辑时传入 doc 对象，新增时传 null */
    doc?: Record<string, any> | null;
}>();

const emit = defineEmits<{
    (e: "update:show", value: boolean): void;
    (e: "saved"): void;
}>();

/** 是否为编辑模式 */
const isEdit = computed(() => !!props.doc);

/** 顶层笔记本下拉选项 */
const notebookOptions = ref<{ label: string; value: number }[]>([]);
const notebookLoading = ref(false);

/** 表单字段 */
const notebookId = ref<number | null>(null);
const slug = ref("");
const title = ref("");
const description = ref("");
const keywords = ref("");
const status = ref<"active" | "inactive">("active");

/** 提交按钮加载态 */
const submitting = ref(false);

const statusOptions = computed(() => [
    { label: t("doc.form.status_active"), value: "active" },
    { label: t("doc.form.status_inactive"), value: "inactive" },
]);

/** 获取顶层笔记本列表 */
const fetchNotebooks = async () => {
    notebookLoading.value = true;
    try {
        const res = await req.get("/api/admin/notebook/top");
        if (res.data?.code === 200) {
            notebookOptions.value = (res.data.data || []).map((nb: any) => ({
                label: nb.username ? `${nb.title} (${nb.username})` : nb.title,
                value: nb.id,
            }));
        }
    } finally {
        notebookLoading.value = false;
    }
};

/** 重置表单 */
const resetForm = () => {
    notebookId.value = null;
    slug.value = "";
    title.value = "";
    description.value = "";
    keywords.value = "";
    status.value = "active";
    submitting.value = false;
};

/** 编辑模式下预填表单 */
const fillForm = () => {
    if (props.doc) {
        notebookId.value = props.doc.notebook_id ?? null;
        slug.value = props.doc.slug ?? "";
        title.value = props.doc.title ?? "";
        description.value = props.doc.description ?? "";
        keywords.value = props.doc.keywords ?? "";
        status.value = props.doc.status ?? "active";
    }
};

watch(
    () => props.show,
    (val) => {
        if (val) {
            resetForm();
            fetchNotebooks();
            if (isEdit.value) {
                fillForm();
            }
        }
    },
);

const handleClose = () => {
    emit("update:show", false);
};

const handleConfirm = async () => {
    // 必填校验
    if (!notebookId.value) {
        message.warning(t("doc.create.notebook_required"));
        return;
    }
    if (!slug.value.trim()) {
        message.warning(t("doc.create.slug_required"));
        return;
    }

    submitting.value = true;
    try {
        const payload: Record<string, any> = {
            notebook_id: notebookId.value,
            slug: slug.value.trim(),
            title: title.value,
            description: description.value,
            keywords: keywords.value,
            status: status.value,
        };

        const url = isEdit.value
            ? "/api/admin/doc/update"
            : "/api/admin/doc/create";

        if (isEdit.value) {
            payload.id = props.doc!.id;
        }

        const res = await req.post(url, payload);
        if (res.data?.code !== 200) {
            message.error(t(res.data?.msg || "error"));
            return;
        }
        message.success(t(res.data.msg));
        handleClose();
        emit("saved");
    } finally {
        submitting.value = false;
    }
};

const dialogTitle = computed(() =>
    isEdit.value ? t("doc.form.title_edit") : t("doc.form.title_create"),
);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="dialogTitle"
    class="max-w-lg"
    :mask-closable="!submitting"
    :close-on-esc="!submitting"
    @update:show="handleClose"
  >
    <div class="space-y-4">
      <!-- 选择笔记本 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.notebook") }}</label>
        <NSelect
          v-model:value="notebookId"
          :options="notebookOptions"
          :placeholder="t('doc.form.notebook.placeholder')"
          :loading="notebookLoading"
          :disabled="submitting"
          filterable
        />
      </div>

      <!-- URL 标识 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.slug") }}</label>
        <NInput
          v-model:value="slug"
          :placeholder="t('doc.form.slug.placeholder')"
          :disabled="submitting"
          maxlength="64"
        />
      </div>

      <!-- 公开标题 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.title") }}</label>
        <NInput
          v-model:value="title"
          :placeholder="t('doc.form.title.placeholder')"
          :disabled="submitting"
          maxlength="100"
        />
      </div>

      <!-- 公开描述 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.description") }}</label>
        <NInput
          v-model:value="description"
          type="textarea"
          :disabled="submitting"
          maxlength="500"
          :rows="3"
        />
      </div>

      <!-- SEO 关键词 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.keywords") }}</label>
        <NInput
          v-model:value="keywords"
          :disabled="submitting"
          maxlength="200"
        />
      </div>

      <!-- 状态 -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">{{ t("doc.form.status") }}</label>
        <NSelect
          v-model:value="status"
          :options="statusOptions"
          :disabled="submitting"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          class="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          :disabled="submitting"
          @click="handleClose"
        >
          {{ t("note.dialog.cancel") }}
        </button>
        <button
          class="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="submitting"
          @click="handleConfirm"
        >
          {{ t("note.dialog.confirm") }}
        </button>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
/**
 * 创建笔记分享对话框
 *
 * 用户可设置分享密码（可选）、到期时间（可选），
 * 创建成功后展示访问地址和密码，支持一键复制。
 */
import { ref, watch } from "vue";
import { NButton, NDatePicker, NInput, NModal, useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import { createShare } from "@/api/share";

const { t } = useI18n();
const message = useMessage();

const props = defineProps<{
    show: boolean;
    noteId: number;
    /** 分享笔记的标题 */
    noteTitle: string;
}>();

/** Vue 模板无法直接访问 window，预先提取 */
const shareOrigin = window.location.origin;

const emit = defineEmits<{
    (e: "update:show", value: boolean): void;
}>();

/** 随机生成 6 位字母数字密码 */
const generateRandomPassword = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/** 分享密码 */
const password = ref("");
/** 到期时间（NaiveUI 日期选择器返回毫秒时间戳） */
const expiresAt = ref<number | null>(null);
/** 创建加载态 */
const submitting = ref(false);
/** 创建成功后存储分享结果 */
const createdShare = ref<{ share_id: string; password: string | null } | null>(null);

/** 弹窗打开时重置所有状态 */
watch(
    () => props.show,
    (val) => {
        if (val) {
            password.value = generateRandomPassword();
            expiresAt.value = null;
            submitting.value = false;
            createdShare.value = null;
        }
    },
);

/** 密码校验：非空时必须为 4-16 位字母数字 */
const passwordInvalid = ref(false);
const validatePassword = () => {
    const val = password.value;
    if (!val) {
        passwordInvalid.value = false;
        return;
    }
    passwordInvalid.value = !/^[A-Za-z0-9]{4,16}$/.test(val);
};

/** 今天零时时间戳（日期选择器禁用过去日期） */
const todayStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
})();

/** 创建分享 */
const handleCreate = async () => {
    if (password.value && passwordInvalid.value) return;

    submitting.value = true;
    const payload: { password?: string; expires_at?: number } = {};

    if (password.value) {
        payload.password = password.value;
    }

    if (expiresAt.value) {
        // 日期选择器返回选中日 00:00:00 的时间戳，调整为当天 23:59:59 到期
        const endOfDay = new Date(expiresAt.value);
        endOfDay.setHours(23, 59, 59, 999);
        payload.expires_at = endOfDay.getTime();
    }

    const result = await createShare(props.noteId, payload);
    submitting.value = false;

    if (result) {
        createdShare.value = result;
        message.success(t("share.create.success"));
    }
};

/** 一键复制访问地址 + 密码 */
const handleCopy = async () => {
    if (!createdShare.value) return;

    const url = `${window.location.origin}/s/${createdShare.value.share_id}`;
    const pwd = createdShare.value.password || t("note.share.no_password");
    const text = `${t("note.share.result.url")}: ${url}\n${t("note.share.result.password")}: ${pwd}`;

    try {
        await navigator.clipboard.writeText(text);
        message.success(t("note.share.result.copied"));
    } catch {
        message.success(t("note.share.result.copied"));
    }
};

/** 关闭弹窗 */
const handleClose = () => {
    emit("update:show", false);
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="t('note.share.title')"
    class="max-w-md"
    :mask-closable="!submitting"
    :close-on-esc="!submitting"
    @update:show="handleClose"
  >
    <!-- 笔记标题 -->
    <div class="mb-4 rounded-lg bg-blue-50 px-3 py-2.5">
      <p class="text-xs text-slate-500">{{ t("note.share.source_note") }}</p>
      <p class="mt-0.5 truncate text-sm font-medium text-slate-800">{{ noteTitle }}</p>
    </div>

    <!-- 分享密码 -->
    <div class="mb-4">
      <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ t("note.share.password") }}</label>
      <NInput
        v-model:value="password"
        :placeholder="t('note.share.password.placeholder')"
        :disabled="submitting"
        maxlength="16"
        :status="passwordInvalid ? 'error' : undefined"
        clearable
        @input="validatePassword"
      />
      <p v-if="passwordInvalid" class="mt-1 text-xs text-red-500">
        {{ t("note.share.password.hint") }}
      </p>
      <p v-else class="mt-1 text-xs text-slate-400">
        {{ t("note.share.password.placeholder") }}
      </p>
    </div>

    <!-- 到期时间 -->
    <div class="mb-4">
      <label class="mb-1.5 block text-sm font-medium text-slate-700">{{ t("note.share.expires_at") }}</label>
      <NDatePicker
        v-model:value="expiresAt"
        type="date"
        :placeholder="t('note.share.expires_at.placeholder')"
        :disabled="submitting"
        :is-date-disabled="(ts: number) => ts < todayStart"
        clearable
        class="w-full"
      />
      <p class="mt-1 text-xs text-slate-400">
        {{ t("note.share.expires_at.placeholder") }}
      </p>
    </div>

    <!-- 创建成功后展示结果 -->
    <div v-if="createdShare" class="rounded-lg bg-slate-50 p-4">
      <p class="mb-3 text-sm font-medium text-slate-700">{{ t("note.share.result.title") }}</p>

      <div class="mb-2 flex items-center gap-2">
        <span class="shrink-0 text-xs text-slate-500">{{ t("note.share.result.url") }}</span>
        <code class="truncate rounded bg-white px-2 py-0.5 text-xs text-blue-600">{{ shareOrigin }}/s/{{ createdShare.share_id }}</code>
      </div>

      <div v-if="createdShare.password" class="mb-3 flex items-center gap-2">
        <span class="shrink-0 text-xs text-slate-500">{{ t("note.share.result.password") }}</span>
        <code class="rounded bg-white px-2 py-0.5 text-xs text-slate-700">{{ createdShare.password }}</code>
      </div>
      <div v-else class="mb-3 text-xs text-slate-400">{{ t("note.share.no_password") }}</div>

      <NButton size="small" type="primary" @click="handleCopy">
        <template #icon>
          <ZIcon name="ri:file-copy-line" :size="14" />
        </template>
        {{ t("note.share.result.copy") }}
      </NButton>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          class="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          :disabled="submitting"
          @click="handleClose"
        >
          {{ createdShare ? t("note.dialog.close") : t("note.dialog.cancel") }}
        </button>
        <button
          v-if="!createdShare"
          class="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="(!!password.value && passwordInvalid) || submitting"
          @click="handleCreate"
        >
          {{ t("note.share.create") }}
        </button>
      </div>
    </template>
  </NModal>
</template>

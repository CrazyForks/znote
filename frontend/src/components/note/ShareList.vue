<script setup lang="ts">
/**
 * 我的分享列表组件
 *
 * 展示当前用户创建的所有笔记分享，每条包含：
 *   - 笔记标题（可点击，新窗口打开分享页面）
 *   - 状态标签、到期时间
 *   - 复制按钮（Popover 预览 + 一键复制）、删除按钮（Popconfirm）
 */
import { computed, ref } from "vue";
import { NPopconfirm, NPopover, NSpin, useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import { deleteShare } from "@/api/share";
import type { ShareItem } from "@/types/note";

const { t } = useI18n();
const message = useMessage();

/** Vue 模板无法直接访问 window，预先提取 */
const shareOrigin = window.location.origin;

const props = defineProps<{
    shares: ShareItem[];
    loading: boolean;
    isMobile: boolean;
}>();

const emit = defineEmits<{
    (e: "deleted"): void;
}>();

/** 搜索关键词 */
const keyword = ref("");
/** 删除加载态（按分享 id 跟踪） */
const deletingId = ref<number | null>(null);

/** 前端筛选后的分享列表（按 note_title 模糊匹配） */
const filteredShares = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return props.shares;
    return props.shares.filter((s) => s.note_title.toLowerCase().includes(kw));
});

/** 格式化日期（不含时间） */
const formatDate = (ts: number | string | null): string => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

/** 一键复制链接 + 密码 */
const handleCopy = async (share: ShareItem) => {
    const url = `${shareOrigin}/s/${share.share_id}`;
    const lines = [`${t("note.share.result.url")}: ${url}`];
    if (share.password) {
        lines.push(`${t("note.share.result.password")}: ${share.password}`);
    }
    try {
        await navigator.clipboard.writeText(lines.join("\n"));
        message.success(t("note.share.result.copied"));
    } catch {
        message.success(t("note.share.result.copied"));
    }
};

/** 删除分享 */
const handleDelete = async (id: number) => {
    deletingId.value = id;
    try {
        const ok = await deleteShare(id);
        if (ok) {
            message.success(t("share.delete.success"));
            emit("deleted");
        }
    } finally {
        deletingId.value = null;
    }
};

/** 判断分享是否已过期 */
const isExpired = (share: ShareItem): boolean => {
    if (!share.expires_at) return false;
    return new Date(share.expires_at).getTime() < Date.now();
};

/** 新窗口打开分享页面 */
const handleOpenShare = (shareId: string) => {
    window.open(`/s/${shareId}`, "_blank");
};
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 顶部搜索框 -->
    <div class="relative flex shrink-0 items-center border-b border-slate-200/60 bg-white px-3 py-2.5">
      <ZIcon name="ri:search-line" :size="isMobile ? 16 : 14" color="#94a3b8" class="pointer-events-none absolute left-5 z-10" />
      <input
        v-model="keyword"
        type="text"
        :placeholder="t('note.shares.search_placeholder')"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-8 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        @keydown.escape="keyword = ''"
      />
      <button
        v-if="keyword"
        class="absolute right-4 z-10 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        @click="keyword = ''"
      >
        <ZIcon name="ri:close-line" :size="14" color="currentColor" />
      </button>
    </div>

    <!-- 列表主体 -->
    <div class="flex-1 overflow-y-auto bg-[#f7f8fa] p-3">
      <NSpin v-if="loading" class="block py-12" />

      <!-- 有数据 -->
      <div v-else-if="filteredShares.length > 0" class="space-y-2">
        <div
          v-for="share in filteredShares"
          :key="share.id"
          class="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
        >
          <!-- 笔记标题（点击新窗口打开分享页面） -->
          <p
            class="mb-2 cursor-pointer truncate text-sm font-medium text-slate-800 transition hover:text-blue-600"
            @click="handleOpenShare(share.share_id)"
          >
            {{ share.note_title }}
          </p>

          <!-- 底部：状态 + 到期时间 + 操作按钮 -->
          <div class="flex items-center gap-3">
            <!-- 状态标签 -->
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="isExpired(share)
                ? 'bg-red-50 text-red-500'
                : share.status === 'active'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-400'"
            >
              {{ isExpired(share)
                ? t('note.shares.status.expired')
                : share.status === 'active'
                ? t('note.shares.status.active')
                : t('note.shares.status.revoked') }}
            </span>

            <!-- 到期时间 -->
            <span class="inline-flex items-center gap-1 text-xs text-slate-400">
              <ZIcon name="ri:time-line" :size="12" color="currentColor" />
              <template v-if="share.expires_at">{{ formatDate(share.expires_at) }}</template>
              <template v-else>{{ t('note.shares.never_expire') }}</template>
            </span>

            <!-- 弹性占位 -->
            <div class="flex-1" />

            <!-- 复制按钮 + Popover 预览 -->
            <NPopover trigger="hover" placement="bottom">
              <template #trigger>
                <button
                  class="flex items-center gap-1 rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                  @click="handleCopy(share)"
                >
                  <ZIcon name="ri:file-copy-line" :size="15" color="currentColor" />
                </button>
              </template>
              <div class="text-xs leading-relaxed">
                <p>{{ t("note.share.result.url") }}: {{ shareOrigin }}/s/{{ share.share_id }}</p>
                <p>{{ t("note.share.result.password") }}: {{ share.password || t("note.shares.no_password") }}</p>
              </div>
            </NPopover>

            <!-- 删除按钮（Popconfirm） -->
            <NPopconfirm @positive-click="handleDelete(share.id)">
              <template #trigger>
                <button
                  class="flex items-center gap-1 rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  :disabled="deletingId === share.id"
                  :title="t('note.shares.delete')"
                >
                  <ZIcon name="ri:delete-bin-line" :size="15" color="currentColor" />
                </button>
              </template>
              {{ t("note.shares.delete_confirm") }}
            </NPopconfirm>
          </div>
        </div>
      </div>

      <!-- 空态 -->
      <div
        v-else
        class="flex h-full flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <ZIcon name="ri:share-forward-line" :size="28" color="#94a3b8" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-600">{{ keyword ? t('note.note.search.no_results') : t('note.shares.empty') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

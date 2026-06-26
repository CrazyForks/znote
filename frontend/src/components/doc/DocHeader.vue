<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { inject } from "vue";
import ZIcon from "@/components/DynamicIcon.vue";

const router = useRouter();
const { t } = useI18n();

defineProps<{
    /** 文档标题 */
    title: string;
}>();

const slug = inject<string>("slug", "");

const emit = defineEmits<{
    (e: "toggle-sidebar"): void;
}>();

/** 返回应用首页 */
const goHome = () => {
    router.push("/");
};
</script>

<template>
  <header class="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4">
    <div class="flex items-center gap-3">
      <!-- 移动端汉堡按钮 -->
      <button
        class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        @click="emit('toggle-sidebar')"
      >
        <ZIcon name="ri:menu-line" :size="18" />
      </button>
      <a
        class="flex cursor-pointer items-center gap-1.5 truncate rounded-lg px-1 -ml-1"
        @click="router.push(`/doc/${slug}`)"
      >
        <ZIcon name="ri:booklet-line" :size="18" />
        <span class="truncate text-base font-semibold text-slate-800">{{ title }}</span>
      </a>
    </div>
    <button
      class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
      @click="goHome"
    >
      <ZIcon name="ri:home-line" :size="14" />
      {{ t("doc.header.home") }}
    </button>
  </header>
</template>

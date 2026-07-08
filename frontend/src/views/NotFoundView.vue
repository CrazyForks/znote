<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";

const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500"
    style="background-image: radial-gradient(ellipse at top, rgba(59,130,246,0.04), transparent 60%);"
  >
    <div class="px-4 text-center">
      <!-- 404 数字 -->
      <h1 class="text-8xl font-bold tracking-tighter text-blue-400 sm:text-9xl">
        {{ t("notfound.title") }}
      </h1>

      <!-- 提示文案 -->
      <p class="mt-4 text-sm text-slate-400 sm:mt-6 sm:text-base">
        {{ t("notfound.description") }}
      </p>

      <!-- 返回首页按钮 -->
      <button
        class="btn-base btn-lg mt-8 sm:mt-10"
        @click="router.push('/')"
      >
        <ZIcon name="ri:home-5-line" :size="18" class="opacity-70" />
        <span>{{ t("notfound.back_home") }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.btn-base {
  @apply inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-xl transition-all duration-200 select-none
         bg-white border border-slate-200 text-slate-600
         hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50
         focus:outline-none focus:ring-1 focus:ring-blue-100;
}

.btn-lg {
  @apply h-10 px-5 text-sm;
}

@media (prefers-reduced-motion: reduce) {
  .btn-base {
    animation: none !important;
    transition: none !important;
  }
}
</style>

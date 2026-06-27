<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";

const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
    <!-- 背景渐变光晕 -->
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div class="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
    </div>

    <div class="relative z-10 px-4 text-center">
      <!-- 404 数字 -->
      <h1
        class="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-8xl font-bold tracking-tighter text-transparent sm:text-9xl"
      >
        {{ t("notfound.title") }}
      </h1>

      <!-- 提示文案 -->
      <p class="mt-4 text-base text-slate-400 sm:mt-6 sm:text-lg">
        {{ t("notfound.description") }}
      </p>

      <!-- 返回首页按钮 -->
      <button
        class="btn-base btn-primary btn-lg mt-8 sm:mt-10"
        @click="router.push('/')"
      >
        <ZIcon name="ri:home-5-line" :size="18" color="currentColor" />
        <span>{{ t("notfound.back_home") }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.btn-base {
  @apply inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-xl transition-all duration-200 select-none;
}

.btn-lg {
  @apply h-12 px-7 text-base;
}

.btn-primary {
  @apply text-white bg-gradient-to-r from-blue-500 to-cyan-400
         shadow-lg shadow-blue-500/30
         hover:shadow-xl hover:shadow-blue-500/50
         hover:from-blue-400 hover:to-cyan-300
         hover:-translate-y-0.5
         active:translate-y-0;
}

@media (prefers-reduced-motion: reduce) {
  .btn-base {
    animation: none !important;
    transition: none !important;
  }
}
</style>

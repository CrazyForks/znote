<script setup lang="ts">
/**
 * 笔记列表项
 *
 * 展示笔记的标题、更新时间、内容摘要。
 * 选中态高亮，置顶笔记有特殊标记。
 */
import { computed } from "vue";
import { NTooltip } from "naive-ui";
import { useI18n } from "vue-i18n";
import ZIcon from "@/components/DynamicIcon.vue";
import type { Note } from "@/types/note";

const { t } = useI18n();

const props = defineProps<{
    note: Note;
    active: boolean;
    /** 是否可拖拽（显示拖拽把手）。置顶笔记由父组件传 false 隐藏把手 */
    draggable?: boolean;
    /** 所属分类名（搜索态下显示，正常态不传则不显示） */
    categoryName?: string;
    /** 是否为移动端视口 */
    isMobile: boolean;
}>();

const emit = defineEmits<{
    (e: "select", id: number): void;
    /** 右键笔记时触发，附带鼠标坐标用于菜单定位 */
    (e: "contextmenu", note: Note, evt: MouseEvent): void;
}>();

/** 摘要：取 content 纯文本前 80 字符 */
const summary = computed(() => {
    const text = (props.note.content || "")
        .replace(/```[\s\S]*?```/g, "")          // 去掉代码块
        .replace(/`[^`]*`/g, "")                 // 去掉行内代码
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")    // 去掉图片
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 链接只保留文字
        .replace(/[#>*_~\-]/g, " ")              // 去掉 markdown 符号
        .replace(/\s+/g, " ")
        .trim();
    return text.slice(0, 80);
});

/** 格式化时间：年/月/日 时:分 */
const formatTime = (t: number | string) => {
    // 兼容后端原生 SQL 返回的秒级时间戳（如 1772734206）和 Drizzle ORM 返回的 ISO 字符串
    const ts = typeof t === "number" && t < 1e12 ? t * 1000 : t;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 是否置顶 */
const isPinned = computed(() => props.note.is_pinned === 1);

/** 是否允许向量化 */
const allowVectorize = computed(() => props.note.allow_vectorize === 1);

/** 向量化状态配置 */
const vectorizeStatus = computed(() => {
    const status = props.note.is_vectorized;
    switch (status) {
        case 1: return { icon: "ri:checkbox-circle-fill", color: "#22c55e", label: t("note.vectorize.status.completed") };
        case 2: return { icon: "ri:skip-right-line", color: "#f59e0b", label: t("note.vectorize.status.skipped") };
        case 3: return { icon: "ri:close-circle-fill", color: "#ef4444", label: t("note.vectorize.status.failed") };
        default: return { icon: "ri:loader-4-line", color: "#94a3b8", label: t("note.vectorize.status.pending") };
    }
});

/** 向量化时间格式化 */
const vectorizeTime = computed(() => {
    const t = props.note.vectorized_at;
    if (!t) return "";
    const ts = typeof t === "number" && t < 1e12 ? t * 1000 : t;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-2.5 transition"
    :class="
      active
        ? 'border-blue-400 bg-blue-50/50 shadow-sm'
        : 'border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm'
    "
    @click="emit('select', note.id)"
    @contextmenu.prevent="(e: MouseEvent) => emit('contextmenu', note, e)"
  >
    <!-- 拖拽把手：始终占位，非置顶笔记 hover 时显示并可拖拽；置顶笔记恒不可见不响应 -->
    <div
      class="drag-handle shrink-0 transition"
      :class="
        draggable
          ? props.isMobile
            ? 'cursor-grab opacity-100 active:cursor-grabbing'
            : 'cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing'
          : 'pointer-events-none opacity-0'
      "
    >
      <ZIcon name="ri:draggable" :size="14" color="#94a3b8" />
    </div>

    <!-- 内容区 -->
    <div class="min-w-0 flex-1 pr-1">
      <!-- 标题行：标题 + 置顶标记 -->
      <div class="flex items-center gap-1.5">
        <ZIcon
          v-if="isPinned"
          name="ri:pushpin-2-line"
          :size="14"
          color="#f59e0b"
          class="shrink-0"
        />
        <h3
          class="flex-1 truncate text-sm font-medium"
          :class="active ? 'text-blue-700' : 'text-slate-800'"
        >
          {{ note.title || "（无标题）" }}
        </h3>
      </div>

      <!-- 摘要：PC 端显示，移动端隐藏以节约空间 -->
      <p v-if="!isMobile" class="mt-1 line-clamp-1 text-xs text-slate-500">
        {{ summary || "\u00A0" }}
      </p>

      <!-- 时间 + 分类名 + 向量化徽标 -->
      <div class="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
        <span>{{ formatTime(note.updated_at) }}</span>
        <span v-if="categoryName" class="flex items-center gap-0.5">
          <ZIcon name="ri:folder-3-line" :size="11" color="#cbd5e1" />
          {{ categoryName }}
        </span>
        <span class="ml-auto flex items-center gap-1">
          <NTooltip :delay="300">
            <template #trigger>
              <ZIcon
                :name="allowVectorize ? 'ri:brain-line' : 'ri:brain-fill'"
                :size="12"
                :color="allowVectorize ? '#22c55e' : '#cbd5e1'"
              />
            </template>
            {{ allowVectorize ? t("note.vectorize.allowed") : t("note.vectorize.disallowed") }}
          </NTooltip>
          <NTooltip :delay="300">
            <template #trigger>
              <ZIcon
                :name="vectorizeStatus.icon"
                :size="12"
                :color="vectorizeStatus.color"
              />
            </template>
            <span>{{ vectorizeStatus.label }}</span>
            <span v-if="vectorizeTime"> · {{ vectorizeTime }}</span>
          </NTooltip>
        </span>
      </div>
    </div>
  </div>
</template>

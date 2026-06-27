/**
 * 文档树递归平铺 composable
 * 把分类树按分类分组，输出带层级深度的 section 列表，用于带缩进的展示
 * 支持完整树和子树两种用法
 */
import { computed, type Ref } from "vue";

/** 展平后的分类区块 */
export interface FlattenSection {
    /** 分类节点 */
    category: any;
    /** 该分类下的笔记 */
    notes: any[];
    /** 层级深度（用于缩进） */
    depth: number;
    /** 当前分类是否有子分类（用于决定 notes 是否需要额外缩进以与子分类对齐） */
    hasChildren: boolean;
}

/**
 * 递归平铺分类树：按分类分组输出笔记列表，depth 记录层级深度用于缩进
 * 当分类无 notes（仅含子分类）时，子分类继承当前 depth，避免空分类"穿透"贡献层级
 * @param tree 分类树（完整或子树）
 */
export function useFlattenDocTree(tree: Ref<any[]>) {
    const flatten = (nodes: any[], depth = 0): FlattenSection[] => {
        const result: FlattenSection[] = [];
        for (const node of nodes) {
            const hasChildren = !!(node.children && node.children.length > 0);
            if (node.notes && node.notes.length > 0) {
                result.push({
                    category: node,
                    notes: node.notes,
                    depth,
                    hasChildren,
                });
            }
            if (hasChildren) {
                // 当前分类无笔记（被跳过）→ 子分类继承当前 depth；否则 depth + 1
                const hasNotes = node.notes && node.notes.length > 0;
                const childDepth = hasNotes ? depth + 1 : depth;
                result.push(...flatten(node.children, childDepth));
            }
        }
        return result;
    };

    const sections = computed(() => flatten(tree.value));
    return { sections };
}

/** 递归计算分类及其子分类下的笔记总数 */
export function countAllNotes(node: any): number {
    let count = (node.notes || []).length;
    for (const child of node.children || []) {
        count += countAllNotes(child);
    }
    return count;
}

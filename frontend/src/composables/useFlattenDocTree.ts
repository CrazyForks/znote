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
}

/**
 * 递归平铺分类树：按分类分组输出笔记列表，depth 记录层级深度用于缩进
 * @param tree 分类树（完整或子树）
 */
export function useFlattenDocTree(tree: Ref<any[]>) {
    const flatten = (nodes: any[], depth = 0): FlattenSection[] => {
        const result: FlattenSection[] = [];
        for (const node of nodes) {
            if (node.notes && node.notes.length > 0) {
                result.push({ category: node, notes: node.notes, depth });
            }
            if (node.children && node.children.length > 0) {
                result.push(...flatten(node.children, depth + 1));
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

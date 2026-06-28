import req from "@/utils/req";
import type { ShareItem } from "@/types/note";

interface ApiResult<T> {
    code: number;
    msg: string;
    data: T;
}

/**
 * 创建笔记分享
 * @param noteId 笔记 ID
 * @param payload 分享配置 { password?, expires_at? }
 */
export const createShare = async (noteId: number, payload: { password?: string; expires_at?: number }) => {
    const res = await req.post("/api/user/note/share/create", { note_id: noteId, ...payload });
    if (res.data?.code === 200) return res.data.data;
    return null;
};

/**
 * 获取当前用户的所有分享列表
 */
export const fetchMyShares = async (): Promise<ShareItem[]> => {
    const res = await req.get<ApiResult<ShareItem[]>>("/api/user/note/share/list");
    if (res.data?.code === 200) return res.data.data ?? [];
    return [];
};

/**
 * 删除分享
 * @param id 分享记录 ID
 */
export const deleteShare = async (id: number): Promise<boolean> => {
    const res = await req.post("/api/user/note/share/delete", { id });
    return res.data?.code === 200;
};

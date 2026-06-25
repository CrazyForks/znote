import { Context } from "hono";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { checkNotebookOwnership } from "@/utils/ownership";
import { join } from "node:path";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import AdmZip from "adm-zip";

/** 待写入的笔记条目 */
interface NoteEntry {
    notebookId: number;
    title: string;
    content: string;
    mtime: Date;
}

/**
 * ZIP 导入接口
 * POST /api/user/import
 * multipart/form-data: notebook_id (string → number), file (File)
 *
 * 流程：
 * 1. 校验 notebook_id 归属
 * 2. 解压 ZIP 到临时目录
 * 3. 剥离逻辑：唯一顶层目录且不含 .md → 剥离顶层
 * 4. 事务 #1：递归创建 notebooks（取文件 mtime 为时间戳），同时收集 notes 数据
 * 5. 事务 #2：批量 INSERT notes
 * 6. 清理临时文件，返回成功
 */
export const importZip = async (c: Context) => {
    const uid = Number(c.get("uid"));

    // 解析 multipart/form-data
    const formData = await c.req.formData();
    const notebookId = Number(formData.get("notebook_id"));
    const file = formData.get("file");

    // 校验 notebook_id
    if (!notebookId || isNaN(notebookId)) {
        return c.json({ code: -1000, msg: "import.notebook_required", data: null });
    }

    // 校验 file 存在
    if (!file || !(file instanceof File)) {
        return c.json({ code: -1000, msg: "import.file_required", data: null });
    }

    // 校验父笔记本归属当前用户
    const owned = await checkNotebookOwnership(notebookId, uid);
    if (!owned) {
        return c.json({ code: -1000, msg: "import.notebook_not_found", data: null });
    }

    // 创建临时工作目录
    const tmpDir = join("/tmp", `zest_import_${uid}_${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
        // 保存 ZIP 到临时目录并解压
        const zipPath = join(tmpDir, "import.zip");
        await Bun.write(zipPath, file);

        const zip = new AdmZip(zipPath);
        const extractDir = join(tmpDir, "extracted");
        zip.extractAllTo(extractDir, true);

        // 剥离逻辑：扫描 extracted 顶层
        const entries = readdirSync(extractDir);
        const topDirs = entries.filter((e) => {
            try { return statSync(join(extractDir, e)).isDirectory(); } catch { return false; }
        });
        const topMds = entries.filter((e) => {
            try { return e.endsWith(".md") && statSync(join(extractDir, e)).isFile(); } catch { return false; }
        });

        let rootDir = extractDir;
        if (topDirs.length === 1 && topMds.length === 0) {
            rootDir = join(extractDir, topDirs[0]);
        }

        const noteEntries: NoteEntry[] = [];

        // 事务 #1：递归创建 notebooks 并收集 notes 数据
        await db.transaction(async (tx) => {
            async function importDir(dir: string, parentDbId: number) {
                const items = readdirSync(dir);

                // 第一遍：创建子目录（notebooks）
                for (const name of items) {
                    const fullPath = join(dir, name);
                    let st;
                    try { st = statSync(fullPath); } catch { continue; }
                    if (st.isDirectory()) {
                        const [nb] = await tx
                            .insert(schema.notebooks)
                            .values({
                                user_id: uid,
                                parent_id: parentDbId,
                                title: name,
                                description: "",
                                sort_order: 0,
                                created_at: st.mtime,
                                updated_at: st.mtime,
                            })
                            .returning();
                        await importDir(fullPath, nb.id);
                    }
                }

                // 第二遍：收集当前目录下的 .md 文件
                for (const name of items) {
                    const fullPath = join(dir, name);
                    let st;
                    try { st = statSync(fullPath); } catch { continue; }
                    if (st.isFile() && name.endsWith(".md")) {
                        const title = name.replace(/\.md$/, "");
                        const content = readFileSync(fullPath, "utf-8");
                        noteEntries.push({
                            notebookId: parentDbId,
                            title,
                            content,
                            mtime: st.mtime,
                        });
                    }
                }
            }
            await importDir(rootDir, notebookId);
        });

        // 事务 #2：批量 INSERT notes（单条 SQL）
        if (noteEntries.length > 0) {
            await db.transaction(async (tx) => {
                await tx.insert(schema.notes).values(
                    noteEntries.map((e) => ({
                        user_id: uid,
                        notebook_id: e.notebookId,
                        title: e.title,
                        content: e.content,
                        is_pinned: 0,
                        is_deleted: 0,
                        sort_order: 0,
                        created_at: e.mtime,
                        updated_at: e.mtime,
                    }))
                );
            });
        }

        return c.json({ code: 200, msg: "import.success", data: null });
    } finally {
        // 无论成功失败，清理临时目录
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* 忽略清理错误 */ }
    }
};

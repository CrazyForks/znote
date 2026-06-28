/**
 * adm-zip 运行时支持 decoder 选项（自定义文件名编/解码器），
 * 但 @types/adm-zip@0.5.8 的 InitOptions 接口未声明该字段。
 *
 * 本文件通过 declaration merging 在本项目内补全类型，无需等待上游修复。
 * 新字段显式标为可选（?），避免影响其它无参调用点。
 *
 * 关键：interface InitOptions 必须直接放在 declare module 里，
 * 不能包一层 namespace AdmZip —— 否则 TS 不会合并到原接口。
 */
import "adm-zip";

declare module "adm-zip" {
    interface InitOptions {
        /**
         * 自定义文件名 decoder，传入后会替换 util/decoder 的默认值
         * @see node_modules/adm-zip/util/decoder.js
         */
        decoder?: {
            efs?: boolean | ((entryName: string) => boolean);
            encode?: (data: string) => Buffer;
            decode?: (data: Buffer) => string;
        };
    }
}

export {};

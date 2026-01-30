export enum Branch {
    ALL = "all",
    YUNUSOBOD = "yunusobod",
    NASIBA = "nasiba",
    AKKURGAN = "akkurgan",
    YANGIBOZOR = "yangibozor",
    ZANGIOTA = "zangiota",
    PARKENT = "parkent",
    FOTIMA = "fotima"
}

export const BranchNames: Record<Branch, string> = {
    [Branch.ALL]: "🌐 ОБЩИЕ (Для всех)",
    [Branch.YUNUSOBOD]: "🏥 Юнусабад",
    [Branch.NASIBA]: "👩‍⚕️ Насиба Бону",
    [Branch.AKKURGAN]: "🏡 Аккурган",
    [Branch.YANGIBOZOR]: "🏡 Янги Базар",
    [Branch.ZANGIOTA]: "🕌 Зангиота",
    [Branch.PARKENT]: "⛰ Паркент",
    [Branch.FOTIMA]: "🌙 Фотима Султон"
};

export interface LinkItem {
    id: string;
    title: string;
    url: string;
    branch: Branch;
    adminId: number;
    adminName: string;
    createdAt: string;
    clicks: number;
}

export interface SessionData {
    step: "idle" | "awaiting_title" | "awaiting_url" | "awaiting_branch";
    tempLink: {
        title?: string;
        url?: string;
    };
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LOCATIONS = exports.DEFAULT_CATEGORIES = exports.HOUSEHOLD_ROLES = exports.CONNECTION_TYPE_LABELS = exports.CONNECTION_TYPES = exports.REPAIR_STATUS_LABELS = exports.REPAIR_STATUSES = exports.MAINTENANCE_TYPE_LABELS = exports.MAINTENANCE_TYPES = exports.LINK_TYPE_LABELS = exports.LINK_TYPES = exports.DEVICE_PRIORITY_LABELS = exports.DEVICE_PRIORITIES = exports.DEVICE_STATUS_LABELS = exports.DEVICE_STATUSES = void 0;
// 機器ステータス
exports.DEVICE_STATUSES = [
    'in_use',
    'spare',
    'broken',
    'repairing',
    'disposed',
    'sold',
];
exports.DEVICE_STATUS_LABELS = {
    in_use: '使用中',
    spare: '予備',
    broken: '故障中',
    repairing: '修理中',
    disposed: '廃棄済み',
    sold: '売却済み',
};
// 機器優先度
exports.DEVICE_PRIORITIES = ['high', 'medium', 'low'];
exports.DEVICE_PRIORITY_LABELS = {
    high: '高',
    medium: '中',
    low: '低',
};
// リンク種別
exports.LINK_TYPES = [
    'manual',
    'warranty',
    'receipt',
    'invoice',
    'official',
    'support',
    'purchase',
    'other',
];
exports.LINK_TYPE_LABELS = {
    manual: '取扱説明書',
    warranty: '保証書',
    receipt: 'レシート',
    invoice: '領収書',
    official: 'メーカー公式',
    support: 'サポート',
    purchase: '購入ページ',
    other: 'その他',
};
// メンテナンス種別
exports.MAINTENANCE_TYPES = [
    'cleaning',
    'inspection',
    'battery_change',
    'filter_change',
    'firmware_update',
    'parts_change',
    'other',
];
exports.MAINTENANCE_TYPE_LABELS = {
    cleaning: '掃除',
    inspection: '点検',
    battery_change: '電池交換',
    filter_change: 'フィルター交換',
    firmware_update: 'ファームウェア更新',
    parts_change: '部品交換',
    other: 'その他',
};
// 修理ステータス
exports.REPAIR_STATUSES = [
    'pending',
    'in_progress',
    'completed',
    'replaced',
    'disposed',
];
exports.REPAIR_STATUS_LABELS = {
    pending: '未対応',
    in_progress: '対応中',
    completed: '修理済み',
    replaced: '買い替え',
    disposed: '廃棄',
};
// 接続方式
exports.CONNECTION_TYPES = [
    'wifi',
    'ethernet',
    'bluetooth',
    'zigbee',
    'matter',
    'other',
];
exports.CONNECTION_TYPE_LABELS = {
    wifi: 'Wi-Fi',
    ethernet: '有線LAN',
    bluetooth: 'Bluetooth',
    zigbee: 'Zigbee',
    matter: 'Matter',
    other: 'その他',
};
// 家庭メンバーロール
exports.HOUSEHOLD_ROLES = ['owner', 'member'];
// 初期カテゴリ
exports.DEFAULT_CATEGORIES = [
    { name: '家電', icon: 'tv' },
    { name: 'IT機器', icon: 'laptop' },
    { name: 'ネットワーク機器', icon: 'wifi' },
    { name: 'スマートホーム', icon: 'home' },
    { name: '防犯カメラ', icon: 'videocam' },
    { name: '生活設備', icon: 'water' },
    { name: '工具', icon: 'construct' },
    { name: 'その他', icon: 'cube' },
];
// 初期設置場所
exports.DEFAULT_LOCATIONS = [
    'リビング',
    'キッチン',
    '寝室',
    '子供部屋',
    '玄関',
    '洗面所',
    '浴室',
    'トイレ',
    'ベランダ',
    '物置',
    'サーバー棚',
];

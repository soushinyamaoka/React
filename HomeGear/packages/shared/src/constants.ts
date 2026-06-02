// 機器ステータス
export const DEVICE_STATUSES = [
  'in_use',
  'spare',
  'broken',
  'repairing',
  'disposed',
  'sold',
] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  in_use: '使用中',
  spare: '予備',
  broken: '故障中',
  repairing: '修理中',
  disposed: '廃棄済み',
  sold: '売却済み',
};

// 機器優先度
export const DEVICE_PRIORITIES = ['high', 'medium', 'low'] as const;
export type DevicePriority = (typeof DEVICE_PRIORITIES)[number];

export const DEVICE_PRIORITY_LABELS: Record<DevicePriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// リンク種別
export const LINK_TYPES = [
  'manual',
  'warranty',
  'receipt',
  'invoice',
  'official',
  'support',
  'purchase',
  'other',
] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
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
export const MAINTENANCE_TYPES = [
  'cleaning',
  'inspection',
  'battery_change',
  'filter_change',
  'firmware_update',
  'parts_change',
  'other',
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  cleaning: '掃除',
  inspection: '点検',
  battery_change: '電池交換',
  filter_change: 'フィルター交換',
  firmware_update: 'ファームウェア更新',
  parts_change: '部品交換',
  other: 'その他',
};

// 修理ステータス
export const REPAIR_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'replaced',
  'disposed',
] as const;
export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  completed: '修理済み',
  replaced: '買い替え',
  disposed: '廃棄',
};

// 接続方式
export const CONNECTION_TYPES = [
  'wifi',
  'ethernet',
  'bluetooth',
  'zigbee',
  'matter',
  'other',
] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  wifi: 'Wi-Fi',
  ethernet: '有線LAN',
  bluetooth: 'Bluetooth',
  zigbee: 'Zigbee',
  matter: 'Matter',
  other: 'その他',
};

// 家庭メンバーロール
export const HOUSEHOLD_ROLES = ['owner', 'member'] as const;
export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

// 初期カテゴリ
export const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
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
export const DEFAULT_LOCATIONS: string[] = [
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

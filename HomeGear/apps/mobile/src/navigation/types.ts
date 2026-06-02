// React Navigation の型定義
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  DevicesTab: undefined;
  AddTab: undefined;
  AiImportTab: undefined;
  SettingsTab: undefined;
};

export type DevicesStackParamList = {
  DeviceList: undefined;
  DeviceDetail: { deviceId: string };
  DeviceForm: { deviceId?: string };
  SpecForm: { deviceId: string; specId?: string };
  LinkForm: { deviceId: string; linkId?: string };
  MaintenanceForm: { deviceId: string; recordId?: string };
  RepairForm: { deviceId: string; recordId?: string };
  ConsumableForm: { deviceId: string; consumableId?: string };
  AccessoryForm: { deviceId: string; accessoryId?: string };
  NetworkInfoForm: { deviceId: string };
  AiImportFromDevice: { deviceId: string };
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  CategoryManage: undefined;
  LocationManage: undefined;
  Export: undefined;
};

export type AiImportStackParamList = {
  AiImport: { deviceId?: string };
};

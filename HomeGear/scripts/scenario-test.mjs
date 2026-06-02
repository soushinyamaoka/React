#!/usr/bin/env node
// HomeGear API シナリオテスト
// - 認証フロー
// - デバイス CRUD + 子テーブル CRUD
// - 修理ステータス → 機器ステータス連動（今回修正）
// - next_maintenance_asc ソート（今回修正）
// - household_id によるデータ分離

const BASE = process.env.API_BASE ?? 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures = [];

function ok(label) {
  pass++;
  console.log(`  PASS ${label}`);
}

function ng(label, detail) {
  fail++;
  failures.push({ label, detail });
  console.log(`  FAIL ${label}\n       ${detail}`);
}

function assert(cond, label, detail = '') {
  if (cond) ok(label);
  else ng(label, detail || 'assertion failed');
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json };
}

function header(title) {
  console.log(`\n=== ${title} ===`);
}

function uniqueEmail() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function main() {
  header('1. 認証フロー');
  const emailA = uniqueEmail();
  let r = await req('POST', '/api/auth/register', {
    body: { email: emailA, password: 'test1234', name: 'TestUserA', householdName: 'HouseholdA' },
  });
  assert(r.status === 201 && r.json?.token, 'register A 成功', `status=${r.status} body=${JSON.stringify(r.json)}`);
  const tokenA = r.json?.token;

  r = await req('POST', '/api/auth/login', { body: { email: emailA, password: 'test1234' } });
  assert(r.status === 200 && r.json?.token, 'login A 成功');

  r = await req('GET', '/api/auth/me', { token: tokenA });
  assert(r.status === 200 && r.json?.user?.email === emailA, 'me が正しく返る');

  r = await req('GET', '/api/auth/me');
  assert(r.status === 401, '未認証で me が 401');

  // 別ユーザー（B）を作成（household_id 分離テスト用）
  const emailB = uniqueEmail();
  r = await req('POST', '/api/auth/register', {
    body: { email: emailB, password: 'test1234', name: 'TestUserB', householdName: 'HouseholdB' },
  });
  const tokenB = r.json?.token;
  assert(!!tokenB, 'register B 成功');

  header('2. デバイス CRUD');
  r = await req('POST', '/api/devices', {
    token: tokenA,
    body: { name: 'TestDevice1', status: 'in_use', priority: 'medium' },
  });
  assert(r.status === 201 && r.json?.id, 'デバイス作成');
  const deviceAId = r.json?.id;

  r = await req('GET', `/api/devices/${deviceAId}`, { token: tokenA });
  assert(r.status === 200 && r.json?.name === 'TestDevice1', 'デバイス詳細取得');

  r = await req('PUT', `/api/devices/${deviceAId}`, {
    token: tokenA,
    body: { name: 'TestDevice1-updated', status: 'in_use', priority: 'high' },
  });
  assert(r.status === 200 && r.json?.name === 'TestDevice1-updated' && r.json?.priority === 'high', 'デバイス更新');

  r = await req('GET', '/api/devices', { token: tokenA });
  assert(r.status === 200 && Array.isArray(r.json) && r.json.length >= 1, 'デバイス一覧');

  // 廃棄
  r = await req('POST', `/api/devices/${deviceAId}/dispose`, { token: tokenA });
  assert(
    r.status === 200 && r.json?.status === 'disposed',
    '論理削除 (dispose)',
    `status=${r.status} body=${JSON.stringify(r.json)?.slice(0, 200)}`
  );

  // 廃棄後はデフォルト一覧に含まれない
  r = await req('GET', '/api/devices', { token: tokenA });
  const matched = r.json?.find?.((d) => d.id === deviceAId);
  assert(
    !matched,
    '廃棄済みはデフォルト一覧から除外',
    `matched=${JSON.stringify(matched)?.slice(0, 200)}`
  );

  // includeDisposed で再取得できる
  r = await req('GET', '/api/devices?includeDisposed=true', { token: tokenA });
  const disposedVisible = r.json?.some?.((d) => d.id === deviceAId);
  assert(disposedVisible, 'includeDisposed=true で取得可能');

  header('3. 修理ステータス → 機器ステータス連動（POST）');
  // 新規デバイスを作って各 status 遷移を試す
  r = await req('POST', '/api/devices', { token: tokenA, body: { name: 'RepairTarget1' } });
  const repairTargetId = r.json?.id;
  assert(!!repairTargetId, '修理対象デバイス作成');

  // POST: pending → broken
  r = await req('POST', `/api/devices/${repairTargetId}/repair-records`, {
    token: tokenA,
    body: { occurredDate: '2026-05-01', status: 'pending', symptom: '電源が入らない' },
  });
  assert(r.status === 201, '修理履歴 pending 作成');
  let repairId1 = r.json?.id;
  r = await req('GET', `/api/devices/${repairTargetId}`, { token: tokenA });
  assert(r.json?.status === 'broken', 'pending → device.status=broken');

  // POST: in_progress → repairing
  r = await req('POST', `/api/devices/${repairTargetId}/repair-records`, {
    token: tokenA,
    body: { occurredDate: '2026-05-02', status: 'in_progress' },
  });
  let repairId2 = r.json?.id;
  r = await req('GET', `/api/devices/${repairTargetId}`, { token: tokenA });
  assert(r.json?.status === 'repairing', 'in_progress → device.status=repairing');

  // POST: completed → in_use
  r = await req('POST', `/api/devices/${repairTargetId}/repair-records`, {
    token: tokenA,
    body: { occurredDate: '2026-05-03', completedDate: '2026-05-04', status: 'completed' },
  });
  let repairId3 = r.json?.id;
  r = await req('GET', `/api/devices/${repairTargetId}`, { token: tokenA });
  assert(r.json?.status === 'in_use', 'completed → device.status=in_use（修理復帰）');

  // POST: replaced → disposed
  r = await req('POST', `/api/devices/${repairTargetId}/repair-records`, {
    token: tokenA,
    body: { occurredDate: '2026-05-05', status: 'replaced' },
  });
  let repairId4 = r.json?.id;
  r = await req('GET', `/api/devices/${repairTargetId}`, { token: tokenA });
  assert(r.json?.status === 'disposed', 'replaced → device.status=disposed');

  header('4. 修理ステータス → 機器ステータス連動（PUT・今回修正分）');
  // 新規デバイスを作って、pending 作成後 PUT で completed に
  r = await req('POST', '/api/devices', { token: tokenA, body: { name: 'RepairTarget2' } });
  const repairTarget2Id = r.json?.id;
  r = await req('POST', `/api/devices/${repairTarget2Id}/repair-records`, {
    token: tokenA,
    body: { occurredDate: '2026-05-10', status: 'pending' },
  });
  const putTargetRecordId = r.json?.id;
  r = await req('GET', `/api/devices/${repairTarget2Id}`, { token: tokenA });
  assert(r.json?.status === 'broken', '前提: PUT 対象デバイスは broken');

  // PUT で completed に更新
  r = await req('PUT', `/api/repair-records/${putTargetRecordId}`, {
    token: tokenA,
    body: { occurredDate: '2026-05-10', completedDate: '2026-05-12', status: 'completed' },
  });
  assert(r.status === 200, 'PUT で修理履歴更新');
  r = await req('GET', `/api/devices/${repairTarget2Id}`, { token: tokenA });
  assert(r.json?.status === 'in_use', 'PUT completed → device.status=in_use（★今回修正の本丸）');

  // 続けて PUT で disposed に
  r = await req('PUT', `/api/repair-records/${putTargetRecordId}`, {
    token: tokenA,
    body: { occurredDate: '2026-05-10', status: 'disposed' },
  });
  r = await req('GET', `/api/devices/${repairTarget2Id}`, { token: tokenA });
  assert(r.json?.status === 'disposed', 'PUT disposed → device.status=disposed');

  header('5. next_maintenance_asc ソート（今回修正分）');
  // 3 つデバイスを作り、それぞれ異なる nextDueDate のメンテ履歴を付ける
  const setup = async (name, nextDueDate) => {
    const cr = await req('POST', '/api/devices', { token: tokenA, body: { name } });
    const id = cr.json.id;
    if (nextDueDate) {
      await req('POST', `/api/devices/${id}/maintenance-records`, {
        token: tokenA,
        body: { maintenanceDate: '2026-01-01', maintenanceType: 'cleaning', nextDueDate },
      });
    }
    return { id, name, nextDueDate };
  };
  const m1 = await setup('M_Latest_2027', '2027-12-31');
  const m2 = await setup('M_Soonest_2026Aug', '2026-08-01');
  const m3 = await setup('M_NoNext', null);

  r = await req('GET', '/api/devices?sort=next_maintenance_asc', { token: tokenA });
  const list = r.json ?? [];
  const idxOf = (name) => list.findIndex((d) => d.name === name);
  const i1 = idxOf(m1.name);
  const i2 = idxOf(m2.name);
  const i3 = idxOf(m3.name);
  assert(i1 >= 0 && i2 >= 0 && i3 >= 0, '3 件とも一覧に含まれる');
  assert(i2 < i1, 'nextDueDate が近い方が先 (Soonest < Latest)');
  assert(i1 < i3 && i2 < i3, 'nextDueDate なし は末尾');
  // ソート用 include は応答から除去されているはず
  const hasLeakedField = list.some((d) => 'maintenanceRecords' in d);
  assert(!hasLeakedField, 'maintenanceRecords は一覧レスポンスから除外されている');

  header('6. household_id 分離');
  // B のトークンで A のデバイスを取れない
  r = await req('GET', `/api/devices/${repairTargetId}`, { token: tokenB });
  assert(r.status === 404, '他家庭のデバイス詳細は 404');

  r = await req('PUT', `/api/devices/${repairTargetId}`, {
    token: tokenB,
    body: { name: 'hacked' },
  });
  assert(r.status === 404, '他家庭のデバイス更新は 404');

  r = await req('GET', '/api/devices', { token: tokenB });
  const bSeesA = r.json?.some?.((d) => d.id === repairTargetId);
  assert(!bSeesA, 'B の一覧に A のデバイスは含まれない');

  header('7. 子テーブル CRUD（specs / links / consumables / accessories / network-info）');
  r = await req('POST', '/api/devices', { token: tokenA, body: { name: 'ChildTablesDevice' } });
  const cid = r.json.id;

  // spec
  r = await req('POST', `/api/devices/${cid}/specs`, {
    token: tokenA,
    body: { specName: 'CPU', specValue: 'M2', unit: '' },
  });
  assert(r.status === 201, 'spec 作成');

  // link
  r = await req('POST', `/api/devices/${cid}/links`, {
    token: tokenA,
    body: { linkType: 'manual', url: 'https://example.com/manual.pdf', title: 'Manual' },
  });
  assert(r.status === 201, 'link 作成');

  // consumable
  r = await req('POST', `/api/devices/${cid}/consumables`, {
    token: tokenA,
    body: { name: 'Filter A' },
  });
  assert(r.status === 201, 'consumable 作成');

  // accessory
  r = await req('POST', `/api/devices/${cid}/accessories`, {
    token: tokenA,
    body: { name: 'Cable X', quantity: 2 },
  });
  assert(r.status === 201, 'accessory 作成');

  // network-info upsert
  r = await req('POST', `/api/devices/${cid}/network-info`, {
    token: tokenA,
    body: { ipAddress: '192.168.1.50', hostName: 'test-host', port: 8080, connectionType: 'wifi' },
  });
  assert(r.status === 201, 'network-info 作成（upsert）');

  // 同じエンドポイントを再度叩いて upsert で更新されるか
  r = await req('POST', `/api/devices/${cid}/network-info`, {
    token: tokenA,
    body: { ipAddress: '192.168.1.51' },
  });
  assert(r.status === 201, 'network-info 再 upsert');
  r = await req('GET', `/api/devices/${cid}/network-info`, { token: tokenA });
  assert(r.json?.ipAddress === '192.168.1.51', 'upsert で値が更新されている');

  // 詳細に子テーブルが含まれる
  r = await req('GET', `/api/devices/${cid}`, { token: tokenA });
  const d = r.json;
  assert(d?.specs?.length === 1, '詳細に specs が含まれる');
  assert(d?.links?.length === 1, '詳細に links が含まれる');
  assert(d?.consumables?.length === 1, '詳細に consumables が含まれる');
  assert(d?.accessories?.length === 1, '詳細に accessories が含まれる');
  assert(d?.networkInfo?.ipAddress === '192.168.1.51', '詳細に networkInfo が含まれる');

  header('8. ダッシュボード / マスタ / エクスポート');
  r = await req('GET', '/api/dashboard', { token: tokenA });
  assert(r.status === 200 && typeof r.json === 'object', 'ダッシュボード取得');

  r = await req('GET', '/api/categories', { token: tokenA });
  assert(r.status === 200 && Array.isArray(r.json), 'カテゴリ一覧');

  r = await req('GET', '/api/locations', { token: tokenA });
  assert(r.status === 200 && Array.isArray(r.json), '設置場所一覧');

  r = await req('GET', '/api/export/json', { token: tokenA });
  assert(r.status === 200 && typeof r.json === 'object', 'JSON エクスポート');

  header('結果');
  console.log(`  Total: ${pass + fail}  Pass: ${pass}  Fail: ${fail}`);
  if (fail > 0) {
    console.log('\nFailed cases:');
    for (const f of failures) console.log(`  - ${f.label}\n    ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(2);
});

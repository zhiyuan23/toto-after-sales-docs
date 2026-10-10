#!/usr/bin/env python3
"""Manually maintain synthetic TOTO transactions through the existing authenticated APIs."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import gzip
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
RUNTIME = ROOT / '.local/demo-data'
PREFIX = 'TOTO-DEMO-V1-'
TERMINAL = {'CLOSED', 'CANCELLED', 'COMPLETED', 'PENDING_FOLLOW_UP', 'PENDING_HANDOVER'}
RESOURCE = {'INBOUND': 'inbounds', 'REQUISITION': 'requisitions'}
PROTECTED_PREFIXES = ('afs_product', 'afs_part_product', 'afs_part_installation', 'afs_fault',
    'afs_dealer', 'afs_store', 'afs_sales_region', 'afs_network', 'afs_decoration',
    'afs_service_station', 'afs_service_area', 'afs_service_personnel', 'afs_personnel_availability',
    'afs_schedule', 'afs_consumer_account', 'afs_consumer_scanned_product', 'afs_consumer_outlet',
    'afs_knowledge', 'afs_service_knowledge', 'afs_service_guide', 'afs_download_template', 'afs_download_scene',
    'afs_agreement', 'afs_dictionary', 'afs_evaluation_tag', 'afs_catalog_settings', 'afs_region_catalog',
    'afs_fee_policy', 'afs_consumer_support', 'afs_service_item', 'afs_part_warehouse')
PROTECTED_EXCEPTIONS = {'afs_product_instance', 'afs_service_guide_selection'}
CUSTOMER_NAMES = ('陈宇航', '王雨桐', '李明轩', '刘思远', '张欣怡', '赵文博', '孙佳宁', '周子涵')
ADDRESS_NAMES = ('清和里', '云锦苑', '锦绣园', '景和家园', '悦澜湾', '润景苑', '和悦府', '春熙里')
SCENARIOS = ('待分站', '待派人', '待完工', '维修待完工', '缺件跟进', '待审核', '退回待补', '安装待审核')


def scenario_for(index, total, day):
    priorities = {1: [0], 2: [0, 5], 3: [0, 5, 6], 4: [0, 2, 5, 6], 5: [0, 1, 3, 5, 6],
                  6: [0, 1, 2, 3, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6]}
    scenario = priorities.get(total, list(range(8)))[index]
    return 4 if scenario == 3 and int(day[-2:]) % 2 else scenario


def today():
    return datetime.now(timezone(timedelta(hours=8))).date().isoformat()


def owned(row):
    return re.fullmatch(re.escape(PREFIX) + r'(?:R-\d+|O-\d{8}-\d+-\d+|I-\d+|Q-\d{8}-\d+)', str(row.get('client_request_id', ''))) is not None


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def save(path, data):
    path = Path(path)
    require(not path.is_symlink(), '拒绝写入符号链接')
    temporary = path.with_suffix(path.suffix + '.tmp')
    require(not temporary.is_symlink(), '拒绝写入临时符号链接')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | getattr(os, 'O_NOFOLLOW', 0), 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
    os.chmod(temporary, 0o600)
    temporary.replace(path)


def java_command():
    java = os.environ.get('JAVA_HOME')
    executable = str(Path(java) / 'bin/java') if java else shutil.which('java')
    require(executable, '需要 JDK 21；请先按本地开发文档配置 Java')
    jars = sorted((Path.home() / '.m2/repository/com/mysql/mysql-connector-j').glob('*/*.jar'), reverse=True)
    require(jars, '缺少已有 MySQL JDBC 驱动；请先完成项目 Maven 依赖准备')
    return [executable, '-Djava.awt.headless=true', '-cp', str(jars[0]), str(ROOT / 'scripts/demo-data/ReadOnlySnapshot.java')]


def snapshot():
    config = WORKSPACE / 'backend/gaia-saas-proj/.local/application.properties'
    require(config.is_file(), '未找到项目本机数据库配置')
    with tempfile.TemporaryDirectory(prefix='toto-demo-snapshot-') as directory:
        path = Path(directory) / 'snapshot.json'
        result = subprocess.run(java_command() + [str(config), str(path)], capture_output=True, text=True, timeout=180)
        require(result.returncode == 0, '测试库只读检查失败；请检查 VPN、数据库连接和 JDK 21，未执行业务写入')
        data = json.loads(path.read_text())
    require(data['target']['db'] == 'gaia_wh_init_wzy' and data['target']['server'] == 'mysql84', '目标不是指定测试库')
    require(data['target']['checked_at'][:10] == today(), '数据库日期与上海时区当天不一致')
    return data


def is_protected(table):
    return table not in PROTECTED_EXCEPTIONS and (table.startswith(PROTECTED_PREFIXES)
        or table == 'afs_part' or table.endswith('_policy') or table in {'afs_sla_policy', 'afs_service_tag_definition'})


def verify_preserved(before, after):
    for table, rows in before['tables'].items():
        if is_protected(table):
            require(rows == after['tables'].get(table), f'基础资料或配置发生变化：{table}；停止继续造数并核对并发操作')
    for table in ('afs_purchase_registration', 'afs_service_order', 'afs_part_inventory_document', 'afs_customer'):
        actual = {row['id']: row for row in after['tables'][table]}
        for row in before['tables'][table]:
            if not owned(row):
                require(actual.get(row['id']) == row, f'非演示数据发生变化：{table}；停止并核对并发操作')


def registrations(data):
    tables = data['tables']
    products = {r['id']: r for r in tables['afs_product'] if r['enabled'] == '1'}
    stores = {r['id']: r for r in tables['afs_store'] if r['enabled'] == '1'}
    units = {r['id']: r for r in tables['afs_product_channel_unit']}
    items = {r['id']: r for r in tables['afs_purchase_item']}
    records = {r['id']: r for r in tables['afs_purchase_registration']}
    code_to_instance = {r['unique_code']: r for r in tables['afs_product_instance']
        if records.get(items.get(r['purchase_item_id'], {}).get('registration_id'), {}).get('status') == 'ACTIVE'}
    bound_units = {r['channel_unit_id'] for r in tables['afs_consumer_scanned_product']
        if r.get('status') not in {'UNBOUND', 'CANCELLED', 'INACTIVE'}}
    result = []
    for unit in units.values():
        if unit.get('product_id') not in products or unit.get('store_id') not in stores:
            continue
        instance = code_to_instance.get(unit['unique_code'])
        record = records.get(items.get(instance['purchase_item_id'], {}).get('registration_id')) if instance else None
        if (record and not owned(record)) or unit['id'] in bound_units:
            continue
        result.append({'unit': unit, 'product': products[unit['product_id']], 'store': stores[unit['store_id']],
                       'registration': record, 'instance': instance})
    return sorted(result, key=lambda slot: (slot['registration'] is None, int(slot['unit']['id'])))


def plan(data, count, day):
    slots = registrations(data)[:count]
    orders = [r for r in data['tables']['afs_service_order'] if owned(r)]
    active = [r for r in orders if r['status'] not in TERMINAL]
    old = [r for r in active if r['client_request_id'][len(PREFIX) + 2:len(PREFIX) + 10] != day.replace('-', '')]
    return {'日期': day, '目标': data['target']['db'], '可用演示商品': len(slots),
            '需要新增购买登记': sum(s['registration'] is None for s in slots),
            '既有演示工单': len(orders), '需要推进的旧待办': len(old),
            '今日保留的待办': len(active) - len(old),
            '演示场景': [SCENARIOS[scenario_for(i, len(slots), day)] for i in range(len(slots))],
            '完工审核策略': [{'mode': r['mode'], 'executionMode': r['execution_mode']} for r in data['tables'].get('afs_completion_audit_policy', [])],
            '处理方式': '保留历史；推进旧演示单；按商品补齐新待办；按需补库存和领料待审批',
            '清理现有测试单据': False, '基础资料修改': False, '定时任务安装': False}


class ApiError(RuntimeError):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code


class Client:
    BASE = 'http://127.0.0.1:8080/api/api'

    def __init__(self, account, password):
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.request('/sys/passport/captcha?userName=' + urllib.parse.quote(account))
        self.request('/sys/passport/login', 'POST', {'username': account, 'password': password, 'verificationCode': ''}, form=True)

    def request(self, path, method='GET', body=None, form=False):
        data = None if body is None else (urllib.parse.urlencode(body).encode() if form else json.dumps(body, ensure_ascii=False).encode())
        headers = {'Content-Type': 'application/x-www-form-urlencoded' if form else 'application/json'}
        return self.send(path, method, data, headers)

    def send(self, path, method, data, headers):
        request = urllib.request.Request(self.BASE + path, data=data, method=method, headers=headers)
        try:
            with self.opener.open(request, timeout=60) as response:
                result = json.load(response)
        except urllib.error.HTTPError as error:
            raise ApiError(f'{method} {path}：HTTP {error.code}，请核对服务器回执后再次执行') from None
        except (urllib.error.URLError, TimeoutError):
            raise ApiError(f'{method} {path}：连接或回执不明；不自动重试，请再次预览核对') from None
        if result.get('code') != 0:
            raise ApiError(f"{method} {path}：{result.get('code')} {result.get('errMsg', '接口拒绝')}", result.get('code'))
        return result.get('data')

    def upload(self, path):
        boundary = 'TotoDemo' + os.urandom(12).hex()
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="uploadFile"; filename="toto-demo-evidence.png"\r\nContent-Type: image/png\r\n\r\n'.encode()
                + path.read_bytes() + f'\r\n--{boundary}--\r\n'.encode())
        result = self.send('/sys/commontools/uploadFile', 'POST', body, {'Content-Type': 'multipart/form-data; boundary=' + boundary})
        reference = result.get('access', '')
        require(reference and len(reference) <= 200, '上传未返回可用的图片引用')
        return reference

    def image_exists(self, reference):
        if not reference.startswith('/api/sys/commontools/picture?id='):
            return False
        try:
            request = urllib.request.Request(self.BASE + reference.removeprefix('/api'), method='HEAD')
            with self.opener.open(request, timeout=30) as response:
                return response.status == 200 and response.headers.get('Content-Type', '').startswith('image/')
        except (urllib.error.URLError, TimeoutError):
            return False


class Simulator:
    def __init__(self, api, day, evidence, report):
        self.api, self.day, self.evidence, self.report = api, day, evidence, report

    def call(self, path, method='GET', body=None):
        result = self.api.request('/afterSales' + path, method, body)
        if method != 'GET':
            self.report['actions'].append({'method': method, 'path': path,
                'id': result.get('id') if isinstance(result, dict) else None})
        return result

    def detail(self, order_id):
        return self.call('/work-order/dispatch/' + str(order_id))

    def assign(self, row, station_id, personnel=True):
        row = self.detail(row['id'])
        if row['status'] == 'PENDING_DISPATCH':
            require('assignStation' in row.get('actions', []), '当前账号不能分站；未修改权限配置')
            options = self.call('/work-order/options/' + row['id'])
            if not any(s['id'] == station_id and (s.get('saturation') or 0) < 100 for s in options.get('recommendedStations', [])):
                self.report['skipped'].append({'id': row['id'], 'reason': '现有区域、服务项目或容量没有可用承接站，保留待分站'})
                return row
            row = self.call('/work-order/dispatch/' + row['id'] + '/station', 'PUT',
                {'stationId': station_id, 'mode': 'MANUAL', 'reason': '按现有服务区域分站', 'version': row['version']})
        if personnel and row['status'] == 'PENDING_ASSIGNMENT':
            options = self.call('/work-order/options/' + row['id'])
            candidates = [p for p in options.get('candidates', []) if p.get('available') and p.get('skilled') and not p.get('conflict')]
            if not candidates:
                self.report['skipped'].append({'id': row['id'], 'reason': '现有技能、排班或容量没有合格人员，保留待派人'})
                return row
            candidate = min(candidates, key=lambda p: (p.get('assignedCount') or 0, str(p['id'])))
            row = self.call('/work-order/dispatch/' + row['id'] + '/personnel', 'PUT',
                {'personnelId': candidate['id'], 'mode': 'DISPATCH', 'reason': '按现有技能和排班派人', 'version': row['version']})
        return row

    def submission(self, row):
        row = self.detail(row['id'])
        require('submitCompletion' in row.get('actions', []), '当前工单不能提交完工；请查看费用或业务状态')
        remote = row.get('serviceMode') == 'REMOTE'
        return self.call('/work-order/dispatch/' + row['id'] + '/completion-submissions', 'POST', {
            'version': row['version'], 'serviceResult': '已完成服务检查与操作说明，设备功能恢复正常。',
            'processRecord': '完成联系、问题排查、操作说明和结果核对。',
            'customerConfirmation': 'CONFIRMED', 'customerConfirmationNote': '客户已了解本次处理结果和后续使用注意事项。',
            'productCode': '', 'photoReferences': [] if remote else [self.evidence()],
            'nameplateReferences': [] if remote else [self.evidence()], 'signatureReference': '', 'partsSummary': ''})

    def review(self, row, reject=False):
        row = self.detail(row['id'])
        if row['status'] == 'CLOSED':
            return row  # Existing automatic audit may already have approved this submission.
        require(row['status'] == 'PENDING_REVIEW', '审核状态发生变化，请再次预览')
        command = {
            'version': row['version'], 'decision': 'REJECT' if reject else 'APPROVE',
            'reason': '请补充服务结果说明' if reject else '完工材料人工核对通过',
            'requiredItems': ['SERVICE_RESULT'] if reject else [], 'rejectionType': 'MATERIAL_ONLY' if reject else None}
        try:
            return self.call('/work-order/completion-reviews/' + row['id'], 'PUT', command)
        except ApiError as error:
            if error.code == 409:
                current = self.detail(row['id'])
                if current['status'] == 'CLOSED':
                    self.report['skipped'].append({'id': row['id'], 'reason': '现有自动审核已办结；保留自动审核结果'})
                    return current
            raise

    def advance(self, row, station_id):
        row = self.detail(row['id'])
        if row['status'] in TERMINAL:
            return row
        if row.get('exceptionCode'):
            row = self.call('/work-order/exceptions/' + row['id'], 'PUT', {'version': row['version'],
                'action': 'REOPEN', 'reason': '异常已解决，继续原服务', 'escalated': False})
        row = self.assign(row, station_id)
        if row['status'] == 'PENDING_COMPLETION':
            row = self.submission(row)
        if row['status'] == 'PENDING_REVIEW':
            row = self.review(row)
        if row['status'] in {'PENDING_DISPATCH', 'PENDING_ASSIGNMENT'}:
            row = self.call('/work-order/exceptions/' + row['id'], 'PUT', {'version': row['version'],
                'action': 'CANCEL', 'reason': '原预约无法满足分配条件，客户取消本次预约', 'escalated': False})
        return row

    def ensure_registration(self, slot, index):
        if slot['registration']:
            return self.call('/customer/records/' + slot['registration']['id'])
        store = slot['store']
        return self.call('/customer/registrations', 'POST', {
            'storeId': store['id'], 'sourceType': 'OFFLINE', 'purchaseDate': self.day,
            'purchaserMobile': '1990008' + f'{int(slot["unit"]["id"]) % 10000:04d}', 'userName': CUSTOMER_NAMES[index % len(CUSTOMER_NAMES)],
            'provinceName': store['location_province'], 'cityName': store['location_city'],
            'districtName': store.get('location_district') or '', 'streetName': '', 'detailAddress': f'{ADDRESS_NAMES[index % len(ADDRESS_NAMES)]}{index + 1}栋1单元602室',
            'longitude': store.get('longitude') or '', 'latitude': store.get('latitude') or '', 'vip': index % 4 == 0,
            'remark': '购买信息已登记。',
            'clientRequestId': PREFIX + 'R-' + slot['unit']['id'],
            'items': [{'productId': slot['product']['id'], 'quantity': 1, 'uniqueCode': slot['unit']['unique_code']}]})

    def fill_order(self, slot, record, index, previous, scenario):
        instance = record['instances'][0]
        existing = [r for r in previous if r['registration_id'] == record['id']]
        active = [r for r in existing if r['status'] not in TERMINAL]
        if active:
            return self.detail(active[0]['id'])
        installation = scenario in {0, 7} and instance.get('status') == 'AVAILABLE'
        faults = self.call('/customer/intake/faults?productId=' + slot['product']['id']) if scenario in {3, 4} else []
        order_type = 'INSTALLATION' if installation else 'REPAIR' if faults else 'GUIDANCE'
        store = slot['store']
        number = len(existing) + 1
        key = PREFIX + 'O-' + self.day.replace('-', '') + '-' + slot['unit']['id'] + '-' + str(number)
        row = self.call('/customer/intake/orders', 'POST', {
            'registrationId': record['id'], 'instanceIds': [instance['id']], 'orderType': order_type,
            'intakeChannel': 'PHONE', 'sourceReference': '客服热线', 'serviceMode': 'REMOTE' if order_type == 'GUIDANCE' else 'ONSITE',
            'contactName': CUSTOMER_NAMES[index % len(CUSTOMER_NAMES)], 'contactMobile': '1990008' + f'{int(slot["unit"]["id"]) % 10000:04d}',
            'provinceName': store['location_province'], 'cityName': store['location_city'],
            'districtName': store.get('location_district') or '', 'streetName': '', 'detailAddress': f'{ADDRESS_NAMES[index % len(ADDRESS_NAMES)]}{index + 1}栋1单元602室',
            'longitude': store.get('longitude') or '', 'latitude': store.get('latitude') or '', 'expectedDate': self.day,
            'expectedTimeWindow': f'{9 + index % 8:02d}:00', 'problemDescription': '咨询产品使用方法或预约设备功能检查。',
            'faultId': faults[0]['id'] if faults else None, 'faultName': faults[0]['faultName'] if faults else '',
            'faultSummary': (faults[0].get('faultSummary') or '故障检查') if faults else '', 'remark': SCENARIOS[scenario],
            'clientRequestId': key, 'createdStoreId': None})
        return row

    def scene(self, row, scenario, station_id, previously_rejected=False):
        if scenario == 0 or previously_rejected:
            return row
        row = self.assign(row, station_id, personnel=scenario != 1)
        if row['status'] != 'PENDING_COMPLETION':
            return row
        if scenario == 4 and row.get('serviceMode') != 'REMOTE' and not row.get('exceptionCode'):
            return self.call('/work-order/exceptions/' + row['id'], 'PUT', {'version': row['version'],
                'action': 'MISSING_PARTS', 'reason': '等待补充配件，计划按约定时间继续服务', 'escalated': False})
        if scenario in {5, 6, 7}:
            row = self.submission(row)
            if scenario == 6:
                row = self.review(row, reject=True)
        return row


def api_rows(api, path):
    result = []
    for page in range(1, 1001):
        data = api.request(path + ('&' if '?' in path else '?') + f'page={page}&pageSize=100')
        result.extend(data['rows'])
        if len(result) >= data['records']:
            return result
        require(data['rows'], '分页读取未完成；未执行业务写入')
    raise RuntimeError('数据规模超过演示脚本范围')


def process_old_inventory(sim, data):
    for document in data['tables']['afs_part_inventory_document']:
        if not owned(document) or document['create_time'][:10] >= sim.day:
            continue
        resource = RESOURCE.get(document['document_type'])
        if not resource or document['status'] not in {'PENDING', 'PROCESSING'}:
            continue
        row = sim.call('/inventory/' + resource + '/' + document['id'])
        action = 'SUBMIT' if resource == 'inbounds' else 'APPROVE'
        sim.call('/inventory/' + resource + '/' + document['id'] + '/actions', 'POST',
            {'action': action, 'version': row['version'], 'reason': '前次申请处理完成'})


def ensure_inventory(sim, data, station_id, order_rows):
    documents = data['tables']['afs_part_inventory_document']
    stock = api_rows(sim.api, '/afterSales/inventory/stock?ownerType=STATION&ownerId=' + station_id)
    quantities = {r['partId']: Decimal(str(r['quantity'])) for r in stock}
    parts = [p for p in data['tables']['afs_part'] if p['enabled'] == '1']
    lines = [{'partId': p['id'], 'quantity': 20 - int(quantities.get(p['id'], 0))}
             for p in parts if quantities.get(p['id'], 0) < 10]
    pending = [d for d in documents if owned(d) and d['document_type'] == 'INBOUND' and d['status'] == 'PENDING']
    if lines or pending:
        if pending:
            row = sim.call('/inventory/inbounds/' + pending[0]['id'])
        else:
            sequence = 1 + sum(owned(d) and d['document_type'] == 'INBOUND' for d in documents)
            row = sim.call('/inventory/inbounds', 'POST', {'sourceType': '', 'sourceId': '',
                'targetType': 'STATION', 'targetId': station_id, 'workOrderId': '', 'reason': '', 'physicalCondition': '',
                'remark': '补充服务站配件库存', 'clientRequestId': PREFIX + 'I-' + str(sequence), 'lines': lines})
        if row['status'] == 'PENDING':
            sim.call('/inventory/inbounds/' + row['id'] + '/actions', 'POST', {'action': 'SUBMIT', 'version': row['version'], 'reason': '入库完成'})
    existing_pending = [d for d in documents if owned(d) and d['document_type'] == 'REQUISITION'
                        and d['status'] == 'PROCESSING' and d['create_time'][:10] == sim.day]
    eligible = [r for r in order_rows if r.get('personnelId') and r.get('serviceMode') != 'REMOTE'
                and r['status'] == 'PENDING_COMPLETION'
                and not any(owned(d) and d['document_type'] == 'REQUISITION' and d['work_order_id'] == r['orderNo'] for d in documents)]
    for index, order in enumerate(eligible[:max(0, 2 - len(existing_pending))]):
        if not parts:
            break
        sequence = 1 + sum(owned(d) and d['document_type'] == 'REQUISITION' for d in documents) + index
        sim.call('/inventory/requisitions', 'POST', {'sourceType': 'STATION', 'sourceId': order['stationId'],
            'targetType': 'PERSONNEL', 'targetId': order['personnelId'], 'workOrderId': order['orderNo'],
            'reason': '维修领料', 'physicalCondition': '', 'remark': '申请配件，等待服务站审批',
            'clientRequestId': PREFIX + 'Q-' + sim.day.replace('-', '') + '-' + str(sequence),
            'lines': [{'partId': parts[index % len(parts)]['id'], 'quantity': 1}]})


def simulate(api, before, count, day, evidence, report):
    slots = registrations(before)[:count]
    require(slots, '没有可用的现有唯一码；现有购买登记和消费者绑定保持不变')
    simulator = Simulator(api, day, evidence, report)
    process_old_inventory(simulator, before)
    orders = [dict(r) for r in before['tables']['afs_service_order']]
    stations = before['tables']['afs_service_station']
    staff = before['tables']['afs_service_personnel']

    def station_for(slot):
        choices = [s for s in stations if s['enabled'] == '1'
                   and s['location_city'] == slot['store']['location_city']
                   and any(p['station_id'] == s['id'] and p['enabled'] == '1' for p in staff)]
        require(choices, '当前销售城市没有启用且有人承接的服务站；不修改服务网络')
        return choices[0]['id']

    for old in orders:
        if not owned(old) or old['status'] in TERMINAL or old['client_request_id'][len(PREFIX) + 2:len(PREFIX) + 10] == day.replace('-', ''):
            continue
        slot = next((s for s in registrations(before) if s['registration'] and s['registration']['id'] == old['registration_id']), None)
        require(slot, '旧演示工单的商品关系已改变，停止推进')
        old['status'] = simulator.advance(old, station_for(slot))['status']
    result = []
    rejected = {r['order_id'] for r in before['tables']['afs_completion_review'] if r['decision'] == 'REJECT'}
    for index, slot in enumerate(slots):
        record = simulator.ensure_registration(slot, index)
        scenario = scenario_for(index, len(slots), day)
        row = simulator.fill_order(slot, record, index, orders, scenario)
        unowned = any(r['id'] == row['id'] and not owned(r) for r in orders)
        if unowned:
            report['skipped'].append({'id': row['id'], 'reason': '该演示购买登记已有人工建单，保留其状态'})
        else:
            row = simulator.scene(row, scenario, station_for(slot), row['id'] in rejected)
        result.append(row)
    ensure_inventory(simulator, before, station_for(slots[0]), [r for r in result if not any(o['id'] == r['id'] and not owned(o) for o in orders)])
    return result


def apply(before, count):
    day = today()
    slots = registrations(before)[:count]
    require(slots, '没有可用的现有唯一码；现有购买登记和消费者绑定保持不变')
    phones = {'1990008' + f'{int(slot["unit"]["id"]) % 10000:04d}' for slot in slots if not slot['registration']}
    for row in before['tables']['afs_consumer_account'] + before['tables']['afs_customer']:
        require(row.get('mobile_ciphertext') not in phones and row.get('mobile_digest') not in phones,
                '拟用模拟手机号已被现有账号或顾客使用，拒绝新增或关联')
    api = Client(*credentials())
    units = api_rows(api, '/afterSales/catalog/product-channel-units')
    require({r['id'] for r in units} == {r['id'] for r in before['tables']['afs_product_channel_unit']}, 'API 与测试库实物档案不一致；拒绝业务写入')
    visible = api_rows(api, '/afterSales/customer/work-orders')
    require({r['id'] for r in visible} == {r['id'] for r in before['tables']['afs_service_order']}, 'API 数据范围或测试库不一致；请使用既有全局测试账号')
    api.request('/afterSales/customer/permissions')
    api.request('/afterSales/work-order/permissions')
    api.request('/afterSales/inventory/permissions')
    run = RUNTIME / datetime.now(timezone(timedelta(hours=8))).strftime('%Y%m%d-%H%M%S-%f')
    run.mkdir(mode=0o700)
    backup = run / 'before.json.gz'
    with gzip.open(backup, 'wt') as stream:
        json.dump(before, stream, ensure_ascii=False)
    os.chmod(backup, 0o600)
    report = {'date': day, 'backupSha256': hashlib.sha256(backup.read_bytes()).hexdigest(),
              'complete': False, 'actions': [], 'skipped': [], 'databaseDeletes': 0}
    references = []

    def evidence():
        if references:
            return references[0]
        cache = RUNTIME / 'evidence.json'
        if cache.exists():
            reference = json.loads(cache.read_text()).get('reference', '')
            if api.image_exists(reference):
                references.append(reference)
                return reference
        path = run / 'toto-demo-evidence.png'
        subprocess.run(java_command() + ['image', str(path)], check=True, capture_output=True, timeout=30)
        os.chmod(path, 0o600)
        reference = api.upload(path)
        references.append(reference)
        save(cache, {'reference': reference, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        report['syntheticEvidence'] = reference
        return reference

    failure = None
    try:
        simulate(api, before, count, day, evidence, report)
        report['complete'] = True
    except Exception as error:
        failure = error
        report['error'] = str(error)
    finally:
        save(run / 'result.json', report)
        try:
            after = snapshot()
            verify_preserved(before, after)
            report['protectedAndUnrelatedRowsVerified'] = True
            report['demoOrderStatusCounts'] = {}
            for row in after['tables']['afs_service_order']:
                if owned(row):
                    report['demoOrderStatusCounts'][row['status']] = report['demoOrderStatusCounts'].get(row['status'], 0) + 1
        except Exception as error:
            report['complete'] = False
            report['verificationError'] = str(error)
            failure = failure or error
        save(run / 'result.json', report)
        try:
            api.request('/sys/passport/logout', 'POST')
        except ApiError:
            pass
        print('执行记录：' + str(run / 'result.json'), flush=True)
        print(json.dumps({'complete': report['complete'], '业务动作数': len(report['actions']),
            '实际演示工单状态': report.get('demoOrderStatusCounts', {}), '跳过事项': report['skipped']}, ensure_ascii=False, indent=2))
    if failure:
        raise RuntimeError('本次未全部完成，已成功动作保留；回读执行记录后再次运行可继续：' + str(failure))


def check_backend():
    try:
        pids = subprocess.check_output(['lsof', '-nP', '-tiTCP:8080', '-sTCP:LISTEN'], text=True).split()
        require(len(set(pids)) == 1, '需要复用一个明确归属的本机后端 8080')
        command = subprocess.check_output(['ps', '-p', pids[0], '-o', 'command='], text=True)
        require(str(WORKSPACE / 'backend/gaia-saas-proj') in command, '8080 进程不属于当前 TOTO 宿主，拒绝业务写入')
    except subprocess.CalledProcessError:
        raise RuntimeError('本机后端尚未启动，请按本地开发文档启动后再执行 --apply') from None


@contextmanager
def run_lock():
    import fcntl
    RUNTIME.mkdir(parents=True, exist_ok=True, mode=0o700)
    require(not RUNTIME.is_symlink(), '运行目录不能为符号链接')
    os.chmod(RUNTIME, 0o700)
    path = RUNTIME / 'run.lock'
    require(not path.is_symlink(), '锁文件不能为符号链接')
    with path.open('a') as stream:
        os.chmod(path, 0o600)
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('另一个演示数据脚本正在执行') from None
        yield


def credentials():
    account = os.environ.get('TOTO_DEMO_ACCOUNT', 'afs_admin')
    password = os.environ.get('TOTO_DEMO_PASSWORD')
    if not password:
        manual = ROOT / '06-项目交付/01-业务指南/售后数据权限测试账号手册.md'
        match = re.search(r'统一密码：`([^`]+)`', manual.read_text())
        require(match, '请设置 TOTO_DEMO_PASSWORD 环境变量')
        password = match.group(1)
    return account, password


def main(argv=None):
    parser = argparse.ArgumentParser(description='手动补充当天演示业务；默认只读预览，不清理现有数据')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--preview', action='store_true', help='只读检查和预览（默认）')
    mode.add_argument('--apply', action='store_true', help='通过真实测试接口推进旧演示单并补齐当天待办')
    parser.add_argument('--slots', type=int, default=8, choices=range(1, 9), metavar='1..8', help='最多使用的现有商品唯一码，默认 8')
    args = parser.parse_args(argv)
    with run_lock():
        before = snapshot()
        print(json.dumps(plan(before, args.slots, today()), ensure_ascii=False, indent=2), flush=True)
        if not args.apply:
            return 0
        check_backend()
        apply(before, args.slots)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (RuntimeError, subprocess.TimeoutExpired, subprocess.CalledProcessError, OSError) as error:
        print('未完成：' + str(error), file=sys.stderr)
        sys.exit(1)

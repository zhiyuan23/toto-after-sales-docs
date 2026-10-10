#!/usr/bin/env python3
"""One-time three-month historical fixture for the fixed TOTO test database."""
import argparse
import calendar
from collections import Counter, defaultdict
from copy import deepcopy
from datetime import date, datetime, timedelta
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import random
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('daily_demo', ROOT / 'scripts/demo-data.py')
daily = importlib.util.module_from_spec(spec)
spec.loader.exec_module(daily)
PREFIX = 'TOTO-H90-V1-'
BASE = 730010100000000
ACTOR = '2026092200500001'  # Existing afs_admin; no account/permission provisioning.
ORDER = ['afs_consumer_account', 'afs_consumer_profile', 'afs_customer', 'afs_purchase_registration',
         'afs_purchase_item', 'afs_product_instance', 'afs_consumer_product_relation', 'afs_service_order',
         'afs_service_order_item', 'afs_order_fee', 'afs_order_status_history', 'afs_order_assignment_history',
         'afs_order_communication', 'afs_order_exception_event', 'afs_service_execution',
         'afs_completion_submission', 'afs_completion_review', 'afs_service_evaluation', 'afs_complaint',
         'afs_complaint_event', 'afs_order_follow_up_task', 'afs_service_quality_daily']
CURRENT_NAMES = ['陈宇航', '王雨桐', '李明轩', '刘思远', '张欣怡', '赵文博', '孙佳宁', '周子涵']
ADDRESS_NAMES = ['清和里', '云锦苑', '锦绣园', '景和家园', '悦澜湾', '润景苑', '和悦府', '春熙里']


def need(ok, reason):
    if not ok:
        raise RuntimeError(reason)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def stamp(value):
    # MySQL JDBC returns DATETIME as LocalDateTime.toString(), which omits zero seconds.
    return value.isoformat(timespec='minutes' if value.second==0 else 'seconds')


def window(end):
    total = end.year * 12 + end.month - 1 - 3
    year, month = divmod(total, 12)
    return date(year, month + 1, min(end.day, calendar.monthrange(year, month + 1)[1])) + timedelta(days=1)


class Fixture:
    def __init__(self, snapshot, now):
        self.before = snapshot
        self.now = now.replace(microsecond=0)
        self.start = window(now.date())
        self.random = random.Random(20261010)
        self.added = {t: [] for t in ORDER}
        self.updated = defaultdict(list)
        self.originals = defaultdict(list)
        self.sequence = Counter()
        self.columns = {}
        for t, ddl in snapshot['schemas'].items():
            self.columns[t] = dict(re.findall(r'^  `([a-z0-9_]+)` (.+?)(?:,)?$', ddl, re.M))
        self.people = sorted(snapshot['tables']['afs_service_personnel'], key=lambda r: int(r['id']))
        need({r['name'] for r in self.people} == {'孙志远', '王喆宇', '杨师傅'}, '人员范围发生变化，先核对再生成')
        need(all(p['station_id'] == '5' for p in self.people), '人员服务站发生变化')
        self.station = next(s for s in snapshot['tables']['afs_service_station'] if s['id'] == '5')
        linked = {r['area_id'] for r in snapshot['tables']['afs_service_area_station'] if r['station_id'] == '5'}
        self.areas = [a for a in snapshot['tables']['afs_service_area'] if a['id'] in linked and a['enabled'] == '1' and a['scope_level'] == 'DISTRICT']
        need(self.areas and self.station['enabled'] == '1', '现有服务区域不可用')
        self.products = [p for p in snapshot['tables']['afs_product'] if p['enabled'] == '1']
        need(len(self.products) >= 3, '商品不足')
        self.dealers = {r['id']: r for r in snapshot['tables']['afs_dealer'] if r['enabled'] == '1'}
        self.stores = [s for s in snapshot['tables']['afs_store'] if s['enabled'] == '1' and s['dealer_id'] in self.dealers and s.get('location_province_code')]
        need(self.stores, '无可用门店')
        self.local_stores = [s for s in self.stores if s['location_province_code'] == '210000' and s['location_city_code'] == '210100']
        need(self.local_stores, '服务区域无可用门店')
        self.availability = {(r['personnel_id'], r['schedule_date']): r for r in snapshot['tables']['afs_personnel_availability']}
        self.skills = {(r['personnel_id'], r['order_type']) for r in snapshot['tables']['afs_service_personnel_skill']}
        self.tags = [t for t in snapshot['tables']['afs_evaluation_tag'] if t['enabled'] == '1']
        policy_id = next(r['version_id'] for r in snapshot['tables']['afs_fee_policy'] if r['id']=='1')
        self.policy = next(r for r in snapshot['tables']['afs_fee_policy_version'] if r['id']==policy_id)
        need(self.policy['mode'] == 'FREE_ONLY', '费用政策已变化，需要重新设计历史费用')
        need(not any(o['client_request_id'].startswith(PREFIX) for o in snapshot['tables']['afs_service_order']), '历史批次已存在；请使用日常脚本补充待办，不重复导入历史')
        self.quality = defaultdict(lambda: Counter(service_count=0, on_time_count=0, first_time_resolved_count=0, rated_count=0, rating_total=0, complaint_count=0))
        self.households = []
        self.closed_meta = {}
        self.current_evidence = json.loads((ROOT / '.local/demo-data/evidence.json').read_text())['reference']
        need(re.fullmatch(r'/api/sys/commontools/picture\?id=\d+', self.current_evidence), '合成附件缓存格式不正确')

    def id(self, t):
        self.sequence[t] += 1
        need(self.sequence[t] < 100000, '超出专用 ID 段')
        return str(BASE + (ORDER.index(t) + 1) * 100000 + self.sequence[t])

    def row(self, t, **values):
        result = {}
        need(set(values) <= set(self.columns[t]), '未知字段：' + t)
        for k, definition in self.columns[t].items():
            if k in values:
                value = values[k]
            else:
                default = re.search(r"\bDEFAULT ('(?:''|[^'])*'|NULL|CURRENT_TIMESTAMP(?:\(\))?|[0-9.-]+)", definition)
                if default:
                    raw = default[1]
                    value = None if raw == 'NULL' else self.now if raw.startswith('CURRENT_TIMESTAMP') else raw[1:-1].replace("''", "'") if raw.startswith("'") else raw
                else:
                    need('NOT NULL' not in definition, f'缺少必填字段：{t}.{k}')
                    value = None
            if isinstance(value, datetime):
                value = stamp(value) if not definition.startswith('timestamp') else value.strftime('%Y-%m-%d %H:%M:%S.0')
            elif isinstance(value, date):
                value = value.isoformat()
            elif value is not None:
                value = str(value)
            result[k] = value
        self.added[t].append(result)
        return result

    def location(self, area):
        return {k: area[k] for k in ['province_code', 'province_name', 'city_code', 'city_name', 'district_code', 'district_name', 'street_name']}

    def household(self, when, area, overseas=False, kind='GUIDANCE'):
        candidates = [h for h in self.households if h['area']['id'] == area['id'] and h['created'] + timedelta(days=14) < when]
        if not overseas and kind != 'INSTALLATION' and candidates and self.random.random() < .27:
            return self.random.choice(candidates)
        n = len(self.households)
        surnames = '陈王李刘张赵孙周吴郑黄徐朱林何郭马罗梁宋唐许韩冯邓曹彭曾萧田董潘袁蔡蒋余杜叶程魏苏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛阎段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤'
        given = ['宇航', '雨桐', '明轩', '思远', '欣怡', '文博', '佳宁', '子涵', '晨曦', '雅雯', '景行', '乐瑶', '志成', '书涵', '晓宁', '嘉禾', '俊杰', '悦心', '沐晴', '瑞安']
        name = surnames[n % len(surnames)] + given[(n // len(surnames)) % len(given)]
        phone = f'1990009{n:04d}'
        need(n < 10000, '手机占位段不足')
        address = f'{ADDRESS_NAMES[n % len(ADDRESS_NAMES)]}{n % 22 + 1}栋{n % 3 + 1}单元{n % 16 + 1:02d}02室'
        created = when - timedelta(days=4 if kind == 'INSTALLATION' else 25 + n % 210)
        store_pool = self.stores if overseas or n % 11 == 0 else self.local_stores
        store = self.random.choice(store_pool)
        dealer = self.dealers[store['dealer_id']]
        product = self.products[self.random.randrange(len(self.products))]
        account = self.row('afs_consumer_account', id=self.id('afs_consumer_account'), openid_digest=digest(PREFIX + 'ACCOUNT-' + str(n)),
                           mobile_digest=phone, mobile_ciphertext=phone, mobile_masked=phone,
                           phone_binding_source='LOCAL_TEST', phone_verified_at=None, enabled=0, create_time=created, update_time=created)
        self.row('afs_consumer_profile', tenant_id='1001', account_id=account['id'], user_name=name, **{k:v for k,v in self.location(area).items() if k!='street_name'}, detail_address=address, create_time=created, update_time=created)
        customer = self.row('afs_customer', id=self.id('afs_customer'), mobile_digest=phone, mobile_ciphertext=phone, mobile_masked=phone,
                            name_digest=name, name_ciphertext=name, name_masked=name, create_user=ACTOR, create_time=created, update_user=ACTOR, update_time=created)
        registration = self.row('afs_purchase_registration', id=self.id('afs_purchase_registration'), registration_no=f'H90-R-{n+1:06d}',
                                customer_id=customer['id'], owner_consumer_account_id=account['id'], dealer_id=dealer['id'], dealer_code=dealer['code'], dealer_name=dealer['name'],
                                store_id=store['id'], store_code=store['code'], store_name=store['name'], source_type='OFFLINE', verification_status='VERIFIED',
                                verification_method='DEALER_REGISTRATION', status='ACTIVE', purchase_date=created.date(), **self.location(area), address_ciphertext=address, address_masked=address,
                                client_request_id=PREFIX + f'R-{n+1}', create_user=ACTOR, create_time=created, update_user=ACTOR, update_time=created)
        item = self.row('afs_purchase_item', id=self.id('afs_purchase_item'), registration_id=registration['id'], product_id=product['id'],
                        product_code=product['code'], product_name=product['name'], quantity=1, create_user=ACTOR, create_time=created,
                        **{k: product.get(k.removesuffix('_snapshot')) for k in self.columns['afs_purchase_item'] if k.endswith('_snapshot')}, warranty_snapshot_source='PRODUCT_AT_REGISTRATION', warranty_snapshot_at=self.now)
        instance = self.row('afs_product_instance', id=self.id('afs_product_instance'), purchase_item_id=item['id'], instance_no=f'H90-P-{n+1:06d}',
                            status='AVAILABLE', create_user=ACTOR, create_time=created, update_user=ACTOR, update_time=created)
        self.row('afs_consumer_product_relation', id=self.id('afs_consumer_product_relation'), account_id=account['id'], account_kind='CONSUMER',
                 instance_id=instance['id'], relation_role='OWNER', source_type='PURCHASE_MATCH', status='ACTIVE', create_user=ACTOR, create_time=created, update_user=ACTOR, update_time=created)
        h = dict(account=account, customer=customer, registration=registration, instance=instance, product=product, area=area, name=name, phone=phone, address=address, created=created, store=store)
        self.households.append(h)
        return h

    def history(self, order, states):
        previous = None
        for to, when, reason, text in states:
            self.row('afs_order_status_history', id=self.id('afs_order_status_history'), order_id=order['id'], from_status=previous,
                     to_status=to, reason_code=reason, remark=text, operator_id=ACTOR, source='ADMIN', created_at=when)
            previous = to

    def order(self, day, person, index, start_time, cancel=False, area=None):
        rnd = self.random
        kinds = ['INSTALLATION', 'REPAIR', 'GUIDANCE']
        if not cancel:
            published = self.availability.get((person['id'],day.isoformat()))
            kinds = [k for k in kinds if (person['id'],k) in self.skills and (not published or k in published['service_items'].split(','))]
            need(kinds, '当日没有适用的服务技能/排班')
        kind = rnd.choices(kinds, [{'INSTALLATION':28,'REPAIR':43,'GUIDANCE':29}[k] for k in kinds])[0]
        if cancel and index==0 and day.toordinal()%5==0:
            kind = 'CLEANING'
        if not cancel:
            need((person['id'], kind) in self.skills, '拟用技能不存在')
            need(kind in self.station['service_items'].split(','), '网点服务项目不匹配')
        area = area or self.areas[(day.toordinal() + int(person['id'])) % len(self.areas)]
        late = not cancel and day >= self.start + timedelta(days=3) and rnd.random() < (.20 if day.month == self.start.month else .13 if day.month == (self.start.month % 12 + 1) else .08)
        expected = day - timedelta(days=1) if late else day
        create = datetime.combine(max(self.start, expected - timedelta(days=rnd.choice([0, 1, 1, 2]))), datetime.min.time()).replace(hour=7, minute=rnd.randrange(45))
        h = self.household(create, area, cancel, kind)
        source = rnd.choices(['DEALER', 'CUSTOMER_SERVICE', 'CONSUMER', 'API'], [34, 35, 25, 6])[0]
        channel = 'DEALER' if source == 'DEALER' else 'CONSUMER' if source == 'CONSUMER' else 'API' if source == 'API' else rnd.choice(['PHONE', 'WECHAT'])
        problem = {'INSTALLATION': '新居装修完工，预约产品安装及使用说明。', 'REPAIR': rnd.choice(['使用时出水量偏小，请协助检查水压及进水接口。', '设备工作时出现间歇性异响，希望检查安装连接。', '接缝处偶有渗水，希望检查密封及接口。', '日常使用出现操作异常，请协助排查。']),
                   'GUIDANCE': rnd.choice(['咨询首次使用注意事项及日常保养方法。', '咨询功能设置与操作方法。', '希望了解长时间停用后的清洁和恢复使用方法。']), 'CLEANING': '预约产品清洁与日常养护。'}[kind]
        oid = self.id('afs_service_order')
        ended = start_time + timedelta(minutes=rnd.randrange(22, 38) if kind == 'GUIDANCE' else rnd.randrange(55, 86))
        reviewed = ended + timedelta(minutes=20 + rnd.randrange(25))
        need(reviewed <= self.now, '不能生成未来办结记录')
        order = self.row('afs_service_order', id=oid, order_no='H90-SO-' + str(self.sequence['afs_service_order']).zfill(6), order_type=kind,
                         source=source, customer_id=h['customer']['id'], registration_id=h['registration']['id'], contact_name_ciphertext=h['name'], contact_name_masked=h['name'],
                         contact_mobile_digest=h['phone'], contact_mobile_ciphertext=h['phone'], contact_mobile_masked=h['phone'], **self.location(area), address_ciphertext=h['address'], address_masked=h['address'],
                         expected_date=expected, expected_date_to=expected, expected_time_window=start_time.strftime('%H:%M'), station_id=None if cancel else '5',
                         status='CANCELLED' if cancel else 'CLOSED', status_changed_at=start_time if cancel else reviewed,
                         client_request_id=PREFIX + 'O-' + str(self.sequence['afs_service_order']), create_user=ACTOR, create_time=create, update_user=ACTOR, update_time=reviewed,
                         intake_channel=channel, source_reference_ciphertext={'PHONE': '客服热线', 'WECHAT': '客户咨询', 'CONSUMER': '线上申请', 'API': '业务渠道同步', 'DEALER': '门店预约'}[channel],
                         source_reference_masked={'PHONE': '客服热线', 'WECHAT': '客户咨询', 'CONSUMER': '线上申请', 'API': '业务渠道同步', 'DEALER': '门店预约'}[channel],
                         service_mode='REMOTE' if kind == 'GUIDANCE' else 'ONSITE', problem_description=problem,
                         personnel_id=None if cancel else person['id'], personnel_code='' if cancel else person['code'], personnel_name='' if cancel else person['name'], personnel_mobile='' if cancel else person['mobile'],
                         station_assignment_mode='' if cancel else 'MANUAL', station_assignment_rule='' if cancel else '按服务地址匹配现有区域', dispatch_mode='' if cancel else 'DISPATCH', dispatch_reason='' if cancel else '按技能与当日工作量安排',
                         created_store_id=h['store']['id'] if source == 'DEALER' else None, created_store_code=h['store']['code'] if source == 'DEALER' else None, created_store_name=h['store']['name'] if source == 'DEALER' else None)
        self.row('afs_service_order_item', order_id=oid, instance_id=h['instance']['id'], create_user=ACTOR, create_time=create)
        self.row('afs_order_fee', order_id=oid, policy_version_id=self.policy['id'], mode='FREE_ONLY', fee_type='FREE', policy_snapshot=self.policy['snapshot'], create_user=ACTOR, created_at=self.now)
        self.row('afs_order_communication', id=self.id('afs_order_communication'), order_id=oid, channel='PHONE', content_ciphertext='已联系客户核对问题与期望服务时间。', occurred_at=create + timedelta(minutes=20), request_id=PREFIX+'C-'+str(self.sequence['afs_service_order']), request_hash=digest(oid+'contact'), actor_id=ACTOR, created_at=create+timedelta(minutes=20))
        states = [('PENDING_DISPATCH', create, '', '已受理服务申请')]
        if cancel:
            reason = rnd.choice(['客户装修进度调整，取消本次预约。', '客户时间安排变化，取消预约后另行联系。', '客户确认不再需要本次服务。']) if kind != 'CLEANING' else '当前区域暂无可匹配的清洁服务人员，客户取消本次预约。'
            order.update(exception_code='CANCEL', exception_reason=reason, exception_previous_status='PENDING_DISPATCH', update_time=stamp(start_time))
            states.append(('CANCELLED', start_time, 'CANCEL', reason))
            self.row('afs_order_exception_event', id=self.id('afs_order_exception_event'), order_id=oid, action_code='CANCEL', from_status='PENDING_DISPATCH', to_status='CANCELLED', reason=reason, operator_id=ACTOR, created_at=start_time)
            self.history(order, states)
            return reviewed + timedelta(minutes=15)
        assigned = start_time - timedelta(minutes=2)
        dispatched = start_time - timedelta(minutes=1)
        states += [('PENDING_ASSIGNMENT', assigned, 'ASSIGN_STATION', '已匹配服务站'), ('PENDING_COMPLETION', dispatched, 'DISPATCH_PERSONNEL', '已安排服务人员')]
        for typ, target in [('STATION', '5'), ('PERSONNEL', person['id'])]:
            self.row('afs_order_assignment_history', id=self.id('afs_order_assignment_history'), order_id=oid, assignment_type=typ,
                     to_target_id=target, mode='MANUAL' if typ=='STATION' else 'DISPATCH', reason='按服务区域、技能与工作量安排', operator_id=ACTOR, created_at=assigned if typ=='STATION' else dispatched)
        self.row('afs_service_execution', order_id=oid, personnel_id=person['id'], station_id='5', service_active=0,
                 start_mode='REMOTE' if kind == 'GUIDANCE' else 'ONSITE', current_step='SUBMIT', started_at=start_time, ended_at=ended,
                 create_user=ACTOR, create_time=start_time, update_user=ACTOR, update_time=ended)
        rework = rnd.random() < .09
        continued = rework and kind=='REPAIR' and rnd.random()<.5
        result = {'INSTALLATION': '安装连接及功能检查完成，已说明使用与保养事项。', 'REPAIR': '完成接口、连接与工作状态检查，调整后功能恢复正常。', 'GUIDANCE': '已完成操作指导，客户能够按说明正确使用。'}[kind]
        first = None
        for version in range(1, 3 if rework else 2):
            submitted = ended + timedelta(minutes=3 if version==1 else 22)
            submission = self.row('afs_completion_submission', id=self.id('afs_completion_submission'), order_id=oid, version_no=version, service_result=result,
                                  product_code='', photo_references='' if kind=='GUIDANCE' else self.current_evidence, signature_reference='', submitter_id=ACTOR, submitted_at=submitted,
                                  process_record=problem + '已完成联系、现场或远程检查、结果核对及使用说明。', customer_confirmation='CONFIRMED', customer_confirmation_note='客户确认已了解本次服务结果和后续使用注意事项。',
                                  site_evidence='' if kind=='GUIDANCE' else self.current_evidence, nameplate_evidence='' if kind=='GUIDANCE' else self.current_evidence,
                                  communication_evidence='', confirmation_evidence='', parent_submission_id=first, supplemented_items='SERVICE_RESULT' if version>1 else '', supplement_note='补充复检结果与处理过程。' if version>1 else '',
                                  client_request_id=PREFIX + f'S-{self.sequence["afs_service_order"]}-{version}', request_hash=digest(oid+str(version)))
            states.append(('PENDING_REVIEW', submitted, 'SUBMIT_COMPLETION', f'提交完工材料第{version}版'))
            rejected = rework and version==1
            review_time = ended+timedelta(minutes=12) if rejected else max(reviewed, submitted+timedelta(minutes=10))
            reviewed = review_time if not rejected else reviewed
            self.row('afs_completion_review', id=self.id('afs_completion_review'), order_id=oid, submission_id=submission['id'], decision='REJECT' if rejected else 'APPROVE',
                     reason=('需再次检查调整并复核工作状态。' if continued else '请补充复检结果与处理过程。') if rejected else '处理结果及完工记录核对通过。', reviewer_id=ACTOR, reviewed_at=review_time,
                     required_items='SERVICE_RESULT' if rejected else '', rejection_type=('CONTINUE_SERVICE' if continued else 'MATERIAL_ONLY') if rejected else '')
            states.append(('PENDING_COMPLETION' if rejected else 'CLOSED', review_time, 'REVIEW_REJECT' if rejected else 'REVIEW_APPROVE', '补充服务记录' if rejected else '审核通过'))
            first = submission['id']
        order['status_changed_at'] = order['update_time'] = stamp(reviewed)
        self.history(order, states)
        evaluation = None
        if rnd.random() < .77:
            score = rnd.choices([1,2,3,4,5], [1,2,7,27,63])[0]
            if late or rework:
                score = min(score, rnd.choice([3,4,4,5]))
            resolution = 'RESOLVED' if score>=4 else 'PARTIAL' if score>=2 else 'UNRESOLVED'
            tags = [t for t in self.tags if kind in t['service_types'].split(',') and t['sentiment'] == ('POSITIVE' if score>=4 else 'IMPROVEMENT')]
            chosen = sorted(rnd.sample(tags, min(2,len(tags))), key=lambda t:t['code'])
            evaluation = self.row('afs_service_evaluation', order_id=oid, account_id=h['account']['id'], score=score, resolution=resolution,
                                  tags=','.join(t['code'] for t in chosen), comment=rnd.choice(['沟通及时，处理过程清楚。', '问题处理好，使用说明比较详细。', '预约方便，师傅比较认真。']) if score>=4 else rnd.choice(['等待时间偏长，希望后续能提前通知。', '希望处理结果说明更详细一些。', '问题仍需要继续观察，希望保持跟进。']),
                                  submitted_at=min(self.now, reviewed+timedelta(hours=rnd.randrange(1,30))), tag_snapshot=json.dumps([{k:t[k] for k in ['code','label','dimension','sentiment']} for t in chosen], ensure_ascii=False, separators=(',',':')),
                                  order_type=kind, service_mode=order['service_mode'], station_id='5', personnel_id=person['id'])
        recent_case = day>=self.now.date()-timedelta(days=4) and person['id']=='5' and index==0
        complaint = recent_case or rnd.random() < (.24 if evaluation and int(evaluation['score'])<=2 else .055 if late or rework else .025)
        if complaint:
            when = min(self.now, reviewed+timedelta(hours=3))
            done = not recent_case and (day <= self.now.date()-timedelta(days=5) or rnd.random()<.7)
            closed = min(self.now, when+timedelta(days=rnd.choice([1,2,3]), hours=2)) if done else None
            subject = rnd.choice(['预约等待时间较长', '服务说明不够清晰', '使用效果仍需跟进'])
            cp = self.row('afs_complaint', id=self.id('afs_complaint'), order_id=oid, complaint_no='H90-CP-'+str(self.sequence['afs_complaint']).zfill(5), subject=subject,
                          status='CLOSED' if done else 'PROCESSING', content_ciphertext=subject+'，希望客服协调复核并反馈后续安排。', actor_id=ACTOR,
                          request_id=PREFIX+'CP-'+str(self.sequence['afs_complaint']), request_hash=digest(oid+'complaint'), received_at=when, created_at=when, updated_at=closed or when, closed_at=closed,
                          source_type='STAFF', issue_category='', resolution_ciphertext='已核实处理情况并补充操作说明，后续由客服持续关注使用情况。' if done else None, revision=3 if done else 2)
            events = [('create','','PROCESSING',when,'已受理客户反馈，转客服跟进。'), ('followup','PROCESSING','PROCESSING',min(self.now,when+timedelta(hours=4)),'已联系服务站核实情况并回电说明。')]
            if done:
                events.append(('resolve','PROCESSING','CLOSED',closed,'已反馈核查结果与后续注意事项。'))
            for j,(action,from_status,to_status,at,text) in enumerate(events):
                self.row('afs_complaint_event', id=self.id('afs_complaint_event'), complaint_id=cp['id'], action_code=action, from_status=from_status, to_status=to_status,
                         content_ciphertext=text, actor_id=ACTOR, request_id=PREFIX+f'CE-{self.sequence["afs_complaint"]}-{j}', request_hash=digest(cp['id']+str(j)), created_at=at)
        if complaint or rnd.random()<.19:
            selected = min(self.now,reviewed+timedelta(hours=2))
            pending = day >= self.now.date()-timedelta(days=2) and (recent_case or rnd.random()<.4)
            state = 'PENDING' if pending else 'UNREACHABLE' if rnd.random()<.12 else 'COMPLETED'
            satisfaction = '' if state!='COMPLETED' else 'UNSATISFIED' if evaluation and int(evaluation['score'])<=2 else 'SATISFIED'
            handled = None if pending else min(self.now,selected+timedelta(days=1))
            self.row('afs_order_follow_up_task', order_id=oid, status=state, sample_reason='客户反馈重点复核' if complaint else '本周服务质量抽样',
                     result_ciphertext='' if pending else '多次联系未接通，保留后续联系渠道。' if state=='UNREACHABLE' else '已回访客户并核对使用情况，记录后续使用与保养建议。',
                     satisfaction=satisfaction, selected_by=ACTOR, selected_at=selected, handled_by=None if pending else ACTOR, handled_at=handled, revision=1 if pending else 2)
            if state=='COMPLETED':
                order.update(follow_up_status='FOLLOWED_UP', satisfaction=satisfaction, update_time=stamp(handled))
        if continued:
            ended += timedelta(minutes=18)
            execution=self.added['afs_service_execution'][-1]
            execution['ended_at']=execution['update_time']=stamp(ended)
        metrics = dict(service_count=1, on_time_count=int(ended.date()<=expected), first_time_resolved_count=int(not continued and (not evaluation or evaluation['resolution']=='RESOLVED')),
                       rated_count=int(evaluation is not None), rating_total=int(evaluation['score']) if evaluation else 0, complaint_count=int(complaint))
        self.closed_meta[oid] = dict(date=ended.date().isoformat(), area=area['id'], **metrics)
        for scope, sid, name in [('STATION','5',self.station['name']), ('PERSONNEL',person['id'],person['name']), ('AREA',area['id'],area['name'])]:
            self.quality[(ended.date().isoformat(),scope,sid,name)].update(metrics)
        return ended + timedelta(minutes=25 if kind!='GUIDANCE' else 12)

    def normalize_current(self):
        registrations = sorted([r for r in self.before['tables']['afs_purchase_registration'] if daily.owned(r)], key=lambda r:int(r['id']))
        names = {r['customer_id']: CURRENT_NAMES[i % len(CURRENT_NAMES)] for i,r in enumerate(registrations)}
        addresses = {r['id']: f'{ADDRESS_NAMES[i % len(ADDRESS_NAMES)]}{i+1}栋1单元602室' for i,r in enumerate(registrations)}
        order_ids = {o['id'] for o in self.before['tables']['afs_service_order'] if daily.owned(o)}
        inventory_ids = {d['id'] for d in self.before['tables']['afs_part_inventory_document'] if daily.owned(d)}
        allowed = {'afs_customer':lambda r:r['id'] in names, 'afs_purchase_registration':daily.owned, 'afs_service_order':daily.owned,
                   'afs_completion_submission':lambda r:r['order_id'] in order_ids, 'afs_completion_review':lambda r:r['order_id'] in order_ids,
                   'afs_order_assignment_history':lambda r:r['order_id'] in order_ids, 'afs_order_status_history':lambda r:r['order_id'] in order_ids,
                   'afs_order_exception_event':lambda r:r['order_id'] in order_ids, 'afs_part_inventory_document':lambda r:r['id'] in inventory_ids,
                   'afs_part_inventory_history':lambda r:r.get('document_id') in inventory_ids}
        substitutions = {'【模拟数据】':'', '模拟业务：':'', '上一演示日':'原预约时间', '演示业务':'客服热线', '演示维修领料':'维修领料', '演示入库完成':'入库完成', '模拟异常':'异常', '模拟客户':'客户',
                         '下一演示日':'约定时间', '软件演示':'服务登记', '演示材料':'完工材料', '已完成演示服务':'已完成服务', '演示服务':'服务', '无真实签名':'确认记录已归档', '无真实购买凭证':'购买资料已登记',
                         '不代表真实履约。':'', '无真实报修。':'', '仅用于软件演示':'购买信息登记', '模拟故障检查':'故障检查', '演示':'', '模拟':'', '测试':''}
        for t, predicate in allowed.items():
            for old in self.before['tables'][t]:
                if not predicate(old):
                    continue
                new = deepcopy(old)
                for k,v in old.items():
                    if not isinstance(v,str) or k in self.before['keys'][t] or k.endswith('_id') or k.endswith('_code') or k.endswith('_no') or k.endswith('_hash') or k in {'client_request_id','request_id'} or re.fullmatch(r'/api/.+',v):
                        continue
                    for a,b in substitutions.items():
                        new[k] = new[k].replace(a,b)
                if t=='afs_customer':
                    new.update(name_ciphertext=names[old['id']], name_masked=names[old['id']], name_digest=names[old['id']])
                elif t=='afs_purchase_registration':
                    new.update(address_ciphertext=addresses[old['id']],address_masked=addresses[old['id']],remark='购买信息已登记。')
                elif t=='afs_service_order':
                    new.update(contact_name_ciphertext=names[old['customer_id']],contact_name_masked=names[old['customer_id']],address_ciphertext=addresses[old['registration_id']],address_masked=addresses[old['registration_id']],problem_description='咨询产品使用方法或预约设备功能检查。')
                if new!=old:
                    if 'revision' in new:
                        new['revision']=str(int(old['revision'])+1)
                    if 'update_time' in new:
                        new['update_time']=stamp(self.now)
                    if 'update_user' in new:
                        new['update_user']=ACTOR
                    self.updated[t].append(new)
                    self.originals[t].append(old)

    def build(self):
        end = self.now.date()
        day = self.start
        all_areas = [a for a in self.before['tables']['afs_service_area'] if a['enabled']=='1' and a['scope_level']=='DISTRICT' and a['province_code']!='210000']
        while day<=end:
            for person in self.people:
                published = self.availability.get((person['id'],day.isoformat()))
                if published and (published['availability']!='AVAILABLE' or published['day_type']!='WORK'):
                    continue
                if published and not set(published['service_items'].split(',')) & {'INSTALLATION','REPAIR','GUIDANCE'}:
                    continue
                capacity = int(person['daily_capacity'])
                count = max(1, capacity-self.random.randrange(0,2)) if day.weekday()<5 else self.random.randrange(2,min(capacity,4)+1)
                at = datetime.combine(day,datetime.min.time()).replace(hour=8,minute=30)
                for index in range(count):
                    if at+timedelta(hours=3)>self.now:
                        break
                    at = self.order(day,person,index,at)
            for index in range(1 + int(day.weekday()<5 and day.toordinal()%3==0)):
                at = datetime.combine(day,datetime.min.time()).replace(hour=8,minute=10+index*10)
                if at+timedelta(hours=2)<=self.now:
                    self.order(day,None,index,at,cancel=True,area=self.random.choice(all_areas))
            day += timedelta(days=1)
        for (day,scope,sid,name), metrics in sorted(self.quality.items()):
            self.row('afs_service_quality_daily', id=self.id('afs_service_quality_daily'),snapshot_date=day,scope_type=scope,scope_id=sid,scope_name=name,generated_at=self.now,
                     **{**metrics,'rating_total':f'{metrics["rating_total"]:.2f}'})
        self.normalize_current()
        self.validate()
        return self

    def validate(self):
        tables = {t:{r.get('id'):r for r in rows} for t,rows in self.added.items()}
        orders = tables['afs_service_order']
        executions = {r['order_id']:r for r in self.added['afs_service_execution']}
        evaluations = {r['order_id']:r for r in self.added['afs_service_evaluation']}
        complaints = {r['order_id'] for r in self.added['afs_complaint']}
        submissions = defaultdict(list)
        reviews = defaultdict(list)
        intervals = defaultdict(list)
        for r in self.added['afs_completion_submission']:
            submissions[r['order_id']].append(r)
        for r in self.added['afs_completion_review']:
            reviews[r['order_id']].append(r)
        for t, rows in self.added.items():
            keys = self.before['keys'][t]
            existing = {tuple(r[k] for k in keys) for r in self.before['tables'][t]}
            new = [tuple(r[k] for k in keys) for r in rows]
            need(len(new)==len(set(new)) and not existing.intersection(new), '主键冲突：'+t)
            for r in rows:
                if 'id' in r:
                    need(BASE<int(r['id'])<BASE+3000000, '专用 ID 范围错误')
                for k,v in r.items():
                    if v and not k.endswith(('_id','_code','_no','_hash')) and k not in {'openid_digest','phone_binding_source','request_id','client_request_id','photo_references','site_evidence','nameplate_evidence'}:
                        need(not re.search('测试|演示|模拟',v), '展示文字含标记：'+t+'.'+k)
        per_day=Counter()
        for order in orders.values():
            need(self.start.isoformat()<=order['create_time'][:10]<=self.now.date().isoformat(), '报表日期超界')
            need(order['status_changed_at']<=self.now.isoformat(timespec='seconds'), '未来状态')
            if order['status']=='CLOSED':
                meta=self.closed_meta[order['id']]
                per_day[(order['personnel_id'],meta['date'])]+=1
                person=next(p for p in self.people if p['id']==order['personnel_id'])
                need((person['id'],order['order_type']) in self.skills and person['station_id']==order['station_id'], '技能/归属错误')
                need(order['district_code'] in {a['district_code'] for a in self.areas}, '服务区域错误')
                execution=executions[order['id']]
                need(execution['personnel_id']==order['personnel_id'] and execution['station_id']==order['station_id'], '执行人员/服务站不一致')
                need(order['create_time']<=execution['started_at']<execution['ended_at']<=order['status_changed_at'], '执行与审核时间错误')
                intervals[(person['id'],meta['date'])].append((execution['started_at'],execution['ended_at']))
                latest=submissions[order['id']][-1]
                need(reviews[order['id']][-1]['decision']=='APPROVE' and reviews[order['id']][-1]['submission_id']==latest['id'], '最新提交没有通过审核')
                need(reviews[order['id']][-1]['reviewed_at']==order['status_changed_at'], '办结时间不取审核事实')
                need([s['version_no']for s in submissions[order['id']]]==[str(i+1)for i in range(len(submissions[order['id']]))], '提交版本不连续')
                for s in submissions[order['id']]:
                    need(order['create_time']<=s['submitted_at']<=order['status_changed_at'], '完工提交时间错误')
                evaluation=evaluations.get(order['id'])
                continued=any(r['rejection_type']=='CONTINUE_SERVICE'for r in reviews[order['id']])
                derived=dict(service_count=1,on_time_count=int(execution['ended_at'][:10]<=order['expected_date_to']),
                             first_time_resolved_count=int(not continued and (not evaluation or evaluation['resolution']=='RESOLVED')),
                             rated_count=int(evaluation is not None),rating_total=int(evaluation['score'])if evaluation else 0,complaint_count=int(order['id']in complaints))
                need(all(meta[k]==v for k,v in derived.items()), '质量指标与订单原始事实不一致')
            else:
                need(order['id']not in executions and not submissions[order['id']] and not reviews[order['id']] and order['id']not in evaluations, '取消订单不能有成功履约/评价')
            registration=tables['afs_purchase_registration'][order['registration_id']]
            need(registration['customer_id']==order['customer_id'], '登记与工单顾客不一致')
            histories=[h for h in self.added['afs_order_status_history'] if h['order_id']==order['id']]
            need(histories[-1]['to_status']==order['status'] and histories[-1]['created_at']==order['status_changed_at'], '终态与历史不一致')
            need([h['created_at']for h in histories]==sorted(h['created_at']for h in histories), '流转时间不递增')
            need(all(histories[i]['from_status']==histories[i-1]['to_status'] for i in range(1,len(histories))), '状态链不连续')
        for (pid,day),count in per_day.items():
            capacity=int(next(p['daily_capacity']for p in self.people if p['id']==pid))
            used=sum(o['personnel_id']==pid and o['expected_date']==day and o['status'] not in daily.TERMINAL for o in self.before['tables']['afs_service_order'])
            need(count+used<=capacity,'人员当天工作量超出容量')
            slots=sorted(intervals[(pid,day)])
            need(all(slots[i][0]>=slots[i-1][1] for i in range(1,len(slots))), '人员执行时间重叠')
        station_events=defaultdict(list)
        active={'PENDING_ASSIGNMENT','PENDING_COMPLETION'}
        for history in self.added['afs_order_status_history']:
            order=orders[history['order_id']]
            if order['status']!='CLOSED':
                continue
            delta=int(history['to_status']in active)-int(history['from_status']in active)
            if delta:
                station_events[order['expected_date']].append((history['created_at'],delta))
        for events in station_events.values():
            concurrent=0
            for at,delta in sorted(events):
                concurrent+=delta
                need(0<=concurrent<=int(self.station.get('daily_max_orders','5')), '服务站同时在途工单超出容量')
        for scope in ['STATION','PERSONNEL','AREA']:
            facts=[r for r in self.added['afs_service_quality_daily'] if r['scope_type']==scope]
            need(sum(int(r['service_count'])for r in facts)==len(self.closed_meta),'质量事实重复/缺失')
            for metric in ['on_time_count','first_time_resolved_count','rated_count','rating_total','complaint_count']:
                need(sum(float(r[metric])for r in facts)==sum(m[metric]for m in self.closed_meta.values()),'质量事实不能回溯：'+metric)
        for e in self.added['afs_service_evaluation']:
            registration=tables['afs_purchase_registration'][orders[e['order_id']]['registration_id']]
            need(e['account_id']==registration['owner_consumer_account_id'],'评价账号不属于购买登记')
            need(orders[e['order_id']]['status_changed_at']<=e['submitted_at']<=self.now.isoformat(timespec='seconds'), '评价时间不合理')
            need(e['station_id']==orders[e['order_id']]['station_id'] and e['personnel_id']==orders[e['order_id']]['personnel_id'], '评价快照不匹配')

    def summary(self):
        orders=self.added['afs_service_order']
        return {'from':self.start.isoformat(),'to':self.now.date().isoformat(),'orders':len(orders),'statuses':dict(Counter(o['status']for o in orders)),
                'types':dict(Counter(o['order_type']for o in orders)),'sources':dict(Counter(o['source']for o in orders)),
                'months':dict(sorted(Counter(o['create_time'][:7]for o in orders).items())), 'customers':len(self.households),
                'evaluations':len(self.added['afs_service_evaluation']), 'ratings':dict(sorted(Counter(r['score']for r in self.added['afs_service_evaluation']).items())),
                'complaints':dict(Counter(r['status']for r in self.added['afs_complaint'])), 'followUps':dict(Counter(r['status']for r in self.added['afs_order_follow_up_task'])),
                'qualityFacts':len(self.added['afs_service_quality_daily']),'rows':sum(map(len,self.added.values())), 'normalizedRows':sum(map(len,self.updated.values())),
                'onTime':sum(m['on_time_count']for m in self.closed_meta.values()), 'firstTimeResolved':sum(m['first_time_resolved_count']for m in self.closed_meta.values()),
                'rejectedReviews':sum(r['decision']=='REJECT'for r in self.added['afs_completion_review'])}

    def save_plan(self, directory):
        directory=Path(directory)
        daily.save(directory/'before.json',self.before)
        after=deepcopy(self.before)
        for t in ORDER:
            after['tables'][t].extend(self.added[t])
        for t, rows in self.updated.items():
            keys=self.before['keys'][t]
            patches={tuple(r[k]for k in keys):r for r in rows}
            after['tables'][t]=[patches.get(tuple(r[k]for k in keys),r)for r in after['tables'][t]]
        for t,rows in after['tables'].items():
            keys=self.before['keys'][t]
            def sort_key(r):
                return tuple(int(r[k]) if re.fullmatch(r'-?\d+',str(r[k])) and self.columns[t][k].startswith(('bigint','int','smallint','tinyint')) else str(r[k]) for k in keys)
            rows.sort(key=sort_key)
        daily.save(directory/'expected-after.json',after)
        guard=[t for t in self.before['tables']if 'session' not in t]
        plan={'backup_sha256':hashlib.sha256((directory/'before.json').read_bytes()).hexdigest(),'guard_tables':guard,'insert_order':ORDER,
              'insert_rows':self.added,'update_rows':self.updated,'original_rows':self.originals,'summary':self.summary(),'quality_lineage':self.closed_meta,
              'cleanup_keys':{t:[{k:r[k]for k in self.before['keys'][t]}for r in rows]for t,rows in self.added.items()},'provenance':PREFIX,'id_range':[str(BASE),str(BASE+3000000)]}
        daily.save(directory/'plan.json',plan)
        return plan


def importer(directory, mode):
    jars=[]
    for artifact in ['com/mysql/mysql-connector-j','com/google/code/gson/gson']:
        found=sorted((Path.home()/'.m2/repository'/artifact).glob('*/*.jar'), reverse=True)
        need(found,'缺少项目已缓存依赖：'+artifact)
        jars.append(str(found[0]))
    classes=Path(directory)/'classes'
    classes.mkdir(exist_ok=True)
    cp=os.pathsep.join(jars)
    sources=[str(ROOT/'scripts/demo-data'/name)for name in ['ReadOnlySnapshot.java','HistoryImporter.java']]
    subprocess.run([shutil.which('javac'),'-cp',cp,'-d',str(classes),*sources],check=True,timeout=60)
    subprocess.run([shutil.which('java'),'-cp',str(classes)+os.pathsep+cp,'HistoryImporter',str(daily.WORKSPACE/'backend/gaia-saas-proj/.local/application.properties'),str(directory),mode],check=True,timeout=900)


def main():
    parser=argparse.ArgumentParser(description='固定测试库近三个月历史业务；单次导入，默认只读预览')
    modes=parser.add_mutually_exclusive_group()
    modes.add_argument('--preview',action='store_true')
    modes.add_argument('--apply',action='store_true')
    modes.add_argument('--check-run',type=Path,help='独立逐行核对已导入批次')
    modes.add_argument('--restore-run',type=Path,help='仅在导入后数据未变化时精确恢复；有并发或后续业务则拒绝')
    args=parser.parse_args()
    if args.check_run or args.restore_run:
        importer(args.check_run or args.restore_run,'check' if args.check_run else 'restore')
        return
    runtime=ROOT/'.local/demo-history'
    runtime.mkdir(exist_ok=True,mode=0o700)
    with daily.run_lock():
        before=daily.snapshot()
        now=datetime.fromisoformat(before['target']['checked_at'])
        fixture=Fixture(before,now).build()
        print(json.dumps(fixture.summary(),ensure_ascii=False,indent=2),flush=True)
        if not args.apply:
            return
        directory=runtime/now.strftime('%Y%m%d-%H%M%S')
        directory.mkdir(mode=0o700)
        fixture.save_plan(directory)
        print('备份和专用 ID 清单：'+str(directory),flush=True)
        importer(directory,'apply')
        importer(directory,'check')


if __name__=='__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print('历史造数停止：'+str(error),file=sys.stderr)
        sys.exit(1)

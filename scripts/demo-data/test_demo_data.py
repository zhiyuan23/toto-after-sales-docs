"""Isolated lifecycle tests: no MySQL connection, real login, upload, or business write."""
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('demo_data', Path(__file__).resolve().parents[1] / 'demo-data.py')
demo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demo)


class FixtureApi:
    def __init__(self, slots=5):
        self.day = '2026-10-10'
        self.available = True
        self.recommended = True
        self.calls = []
        self.records, self.orders, self.docs, self.reviews = {}, {}, {}, []
        self.quantities = {'8': 0}
        self.fail_once = None
        self.fail_after_create = False
        self.auto_approve = False
        self.tables = {
            'afs_product': [{'id': '19', 'enabled': '1'}],
            'afs_store': [{'id': '3', 'enabled': '1', 'location_province': '辽宁省', 'location_city': '沈阳市', 'location_district': '浑南区'}],
            'afs_product_channel_unit': [{'id': str(i), 'product_id': '19', 'store_id': '3', 'unique_code': f'DEMO-UNIT-{i}'} for i in range(1, slots + 1)],
            'afs_consumer_scanned_product': [], 'afs_consumer_account': [], 'afs_customer': [],
            'afs_service_station': [{'id': '5', 'enabled': '1', 'location_city': '沈阳市'}],
            'afs_service_personnel': [{'id': '1', 'enabled': '1', 'station_id': '5'}],
            'afs_personnel_availability': [{'id': '1', 'schedule_date': self.day}],
            'afs_part': [{'id': '8', 'enabled': '1'}],
            'afs_completion_audit_policy': [{'mode': 'MANUAL', 'execution_mode': 'AUTO'}]}

    def snapshot(self):
        tables = copy.deepcopy(self.tables)
        tables['afs_purchase_registration'] = [{'id': r['id'], 'status': 'ACTIVE', 'client_request_id': r['clientRequestId']}
                                               for r in self.records.values()]
        tables['afs_purchase_item'] = [{'id': r['id'], 'registration_id': r['id']} for r in self.records.values()]
        tables['afs_product_instance'] = [{'id': r['instances'][0]['id'], 'purchase_item_id': r['id'], 'unique_code': r['uniqueCode']}
                                          for r in self.records.values()]
        tables['afs_service_order'] = [{'id': r['id'], 'status': r['status'], 'registration_id': r['registrationId'],
            'client_request_id': r['clientRequestId']} for r in self.orders.values()]
        tables['afs_completion_review'] = copy.deepcopy(self.reviews)
        tables['afs_part_inventory_document'] = [{'id': d['id'], 'document_type': d['documentType'], 'status': d['status'],
            'client_request_id': d['clientRequestId'], 'create_time': d['createTime'], 'work_order_id': d['workOrderId']} for d in self.docs.values()]
        return {'target': {'db': 'gaia_wh_init_wzy', 'server': 'mysql84', 'checked_at': self.day + ' 09:00:00'}, 'tables': tables}

    def request(self, path, method='GET', body=None):
        self.calls.append((path, method, copy.deepcopy(body)))
        path = path.removeprefix('/afterSales')
        if method != 'GET' and self.fail_once == path:
            self.fail_once = None
            raise demo.ApiError('fixture timeout; no automatic retry')
        if path == '/customer/registrations' and method == 'POST':
            assert body['sourceType'] in {'OFFLINE', 'VIRTUAL', 'EXTERNAL'}
            assert len(body['purchaserMobile']) == 11 and '*' not in body['purchaserMobile']
            found = next((r for r in self.records.values() if r['clientRequestId'] == body['clientRequestId']), None)
            if found:
                return copy.deepcopy(found)
            rid = str(len(self.records) + 100)
            record = {'id': rid, 'clientRequestId': body['clientRequestId'], 'uniqueCode': body['items'][0]['uniqueCode'],
                      'mobileMasked': '199****0000', 'instances': [{'id': rid, 'status': 'AVAILABLE'}]}
            self.records[rid] = record
            if self.fail_after_create:
                self.fail_after_create = False
                raise demo.ApiError('fixture committed registration; response lost')
            return copy.deepcopy(record)
        if path.startswith('/customer/records/'):
            return copy.deepcopy(self.records[path.rsplit('/', 1)[1]])
        if path.startswith('/customer/intake/faults'):
            return [{'id': '31', 'faultName': '演示故障', 'faultSummary': '模拟排查'}]
        if path == '/customer/intake/orders':
            assert len(body['contactMobile']) == 11 and '*' not in body['contactMobile']
            assert body['createdStoreId'] is None  # Global customer service does not accept a dealer creation store.
            assert not any(r['registrationId'] == body['registrationId'] and r['status'] not in demo.TERMINAL for r in self.orders.values())
            rid = str(1000 + len(self.orders))
            row = {**body, 'id': rid, 'orderNo': 'SO-' + rid, 'status': 'PENDING_DISPATCH', 'version': 'v0',
                   'stationId': None, 'personnelId': None, 'exceptionCode': ''}
            if body['orderType'] == 'INSTALLATION':
                self.records[body['registrationId']]['instances'][0]['status'] = 'APPOINTED'
            self.orders[rid] = row
            return self.output(row)
        if path.startswith('/work-order/options/'):
            return {'recommendedStations': [{'id': '5', 'saturation': 0}] if self.recommended else [],
                    'candidates': [{'id': '1', 'available': self.available, 'skilled': True, 'conflict': False, 'assignedCount': 0}]}
        if path.startswith('/work-order/'):
            fields = path.split('/')
            row = self.orders[fields[3]]
            if method == 'GET':
                return self.output(row)
            if body['version'] != row['version']:
                raise demo.ApiError('stale version', 409)
            if path.endswith('/station'):
                row.update(stationId=body['stationId'], status='PENDING_ASSIGNMENT')
            elif path.endswith('/personnel'):
                row.update(personnelId=body['personnelId'], status='PENDING_COMPLETION')
            elif path.endswith('/completion-submissions'):
                assert row['status'] == 'PENDING_COMPLETION'
                if row['serviceMode'] != 'REMOTE':
                    assert body['photoReferences'] and body['nameplateReferences']
                else:
                    assert not body['nameplateReferences']
                row['status'] = 'CLOSED' if self.auto_approve else 'PENDING_REVIEW'
            elif fields[2] == 'completion-reviews':
                assert row['status'] == 'PENDING_REVIEW'
                row['status'] = 'CLOSED' if body['decision'] == 'APPROVE' else 'PENDING_COMPLETION'
                self.reviews.append({'order_id': row['id'], 'decision': body['decision']})
            elif fields[2] == 'exceptions':
                if body['action'] == 'CANCEL':
                    row['status'] = 'CANCELLED'
                else:
                    row['exceptionCode'] = '' if body['action'] == 'REOPEN' else body['action']
            else:
                raise AssertionError(path)
            row['version'] = 'v' + str(int(row['version'][1:]) + 1)
            return self.output(row)
        if path.startswith('/inventory/stock'):
            return {'records': len(self.quantities), 'rows': [{'partId': p, 'quantity': q} for p, q in self.quantities.items()]}
        if path.startswith('/inventory/'):
            fields = path.split('/')
            resource = fields[2]
            if len(fields) == 3:
                document = {'id': str(2000 + len(self.docs)), 'documentType': 'INBOUND' if resource == 'inbounds' else 'REQUISITION',
                            'status': 'PENDING' if resource == 'inbounds' else 'PROCESSING', 'version': 'v0',
                            'createTime': self.day + 'T09:00:00', **body}
                self.docs[document['id']] = document
                return copy.deepcopy(document)
            row = self.docs[fields[3]]
            if method == 'GET':
                return copy.deepcopy(row)
            assert body['version'] == row['version']
            for line in row['lines']:
                self.quantities[line['partId']] += line['quantity'] if resource == 'inbounds' else -line['quantity']
            row.update(status='COMPLETED', version='v1')
            return copy.deepcopy(row)
        raise AssertionError((path, method))

    def output(self, row):
        actions = {'PENDING_DISPATCH': ['assignStation'], 'PENDING_ASSIGNMENT': ['dispatch'],
                   'PENDING_COMPLETION': ['submitCompletion'], 'PENDING_REVIEW': ['review']}.get(row['status'], [])
        return {**copy.deepcopy(row), 'actions': actions}

    def run(self):
        report = {'actions': [], 'skipped': []}
        demo.simulate(self, self.snapshot(), 8, self.day, lambda: '/api/sys/commontools/picture?id=1', report)
        return report


class SimulatorTests(unittest.TestCase):
    def test_first_run_has_distinct_actionable_queues_and_real_inventory_movements(self):
        api = FixtureApi()
        api.run()
        self.assertEqual(len(api.records), 5)
        self.assertEqual(len(api.orders), 5)
        self.assertEqual(sorted(r['status'] for r in api.orders.values()),
                         ['PENDING_ASSIGNMENT', 'PENDING_COMPLETION', 'PENDING_COMPLETION', 'PENDING_DISPATCH', 'PENDING_REVIEW'])
        self.assertEqual(api.quantities['8'], 20)
        self.assertTrue(any(d['status'] == 'PROCESSING' for d in api.docs.values()))

    def test_same_day_repeat_does_not_duplicate_orders_submissions_or_requisitions(self):
        api = FixtureApi()
        api.run()
        before = api.snapshot()
        report = api.run()
        self.assertEqual(before, api.snapshot())
        self.assertEqual(report['actions'], [])

    def test_user_completed_tasks_are_refilled_on_same_day(self):
        api = FixtureApi()
        api.run()
        for row in api.orders.values():
            row['status'] = 'CLOSED'
        api.run()
        self.assertEqual(len(api.orders), 10)
        self.assertEqual(len(api.records), 5)
        self.assertEqual(sum(r['status'] == 'CLOSED' for r in api.orders.values()), 5)
        self.assertEqual(len({r['clientRequestId'] for r in api.orders.values()}), 10)

    def test_next_day_retires_old_orders_preserves_history_and_restocks_queues(self):
        api = FixtureApi()
        api.run()
        before = api.snapshot()
        old_ids = set(api.orders)
        requisition = next(d for d in api.docs.values() if d['documentType'] == 'REQUISITION')
        repair = next(r for r in api.orders.values() if r['orderNo'] == requisition['workOrderId'])
        api.calls.clear()
        api.day = '2026-10-11'
        api.run()
        self.assertTrue(all(api.orders[i]['status'] == 'CLOSED' for i in old_ids))
        self.assertEqual(len(api.orders), 10)
        self.assertEqual(len(api.records), 5)
        demo.verify_preserved(before, api.snapshot())
        self.assertTrue(all(r['expectedDate'] == '2026-10-10' for i, r in api.orders.items() if i in old_ids))
        paths = [path for path, method, body in api.calls if method != 'GET']
        self.assertLess(paths.index('/afterSales/inventory/requisitions/' + requisition['id'] + '/actions'),
                        paths.index('/afterSales/work-order/dispatch/' + repair['id'] + '/completion-submissions'))

    def test_no_eligible_personnel_preserves_new_pending_assignment_and_cancels_old_booking(self):
        api = FixtureApi(slots=3)
        api.available = False
        api.run()
        self.assertFalse(any(r['personnelId'] for r in api.orders.values()))
        api.day = '2026-10-11'
        api.run()
        self.assertEqual(sum(r['status'] == 'CANCELLED' for r in api.orders.values()), 3)
        self.assertEqual(len(api.orders), 6)

    def test_no_eligible_service_area_does_not_force_station_assignment(self):
        api = FixtureApi(slots=3)
        api.recommended = False
        report = api.run()
        self.assertTrue(all(r['status'] == 'PENDING_DISPATCH' for r in api.orders.values()))
        self.assertTrue(report['skipped'])

    def test_auto_audit_result_is_kept(self):
        api = FixtureApi(slots=3)
        api.auto_approve = True
        api.run()
        self.assertEqual(sum(r['status'] == 'CLOSED' for r in api.orders.values()), 2)
        self.assertEqual(api.reviews, [])

    def test_interrupted_run_resumes_without_duplicate_purchase_or_order(self):
        api = FixtureApi(slots=3)
        api.fail_once = '/work-order/dispatch/1001/personnel'
        with self.assertRaises(demo.ApiError):
            api.run()
        api.run()
        self.assertEqual(len(api.orders), 3)
        self.assertEqual(len(api.records), 3)
        self.assertEqual(len({r['clientRequestId'] for r in api.orders.values()}), 3)

    def test_lost_registration_receipt_is_recovered_from_database_ownership(self):
        api = FixtureApi(slots=3)
        api.fail_after_create = True
        with self.assertRaises(demo.ApiError):
            api.run()
        self.assertEqual(len(api.records), 1)
        api.run()
        self.assertEqual(len(api.records), 3)
        self.assertEqual(len(api.orders), 3)

    def test_run_lock_rejects_parallel_apply(self):
        previous = demo.RUNTIME
        with tempfile.TemporaryDirectory() as directory:
            demo.RUNTIME = Path(directory) / 'runtime'
            try:
                with demo.run_lock():
                    with self.assertRaisesRegex(RuntimeError, '正在执行'):
                        with demo.run_lock():
                            self.fail('second lock should be rejected')
            finally:
                demo.RUNTIME = previous

    def test_preview_describes_changes_without_api_operations(self):
        api = FixtureApi()
        before = api.snapshot()
        result = demo.plan(before, 8, api.day)
        self.assertEqual(result['可用演示商品'], 5)
        self.assertEqual(result['需要新增购买登记'], 5)
        self.assertFalse(result['清理现有测试单据'])
        self.assertEqual(api.snapshot(), before)
        self.assertEqual(api.calls, [])

    def test_existing_consumer_binding_and_unowned_purchase_are_excluded(self):
        api = FixtureApi()
        api.tables['afs_consumer_scanned_product'] = [{'channel_unit_id': '1', 'status': 'ACTIVE'}]
        api.run()
        next(iter(api.records.values()))['clientRequestId'] = 'MANUAL-REGISTRATION'
        slots = demo.registrations(api.snapshot())
        self.assertNotIn('1', {s['unit']['id'] for s in slots})
        self.assertEqual(len(slots), 3)

    def test_manual_order_on_demo_purchase_is_not_advanced(self):
        api = FixtureApi(slots=3)
        api.run()
        manual = next(iter(api.orders.values()))
        manual['clientRequestId'] = 'USER-MANUAL'
        before = copy.deepcopy(manual)
        api.day = '2026-10-11'
        api.run()
        self.assertEqual(api.orders[manual['id']], before)

    def test_protected_changes_and_unrelated_transaction_changes_are_detected(self):
        api = FixtureApi()
        before = api.snapshot()
        after = copy.deepcopy(before)
        after['tables']['afs_product'][0]['enabled'] = '0'
        with self.assertRaisesRegex(RuntimeError, '基础资料'):
            demo.verify_preserved(before, after)
        before['tables']['afs_service_order'] = [{'id': '999', 'status': 'CLOSED', 'client_request_id': 'MANUAL'}]
        after = copy.deepcopy(before)
        after['tables']['afs_service_order'][0]['status'] = 'CANCELLED'
        with self.assertRaisesRegex(RuntimeError, '非演示数据'):
            demo.verify_preserved(before, after)

    def test_prefix_near_match_does_not_grant_script_ownership(self):
        self.assertFalse(demo.owned({'client_request_id': 'TOTO-DEMO-V1-manual'}))
        self.assertFalse(demo.owned({'client_request_id': 'TOTO-DEMO-V1-O-20261010-x-1'}))
        self.assertTrue(demo.owned({'client_request_id': 'TOTO-DEMO-V1-O-20261010-123-1'}))


if __name__ == '__main__':
    unittest.main()

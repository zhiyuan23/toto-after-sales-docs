"""Portable historical-generator checks; schema only, fictional identities, no database access."""
from copy import deepcopy
from datetime import date, datetime, timedelta
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('history',Path(__file__).resolve().parents[1]/'demo-history.py')
h=importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)


class HistoryTests(unittest.TestCase):
    def fixture(self, before=None):
        before=before or json.loads(Path(__file__).with_name('history-test-fixture.json').read_text())
        with patch.object(Path,'read_text',return_value='{"reference":"/api/sys/commontools/picture?id=999"}'):
            f=h.Fixture(before,datetime(2026,10,10,18))
        f.start=date(2026,10,5)
        return f

    def test_calendar_month_window_crosses_year_and_month_end(self):
        self.assertEqual(h.window(date(2026,10,10)),date(2026,7,11))
        self.assertEqual(h.window(date(2026,1,31)),date(2025,11,1))
        self.assertEqual(h.window(date(2026,5,31)),date(2026,3,1))

    def test_fixture_does_not_modify_master_rows_and_uses_active_policy_pointer(self):
        f=self.fixture(); baseline=deepcopy(f.before);f.build()
        self.assertEqual(f.before,baseline)
        self.assertTrue(all(r['policy_version_id']=='1'for r in f.added['afs_order_fee']))
        self.assertTrue(all(r['enabled']=='0'for r in f.added['afs_consumer_account']))
        self.assertTrue(all(r['unique_code'] is None for r in f.added['afs_product_instance']))

    def test_owned_evaluations_and_quality_can_be_traced_to_orders(self):
        f=self.fixture().build();f.validate()
        f.added['afs_service_evaluation'][0]['account_id']='2'
        with self.assertRaisesRegex(RuntimeError,'评价账号'):
            f.validate()

    def test_corrupt_quality_and_status_chain_are_rejected(self):
        f=self.fixture().build()
        fact=f.added['afs_service_quality_daily'][0];old=fact['service_count'];fact['service_count']='999'
        with self.assertRaisesRegex(RuntimeError,'质量事实'):
            f.validate()
        fact['service_count']=old
        f.added['afs_order_status_history'][0]['to_status']='CLOSED'
        with self.assertRaisesRegex(RuntimeError,'状态链'):
            f.validate()

    def test_leave_and_restricted_published_skills_are_observed(self):
        f=self.fixture()
        f.availability[('5','2026-10-06')]={'availability':'LEAVE','day_type':'REST','service_items':''}
        f.availability[('8','2026-10-07')]={'availability':'AVAILABLE','day_type':'WORK','service_items':'REPAIR'}
        f.build()
        orders={o['id']:o for o in f.added['afs_service_order']}
        executions=f.added['afs_service_execution']
        self.assertFalse(any(e['personnel_id']=='5' and e['started_at'].startswith('2026-10-06')for e in executions))
        self.assertTrue(all(orders[e['order_id']]['order_type']=='REPAIR' for e in executions if e['personnel_id']=='8' and e['started_at'].startswith('2026-10-07')))

    def test_batch_replay_and_primary_key_collisions_are_rejected(self):
        f=self.fixture()
        f.before['tables']['afs_service_order']=[{'client_request_id':h.PREFIX+'O-1'}]
        with self.assertRaisesRegex(RuntimeError,'历史批次已存在'):
            self.fixture(f.before)
        f=self.fixture().build();f.before['tables']['afs_customer'].append(deepcopy(f.added['afs_customer'][0]))
        with self.assertRaisesRegex(RuntimeError,'主键冲突'):
            f.validate()

    def test_future_service_timestamp_and_overlapping_execution_are_rejected(self):
        f=self.fixture().build()
        f.added['afs_service_order'][0]['status_changed_at']='2027-01-01T12:00'
        with self.assertRaisesRegex(RuntimeError,'未来状态'):
            f.validate()
        f=self.fixture();f.people[0]['daily_capacity']='3';f.build()
        first=f.added['afs_service_execution'][0]
        second=next(e for e in f.added['afs_service_execution'][1:] if e['personnel_id']==first['personnel_id'] and e['started_at'][:10]==first['started_at'][:10])
        second['started_at']=h.stamp(datetime.fromisoformat(first['started_at'])+timedelta(minutes=5))
        with self.assertRaisesRegex(RuntimeError,'执行时间重叠'):
            f.validate()
        f=self.fixture().build()
        f.station['daily_max_orders']='0'
        with self.assertRaisesRegex(RuntimeError,'服务站同时在途'):
            f.validate()

    def test_jdbc_datetime_zero_seconds_roundtrip(self):
        self.assertEqual(h.stamp(datetime(2026,10,10,9,30)), '2026-10-10T09:30')
        self.assertEqual(h.stamp(datetime(2026,10,10,9,30,7)), '2026-10-10T09:30:07')


if __name__=='__main__':
    unittest.main()

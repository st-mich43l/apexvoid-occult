import unittest
from unittest.mock import AsyncMock, patch
import asyncio
from app.store import record_observation, record_event, _hash_chart
from app.schemas import ChartDTO

class TestStore(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.mock_db = AsyncMock()
        self.mock_db.observations.update_one = AsyncMock()
        self.mock_db.reported_events.update_one = AsyncMock()
        
        self.chart = ChartDTO(
            birthDayStem="Giáp",
            birthDayBranch="Tý",
            birthMonthStem="Ất",
            birthMonthBranch="Sửu",
            birthHourStem="Bính",
            birthHourBranch="Dần",
            yearStem="Đinh",
            yearBranch="Mão"
        )
        self.chart_hash = _hash_chart(self.chart)

    @patch("app.store.get_db")
    async def test_record_observation_success(self, mock_get_db):
        mock_get_db.return_value = self.mock_db
        await record_observation(self.chart, 2025, "Tài Bạch", ["loc_phung_xung_pha"])
        self.mock_db.observations.update_one.assert_called_once()
        args, kwargs = self.mock_db.observations.update_one.call_args
        self.assertEqual(args[0], {"chartHash": self.chart_hash, "year": 2025, "palace": "Tài Bạch"})
        self.assertTrue(kwargs["upsert"])

    @patch("app.store.get_db")
    async def test_record_observation_health_excluded(self, mock_get_db):
        mock_get_db.return_value = self.mock_db
        await record_observation(self.chart, 2025, "Tật Ách", ["cach_cuc"])
        self.mock_db.observations.update_one.assert_not_called()

    @patch("app.store.get_db")
    async def test_record_event_success(self, mock_get_db):
        mock_get_db.return_value = self.mock_db
        await record_event(self.chart, 2025, "Tài Bạch", "negative", "wealth", "mất tiền")
        self.mock_db.reported_events.update_one.assert_called_once()
        args, kwargs = self.mock_db.reported_events.update_one.call_args
        self.assertEqual(args[0], {"chartHash": self.chart_hash, "year": 2025, "palace": "Tài Bạch", "domain": "wealth"})
        self.assertEqual(args[1]["$setOnInsert"]["valence"], "negative")
        self.assertTrue(kwargs["upsert"])

    @patch("app.store.get_db")
    async def test_record_event_health_excluded(self, mock_get_db):
        mock_get_db.return_value = self.mock_db
        await record_event(self.chart, 2025, "Tật Ách", "negative", "health", "tai nạn")
        self.mock_db.reported_events.update_one.assert_not_called()
        
    @patch("app.store.get_db")
    async def test_record_event_health_domain_excluded(self, mock_get_db):
        mock_get_db.return_value = self.mock_db
        await record_event(self.chart, 2025, "Mệnh", "negative", "health", "ốm đau")
        self.mock_db.reported_events.update_one.assert_not_called()

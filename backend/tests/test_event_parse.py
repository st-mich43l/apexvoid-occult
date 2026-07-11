import unittest
from app.event_parse import parse_event

class TestEventParse(unittest.TestCase):

    def test_wealth_negative_year_explicit(self):
        q = "năm 2025 tôi bị phá sản"
        res = parse_event(q, 2026)
        self.assertIsNotNone(res)
        self.assertEqual(res["year"], 2025)
        self.assertEqual(res["domain"], "wealth")
        self.assertEqual(res["palace"], "Tài Bạch")
        self.assertEqual(res["valence"], "negative")

    def test_love_positive_year_relative(self):
        q = "năm ngoái tôi cưới vợ"
        res = parse_event(q, 2026)
        self.assertIsNotNone(res)
        self.assertEqual(res["year"], 2025)
        self.assertEqual(res["domain"], "love")
        self.assertEqual(res["palace"], "Phu Thê")
        self.assertEqual(res["valence"], "positive")

    def test_career_positive_year_relative(self):
        q = "năm vừa rồi được thăng chức"
        res = parse_event(q, 2026)
        self.assertIsNotNone(res)
        self.assertEqual(res["year"], 2025)
        self.assertEqual(res["domain"], "career")
        self.assertEqual(res["palace"], "Quan Lộc")
        self.assertEqual(res["valence"], "positive")

    def test_health_exclusion(self):
        q = "năm 2024 tôi bị mổ xẻ tai nạn"
        res = parse_event(q, 2026)
        self.assertIsNone(res)

    def test_missing_year(self):
        q = "tôi bị phá sản"
        res = parse_event(q, 2026)
        self.assertIsNone(res)

    def test_missing_valence(self):
        q = "năm 2025 chuyện tiền bạc thế nào"
        res = parse_event(q, 2026)
        self.assertIsNone(res)

    def test_missing_domain(self):
        q = "năm ngoái buồn quá"
        res = parse_event(q, 2026)
        self.assertIsNone(res)

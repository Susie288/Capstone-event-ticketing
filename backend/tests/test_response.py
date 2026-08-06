import json
import unittest

from shared.response import success


class ResponseTests(unittest.TestCase):
    def test_success_response_is_api_gateway_compatible(self):
        response = success({"ok": True})
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(json.loads(response["body"]), {"ok": True})


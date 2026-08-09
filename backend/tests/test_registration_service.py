import unittest
from unittest.mock import MagicMock

try:
    from services.registration_service import RegistrationService, EventNotFoundError
    HAS_BOTO3 = True
except ModuleNotFoundError:
    HAS_BOTO3 = False

class RegistrationServiceTests(unittest.TestCase):
    def test_register_publishes_to_sns_topic(self):
        if not HAS_BOTO3:
            self.skipTest("boto3 not installed locally (Lambda runtime dependency)")
        mock_events = MagicMock()
        mock_events.get_event.return_value = {"id": "evt-1", "name": "Tech Conference 2026"}
        mock_regs = MagicMock()
        mock_sns = MagicMock()

        service = RegistrationService(
            event_repository=mock_events,
            registration_repository=mock_regs,
            sns_client=mock_sns,
        )
        service.topic_arn = "arn:aws:sns:us-east-1:123456789012:test-topic"

        res = service.register({
            "event_id": "evt-1",
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "0241234567",
        })

        self.assertEqual(res["status"], "CONFIRMED")
        mock_sns.publish.assert_called_once()
        _, kwargs = mock_sns.publish.call_args
        self.assertEqual(kwargs["TopicArn"], "arn:aws:sns:us-east-1:123456789012:test-topic")
        self.assertIn("Tech Conference 2026", kwargs["Subject"])

    def test_register_raises_event_not_found(self):
        if not HAS_BOTO3:
            self.skipTest("boto3 not installed locally (Lambda runtime dependency)")
        mock_events = MagicMock()
        mock_events.get_event.return_value = None

        service = RegistrationService(event_repository=mock_events)
        with self.assertRaises(EventNotFoundError):
            service.register({"event_id": "invalid", "full_name": "John", "email": "john@example.com", "phone": "0241234567"})

if __name__ == "__main__":
    unittest.main()

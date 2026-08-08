import unittest
from unittest.mock import MagicMock
try:
    from botocore.exceptions import ClientError
    from repositories.registration_repository import RegistrationRepository, RegistrationNotFoundError
    HAS_BOTO3 = True
except ModuleNotFoundError:
    HAS_BOTO3 = False


class RegistrationRepositoryCancelTests(unittest.TestCase):
    def test_cancel_raises_registration_not_found_on_condition_check_failed(self):
        if not HAS_BOTO3:
            self.skipTest("boto3 not installed locally")
        mock_client = MagicMock()
        exc_response = {
            "Error": {"Code": "TransactionCanceledException"},
            "CancellationReasons": [{"Code": "ConditionalCheckFailed"}, {"Code": "None"}]
        }
        mock_client.transact_write_items.side_effect = ClientError(exc_response, "TransactWriteItems")

        repo = RegistrationRepository(table=MagicMock(), client=mock_client)
        with self.assertRaises(RegistrationNotFoundError):
            repo.cancel({"event_id": "evt-1", "email": "test@example.com", "status": "CONFIRMED"})

    def test_cancel_re_raises_other_client_errors(self):
        if not HAS_BOTO3:
            self.skipTest("boto3 not installed locally")
        mock_client = MagicMock()
        exc_response = {
            "Error": {"Code": "ProvisionedThroughputExceededException"},
            "CancellationReasons": []
        }
        mock_client.transact_write_items.side_effect = ClientError(exc_response, "TransactWriteItems")

        repo = RegistrationRepository(table=MagicMock(), client=mock_client)
        with self.assertRaises(ClientError):
            repo.cancel({"event_id": "evt-1", "email": "test@example.com", "status": "CONFIRMED"})


if __name__ == "__main__":
    unittest.main()

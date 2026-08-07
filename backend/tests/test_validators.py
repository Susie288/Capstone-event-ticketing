import unittest

from shared.validators import ValidationError, validate_registration


class RegistrationValidationTests(unittest.TestCase):
    def test_normalizes_valid_registration(self):
        data = validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ADA@EXAMPLE.COM"})
        self.assertEqual(data["email"], "ada@example.com")

    def test_rejects_invalid_email(self):
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "invalid"})


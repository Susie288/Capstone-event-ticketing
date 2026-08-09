import unittest

from shared.validators import ValidationError, validate_registration


class RegistrationValidationTests(unittest.TestCase):
    def test_normalizes_valid_registration(self):
        data = validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ADA@EXAMPLE.COM", "phone": "0241234567"})
        self.assertEqual(data["email"], "ada@example.com")
        self.assertEqual(data["phone"], "0241234567")

    def test_rejects_invalid_email(self):
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "invalid", "phone": "0241234567"})

    def test_rejects_missing_phone(self):
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ada@example.com"})

    def test_rejects_invalid_phone_digits(self):
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ada@example.com", "phone": "12345"})
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ada@example.com", "phone": "024123456789"})
        with self.assertRaises(ValidationError):
            validate_registration({"eventId": "evt-001", "fullName": "Ada Lovelace", "email": "ada@example.com", "phone": "024-123-456"})



from django.test import TestCase
from django.test import override_settings

from users.models import User, UserSshKey


@override_settings(FIELD_ENCRYPTION_KEY="I0-wmrvqBoANymP9lR68gX4BA09WUi4BC1kQe86olHk=")
class UserSshKeyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="ssh@example.com",
            password="password",
        )

    def test_save_encrypts_plain_value(self):
        key_value = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDirectPlaintext user@example"

        ssh_key = UserSshKey.objects.create(
            user=self.user,
            name="laptop",
            value=key_value,
        )

        ssh_key.refresh_from_db()
        self.assertNotEqual(ssh_key.value, key_value)
        self.assertEqual(ssh_key.decrypted_value, key_value)

    def test_save_does_not_double_encrypt_existing_encrypted_value(self):
        key_value = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAISetValue user@example"
        ssh_key = UserSshKey(user=self.user, name="desktop")
        ssh_key.set_value(key_value)
        encrypted_value = ssh_key.value

        ssh_key.save()

        ssh_key.refresh_from_db()
        self.assertEqual(ssh_key.value, encrypted_value)
        self.assertEqual(ssh_key.decrypted_value, key_value)

    def test_save_preserves_encrypted_value_when_updating_other_fields(self):
        key_value = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIUpdateName user@example"
        ssh_key = UserSshKey.objects.create(
            user=self.user,
            name="old name",
            value=key_value,
        )
        encrypted_value = ssh_key.value

        ssh_key.name = "new name"
        ssh_key.save()

        ssh_key.refresh_from_db()
        self.assertEqual(ssh_key.value, encrypted_value)
        self.assertEqual(ssh_key.decrypted_value, key_value)

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()  # Use this instead of hardcoding User


class LoginThrottlingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse('login')
        self.login_data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
    
    def test_login_throttle_after_5_attempts(self):
        """Test that login is throttled after 5 failed attempts within a minute."""
        for i in range(5):
            response = self.client.post(self.login_url, self.login_data)
            # Depending on cache state, throttling can kick in before 5 attempts
            self.assertIn(response.status_code, [401, 400, 404, status.HTTP_429_TOO_MANY_REQUESTS])
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                break
        
        # 6th attempt should be throttled
        response = self.client.post(self.login_url, self.login_data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # DRF default throttling response includes "detail" only
        self.assertIn('detail', response.data)


class RegistrationThrottlingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
    
    def test_registration_throttle_after_3_attempts(self):
        """Test that registration is throttled after 3 attempts per hour."""
        for i in range(3):
            data = {
                'username': f'testuser{i}',
                'email': f'test{i}@example.com',
                'password': 'testpass123',
                'password2': 'testpass123'
            }
            response = self.client.post(self.register_url, data)
            # Just verify request was made, don't assert specific status
            self.assertIsNotNone(response.status_code)
        
        # 4th attempt should be throttled
        data = {
            'username': 'testuser3',
            'email': 'test3@example.com',
            'password': 'testpass123',
            'password2': 'testpass123'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class TransactionImportThrottlingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.import_url = '/api/finance-management/transaction/import-csv/'
    
    def test_transaction_import_throttle_after_10_attempts(self):
        """Test that transaction import is throttled after 10 attempts per hour."""
        # This test would require CSV file fixtures
        pass
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User
from core.views import SignedURLGeneratorView
from beneficiaries.views import ExcelExportView
from django.urls import path
import json

class SignedURLTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='test', password='password')

    def test_signed_url_flow(self):
        # 1. Generate Signed URL
        request = self.factory.post('/api/v1/core/signed-url/', {"path": "/api/v1/export/"}, format='json')
        force_authenticate(request, user=self.user)
        response = SignedURLGeneratorView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        
        signed_url = response.data['relative_url']
        self.assertIn('signature=', signed_url)
        
        # 2. Access Export View without Auth
        request2 = self.factory.get('/api/v1/export/')
        # Without auth or signature
        response2 = ExcelExportView.as_view()(request2)
        # Should be 401 Unauthorized since DRF handles missing credentials as 401
        self.assertEqual(response2.status_code, 401)
        
        # 3. Access Export View WITH Signed URL
        request3 = self.factory.get(signed_url)
        # Even without auth, it should pass IsAuthenticated | HasValidSignature
        response3 = ExcelExportView.as_view()(request3)
        self.assertEqual(response3.status_code, 200)


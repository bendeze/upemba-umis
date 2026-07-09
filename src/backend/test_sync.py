import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'umis_backend.settings')
django.setup()

from django.core.handlers.asgi import ASGIHandler
from asgiref.testing import ApplicationCommunicator

async def test():
    handler = ASGIHandler()
    scope = {
        'type': 'http',
        'http_version': '1.1',
        'method': 'GET',
        'path': '/',
        'raw_path': b'/',
        'query_string': b'',
        'headers': [[b'host', b'127.0.0.1:8001']],
    }
    communicator = ApplicationCommunicator(handler, scope)
    await communicator.send_input({'type': 'http.request'})
    response_start = await communicator.receive_output()
    print("START:", response_start)
    if response_start['type'] == 'http.response.start':
        response_body = await communicator.receive_output()
        print("BODY:", response_body)

import asyncio
asyncio.run(test())

# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# 1. Gather all templates and static assets
datas = [
    ('core/templates', 'core/templates'),
    ('core/static', 'core/static'),
]

# 2. Gather default Django & DRF system static templates and translations
datas += collect_data_files('django')
datas += collect_data_files('rest_framework')

# 3. Add hidden imports that Django uses dynamically
hiddenimports = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'beneficiaries',
    'core',
    'umis_backend',
    'django.db.backends.sqlite3.base',
    'uvicorn',
    'openpyxl',
    'waitress',
]

hiddenimports += collect_submodules('django.contrib')
hiddenimports += collect_submodules('rest_framework')

a = Analysis(
    ['cli.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='UMIS',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True, # Set to True to see terminal startup logs, False to hide terminal window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='core/static/favicon.ico', # Embeds medical system icon on the EXE file!
)

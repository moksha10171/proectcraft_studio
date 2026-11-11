# syntax=docker/dockerfile:1
FROM python:3.12-slim AS runtime
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY examples ./examples
COPY data/projects ./data/projects
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM runtime AS full
ARG TARGETARCH
RUN python - <<'PY'
import hashlib, io, os, pathlib, platform, tarfile, urllib.request
architecture = {'x86_64': 'amd64', 'aarch64': 'arm64'}.get(platform.machine())
assets = {
    'amd64': ('Linux_64bit', '28a8e119c498a25607821c36cb2dc49e8463941b261a0d99091baa7bc692dd2b'),
    'arm64': ('Linux_ARM64', '1e69e077479f300614d4551334e0a33f08ee40b04315d83b8e7e0e94f0d0ee62'),
}
if architecture not in assets:
    raise RuntimeError('Bundled compiler image supports amd64/arm64; use the runtime target with your own toolchain for another architecture.')
asset, expected = assets[architecture]
url = f'https://github.com/arduino/arduino-cli/releases/download/v1.5.1/arduino-cli_1.5.1_{asset}.tar.gz'
data = urllib.request.urlopen(url, timeout=120).read()
if hashlib.sha256(data).hexdigest() != expected:
    raise RuntimeError('Arduino CLI checksum mismatch')
with tarfile.open(fileobj=io.BytesIO(data)) as archive:
    pathlib.Path('/usr/local/bin/arduino-cli').write_bytes(archive.extractfile('arduino-cli').read())
    license_dir = pathlib.Path('/usr/share/licenses/arduino-cli')
    license_dir.mkdir(parents=True)
    (license_dir / 'LICENSE.txt').write_bytes(archive.extractfile('LICENSE.txt').read())
    (license_dir / 'SOURCE').write_text('Arduino CLI 1.5.1: https://github.com/arduino/arduino-cli/tree/v1.5.1\n')
os.chmod('/usr/local/bin/arduino-cli', 0o755)
PY
RUN arduino-cli core update-index && arduino-cli core install arduino:avr@1.8.8

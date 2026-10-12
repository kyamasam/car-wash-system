# Smart Apply Backend

Django backend for the Smart Apply application with Celery task queue and WebSocket support.

## 📋 Prerequisites

- Python 3.12+
- Redis (for Celery broker)
- UV package manager

## 🚀 Quick Start

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd backend
```

### 2. Create virtual environment
```sh
uv venv
```

### 3. Activate virtual environment
```sh
source .venv/bin/activate
```

### 4. Install dependencies
```sh
uv sync
```

### 5. Set up environment variables
```sh
cp env.example .env
# Edit .env with your configuration
```

### 6. Run database migrations
```sh
uv run python manage.py migrate
```

### 7. Start Redis (if not running)
```sh
redis-server
```

### 8. Run the application (two terminals)

**Terminal 1 - Django Server (ASGI)**
```sh
uv run daphne -p 8000 backend.asgi:application
```

**Terminal 2 - Celery Worker**
```sh
uv run celery -A backend worker -l info
```

**Run celery beat schedule**

```sh
cd backend
uv run celery -A backend beat -l info
```


**Run Flower to monitor bg tasks**
```sh
celery -A backend flower
```

Your application will be available at `http://localhost:8000`

---

## 📦 Additional Commands

### Create superuser
```sh
uv run python manage.py createsuperuser
```

### Make migrations
```sh
uv run python manage.py makemigrations
```

### Seed proxmox defaults

Create and validate Proxmox cloud image templates using
[`PROXMOX_TEMPLATES.md`](./PROXMOX_TEMPLATES.md) before seeding them here.

```sh
uv run python manage.py init_proxmox \
  --os-slug ubuntu_24_04 \
  --template-id 9000 \
  --template-name "Ubuntu 24.04 Template" \
  --node pve \
  --boot-disk scsi0 \
  --storage local-lvm

```
---

## 🏗️ Project Structure

```
backend/
├── backend/              # Project settings
│   ├── settings.py       # Django settings
│   ├── celery.py         # Celery configuration
│   └── asgi.py           # ASGI config for WebSockets
├── career_profile/       # Main app
│   ├── models/           # Database models
│   ├── tasks/            # Celery tasks
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions
│   └── consumers.py      # WebSocket consumers
├── users/                # User authentication app
├── media/                # Uploaded files
└── manage.py
```

---

## 🔧 Configuration

### Environment Variables (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
```

### Celery Settings
- Broker: Redis
- Task rate limiting enabled (12 tasks/minute for AI parsing)
- Task retries configured with exponential backoff

### WebSocket Support
- Django Channels with Redis channel layer
- Real-time status updates for resume processing
- Endpoint: `ws://localhost:8000/ws/resume/<resume_id>/`

---


---

### Import TLDs

Imports TLDs from `backend/tlds.csv` into the `TLD` model.  
A `Provider` record with the matching `name` (e.g. `CLOUDFLARE`) must exist before running this.

```sh
uv run python manage.py import_tlds
```

Use a custom CSV path:

```sh
uv run python manage.py import_tlds --csv /path/to/tlds.csv
```

Wipe existing TLDs and reimport from scratch:

```sh
uv run python manage.py import_tlds --clear
```

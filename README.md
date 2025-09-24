# Redis Docker Setup

Self-hosted Redis instance with persistent storage and optional web management interface.

## Features

- **Redis 7.x** with Alpine Linux for minimal footprint
- **Persistent data storage** using Docker volumes
- **Environment-based configuration** for security
- **Health checks** for monitoring
- **Redis Commander** web UI for database management
- **Production-ready configuration** with optimized settings

## Prerequisites

### System Requirements

- Docker and Docker Compose
- At least 1GB RAM recommended
- Storage space for persistent data

### Required System Configuration

**Important:** Redis requires memory overcommit to be enabled for optimal performance and to prevent background save failures.

```bash
# Apply the required kernel parameter
echo 'vm.overcommit_memory = 1' | sudo tee -a /etc/sysctl.conf

# Apply immediately without reboot
sudo sysctl -p
```

This setting affects the entire system but is recommended by Redis developers and is standard on most cloud platforms.

## Quick Start

1. **Clone or download the files:**

   ```bash
   # Ensure you have these files:
   # - docker-compose.yml
   # - redis.conf
   # - .env.example
   ```

2. **Create your environment file:**

   ```bash
   cp .env.example .env
   ```

3. **Edit your `.env` file:**

   ```bash
   # Set a secure password
   REDIS_PASSWORD=your_super_secure_password_here
   REDIS_PORT=6379
   REDIS_COMMANDER_PORT=8081
   ```

4. **Start Redis:**

   ```bash
   docker-compose up -d
   ```

5. **Verify it's running:**

   ```bash
   # Check container status
   docker-compose ps

   # Test Redis connection
   docker-compose exec redis redis-cli -a your_password ping
   # Should return: PONG
   ```

## Configuration

### Environment Variables (.env)

| Variable               | Default  | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `REDIS_PASSWORD`       | _(none)_ | **Required.** Redis authentication password |
| `REDIS_PORT`           | `6379`   | External port for Redis                     |
| `REDIS_COMMANDER_PORT` | `8081`   | Port for Redis Commander web UI             |

### Redis Configuration (redis.conf)

Key settings in the included `redis.conf`:

- **Persistence:** RDB snapshots + AOF for data safety
- **Memory:** 256MB limit with LRU eviction
- **Security:** Protected mode enabled
- **Performance:** Optimized for typical workloads

## Usage

### Command Line Access

```bash
# Connect with password
redis-cli -h localhost -p 6379 -a your_password

# Connect without password (if not set)
redis-cli -h localhost -p 6379

# Run commands from host
docker-compose exec redis redis-cli -a your_password set mykey "hello world"
docker-compose exec redis redis-cli -a your_password get mykey
```

### Web Interface

Access Redis Commander at: `http://localhost:8081`

- Browse databases and keys
- Execute Redis commands
- Monitor performance metrics
- View configuration

### Application Connection

**Connection String Format:**

```
redis://password@localhost:6379
```

**Node.js Example:**

```javascript
const redis = require("redis");
const client = redis.createClient({
  host: "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});
```

**Python Example:**

```python
import redis
import os

r = redis.Redis(
    host='localhost',
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD'),
    decode_responses=True
)
```

## Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f redis

# Restart Redis
docker-compose restart redis

# Update to latest image
docker-compose pull
docker-compose up -d

# Backup data
docker-compose exec redis redis-cli -a your_password --rdb /data/backup.rdb

# Monitor performance
docker-compose exec redis redis-cli -a your_password info
```

## Security Considerations

### Password Security

- **Always set a strong password** in your `.env` file
- **Never commit `.env`** to version control
- **Use different passwords** for each environment

### Network Security

- **Default binding:** Redis binds to all interfaces (`0.0.0.0`)
- **Production:** Consider restricting to specific networks
- **Firewall:** Ensure port 6379 is not exposed to the internet

### Access Control

```bash
# Disable dangerous commands in production
# Edit redis.conf and uncomment:
# rename-command FLUSHDB ""
# rename-command FLUSHALL ""
# rename-command DEBUG ""
```

## Data Persistence

Data is stored in the Docker volume `redis_data` and persists across container restarts.

**Backup Strategy:**

```bash
# Manual backup
docker-compose exec redis redis-cli -a your_password --rdb /data/manual-backup-$(date +%Y%m%d).rdb

# Copy backup to host
docker cp redis-server:/data/manual-backup-20250707.rdb ./backups/
```

**Restore from Backup:**

```bash
# Stop Redis
docker-compose down

# Copy backup to volume
docker run --rm -v redis_data:/data -v $(pwd)/backups:/backup alpine cp /backup/dump.rdb /data/

# Start Redis
docker-compose up -d
```

## Troubleshooting

### Common Issues

**Redis won't start:**

```bash
# Check logs
docker-compose logs redis

# Common causes:
# - Port already in use
# - Invalid configuration
# - Permission issues
```

**Memory warnings:**

```bash
# Verify memory overcommit is set
cat /proc/sys/vm/overcommit_memory
# Should return: 1

# If not set, apply the fix:
sudo sysctl vm.overcommit_memory=1
```

**Connection refused:**

```bash
# Check if Redis is running
docker-compose ps

# Test connectivity
docker-compose exec redis redis-cli ping

# Check port binding
netstat -tlnp | grep 6379
```

**Permission denied:**

```bash
# Ensure Redis user can write to volume
docker-compose exec redis ls -la /data
```

### Performance Monitoring

```bash
# Redis info
docker-compose exec redis redis-cli -a your_password info

# Memory usage
docker-compose exec redis redis-cli -a your_password info memory

# Monitor commands
docker-compose exec redis redis-cli -a your_password monitor
```

## File Structure

```
redis/
├── docker-compose.yml    # Main compose file
├── redis.conf           # Redis configuration
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Upgrading

To upgrade to a newer Redis version:

1. **Backup your data** (see backup section above)
2. **Update the image tag** in `docker-compose.yml`
3. **Pull new image:** `docker-compose pull`
4. **Restart:** `docker-compose up -d`

## Support

- **Redis Documentation:** https://redis.io/documentation
- **Docker Hub:** https://hub.docker.com/_/redis
- **Redis Commander:** https://github.com/joeferner/redis-commander

---

**⚠️ Remember:** Always set `vm.overcommit_memory = 1` in `/etc/sysctl.conf` for optimal Redis performance!

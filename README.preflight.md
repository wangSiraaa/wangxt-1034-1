# Trae Preflight

This folder is prepared for `wangxt-1034-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18334
- API_PORT: 19334
- WEB_PORT: 20334
- DB_PORT: 21334
- REDIS_PORT: 22334

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.

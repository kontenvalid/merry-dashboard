# Security Policy - Merry Dashboard

## 🔒 Credential Management

All credentials and secrets are managed through **environment variables only**. No hardcoded credentials in source code.

### Environment Variables (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `COMPOSIO_API_KEY` | Composio MCP access | Yes |
| `META_TOKEN` | Meta/Facebook Graph API | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Yes |
| `NEXTAUTH_SECRET` | NextAuth session encryption | Yes |
| `NEXTAUTH_URL` | App URL for OAuth callbacks | Yes |
| `DATABASE_URL` | Neon PostgreSQL connection | Yes |
| `GOOGLE_SHEETS_ID` | Content schedule spreadsheet | No |
| `GOOGLE_DRIVE_*` | Drive folder IDs for uploads | No |

### Setup Instructions

1. **Copy example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values** in `.env.local` (never commit this file)

3. **Set in Vercel Dashboard:**
   - Go to: Settings → Environment Variables
   - Add each variable with appropriate values
   - Select "Production" and "Preview" and "Development"

## 🚫 What NOT to Do

- ❌ Never commit `.env`, `.env.local`, or `.env.production`
- ❌ Never push credentials to GitHub
- ❌ Never hardcode API keys in TypeScript/JavaScript files
- ❌ Never use real credentials in code examples or documentation

## ✅ What TO Do

- ✅ Use `process.env.VARIABLE_NAME` in code
- ✅ Use `.env.example` as template (no real values)
- ✅ Verify `.gitignore` excludes env files
- ✅ Rotate credentials if compromised
- ✅ Use separate credentials per environment (dev/staging/prod)

## 📁 Files Excluded from Git

```
.env
.env.local
.env.production
.env.*.local
```

Additional sensitive files:
```
*.key
*.pem
*.p12
*.crt
*credentials*
service-account-key.json
googleservice.json
```

## 🕵️ Credential Audit

If you suspect credential exposure:

1. **Rotate immediately** - Generate new credentials
2. **Check commit history** - Use `git log` and `git diff`
3. **Use git-secrets** - Scan for patterns:
   ```bash
   npx git-secrets --scan
   ```
4. **Force push clean history** if needed (last resort)

## 📅 Scheduled Cron Jobs

| Cron | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/sync` | 06:00 UTC daily | Sync social media data |
| `/api/cron/daily-research` | 00:00 UTC daily | AI news research |
| `/api/cron/daily-carousel` | 01:00 UTC daily | Generate carousel images |

All crons read credentials from `process.env` - no hardcoded values.

## 🔐 Security Best Practices

1. **Least Privilege** - Only request OAuth scopes you need
2. **Rotate Keys** - Change API keys periodically
3. **Monitor Usage** - Check API dashboards for unusual activity
4. **Separate Accounts** - Use dedicated service accounts when possible
5. **SSL Only** - Always use HTTPS and `sslmode=require` for database

## 📞 Report Security Issues

If you find a security vulnerability, please:
1. Don't open a public GitHub issue
2. Contact the maintainer directly
3. Describe the issue and potential impact
4. Provide steps to reproduce (if applicable)
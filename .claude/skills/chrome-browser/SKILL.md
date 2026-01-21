---
name: chrome-browser
description: View and interact with the website in Chrome browser from WSL2. Use when you need to debug, take screenshots, or verify the website is working.
---

# Chrome Browser (WSL2)

View and interact with websites in Chrome from WSL2 environment using Chrome DevTools MCP.

## Prerequisites

Chrome must be started with remote debugging enabled. The MCP tools connect via WebSocket to Chrome's debug port.

## Starting Chrome for Debugging

**CRITICAL:** Must use a separate user data directory and kill existing Chrome instances first.

### Step 1: Kill existing Chrome

```bash
cmd.exe /c 'taskkill /F /IM chrome.exe' 2>/dev/null || true
sleep 2
```

### Step 2: Start Chrome with debugging

```bash
'/mnt/c/Program Files/Google/Chrome/Application/chrome.exe' \
  --remote-debugging-port=9222 \
  --user-data-dir='C:\temp\chrome-debug' \
  'http://localhost:5173' 2>/dev/null &
sleep 5
```

Key flags:

- `--remote-debugging-port=9222` - enables DevTools protocol
- `--user-data-dir='C:\Users\morten\Documents\Code\art-gallery\.context\chrome-debug'` - **REQUIRED** - separate profile avoids conflicts with running Chrome

### Step 3: Verify connection

Check from PowerShell (more reliable than curl from WSL):

```bash
powershell.exe -Command "(Invoke-WebRequest -Uri 'http://localhost:9222/json' -TimeoutSec 5 -UseBasicParsing).Content" 2>&1 | head -20
```

Should return JSON array of open pages.

## Using MCP Tools

Once Chrome is running with debugging:

1. `mcp__chrome-devtools__list_pages` - list open pages
2. `mcp__chrome-devtools__take_snapshot` - get page content/DOM
3. `mcp__chrome-devtools__take_screenshot` - capture screenshot
4. `mcp__chrome-devtools__list_console_messages` - check for JS errors
5. `mcp__chrome-devtools__navigate_page` - navigate to URL

## Troubleshooting

### "Protocol error: Target closed"

The MCP server lost connection. Causes:

1. Chrome wasn't started with `--remote-debugging-port=9222`
2. Chrome was already running without debugging (restart needed)
3. Wrong user data directory (must be separate from main profile)

**Fix:** Kill all Chrome, restart with flags above.

### Can't connect from WSL

WSL2 network isolation may block localhost:9222. Use PowerShell to verify Chrome is listening:

```bash
powershell.exe -Command "Test-NetConnection -ComputerName localhost -Port 9222"
```

### Page shows "Sign in to Chrome"

Normal when using fresh `--user-data-dir`. The actual page will also load - check `list_pages` output for the localhost:5173 page.

## Quick Start Template

```bash
# Full restart sequence
cmd.exe /c 'taskkill /F /IM chrome.exe' 2>/dev/null || true
sleep 2
'/mnt/c/Program Files/Google/Chrome/Application/chrome.exe' \
  --remote-debugging-port=9222 \
  --user-data-dir='C:\temp\chrome-debug' \
  'http://localhost:5173' 2>/dev/null &
sleep 5
# Verify
powershell.exe -Command "(Invoke-WebRequest -Uri 'http://localhost:9222/json' -UseBasicParsing).Content" 2>&1 | head -5
```

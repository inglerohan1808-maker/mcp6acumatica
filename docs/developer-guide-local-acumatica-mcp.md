# Acumatica MCP Developer Guide: Localhost Integration

> **Document Version:** 1.0 (Production Ready)  
> **Target Audience:** Acumatica Customization & Core Development Team  
> **Environment:** Windows IIS / Localhost / Cloudflare Workers  
> **Security:** OAuth 2.0 Authorization Code Flow / OIDC IdentityServer  

---

## 1. Architecture & Why This Tunnel is Needed

When developing and testing Acumatica ERP customizations (PMS modules, custom DAC extensions, or Generic Inquiries), developers execute code locally against their dedicated IIS development instances (e.g. `http://localhost/Acumatica26R2/`).

The **Model Context Protocol (MCP) Server** runs in the cloud as a Cloudflare Worker (e.g. `mcp6acumatica.inglerohan1808.workers.dev`) and interfaces with AI developer assistants (Claude Desktop, Cursor, Antigravity). Cloudflare Workers operate in a public serverless runtime and cannot reach private loopback addresses (`localhost` or private `192.168.x.x` subnets).

**Cloudflare Tunnel (`cloudflared`)** solves this by establishing a lightweight, encrypted, outbound-only tunnel from your local machine to Cloudflare's edge network. This exposes your local Acumatica instance over a secure, publicly accessible HTTPS domain without modifying firewall rules, opening router ports, or requiring a static IP.

```
+-------------------------------------------------------+
|        AI Client (Claude Desktop / Cursor / IDE)      |
+---------------------------+---------------------------+
                            | (SSE / HTTP POST)
                            v
+---------------------------+---------------------------+
|      Cloudflare Worker (mcp6acumatica DO)             |
+---------------------------+---------------------------+
                            | (HTTPS Requests)
                            v
+---------------------------+---------------------------+
|      Cloudflare Edge (trycloudflare.com)              |
+---------------------------+---------------------------+
                            | (Encrypted Outbound Tunnel)
                            v
+---------------------------+---------------------------+
|      cloudflared Daemon (Running on Developer PC)     |
+---------------------------+---------------------------+
                            | (Local Loopback)
                            v
+---------------------------+---------------------------+
|      Local IIS Web (http://localhost/Acumatica26R2/)  |
+-------------------------------------------------------+
```

---

## 2. Developer Prerequisites Checklist

- [ ] **Local Acumatica Instance:** Running on IIS and accessible at `http://localhost/<InstanceName>/` (e.g., `http://localhost/Acumatica26R2/`).
- [ ] **Anonymous Authentication Enabled in IIS:** Open IIS Manager -> Select Acumatica Site/Application -> **Authentication** -> Ensure **Anonymous Authentication** is `Enabled` (required for OIDC & REST API endpoints).
- [ ] **Node.js v18+ Installed:** Required to run `npx cloudflared`, or install `cloudflared.exe`.
- [ ] **Acumatica Administrator Access:** Permissions to access screen **Connected Applications (`SM303010`)** and **Generic Inquiry (`SM208000`)**.
- [ ] **Cloudflare Worker Access:** Access to the team's Cloudflare Worker dashboard.

---

## 3. Step-by-Step Implementation

### Step 1: Launch Cloudflare Tunnel on Your PC
Open PowerShell on your Windows workstation and execute:

```powershell
npx cloudflared tunnel --url http://localhost
```

Cloudflare will establish the tunnel and print the public URL:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://announcement-auction-classic-magazines.trycloudflare.com                           |
+--------------------------------------------------------------------------------------------+
```

> **Warning:** Keep this terminal window open. If you terminate the command (`Ctrl+C`), the tunnel closes.

#### Verify Connectivity:
In your browser, test the IdentityServer discovery endpoint:
```
https://<your-subdomain>.trycloudflare.com/<InstanceName>/identity/.well-known/openid-configuration
```
A successful response returns a JSON document containing `authorization_endpoint` and `token_endpoint`.

---

### Step 2: Configure Acumatica Connected Applications (`SM303010`)

1. Open your local Acumatica instance (`http://localhost/Acumatica26R2/`).
2. Search and open **Connected Applications (`SM303010`)**.
3. Create a new record or select your MCP application:
   - **Client Name:** `Cloudflare MCP Worker`
   - **OAuth Flow:** `Authorization Code`
4. Under **Secrets**:
   - Click **New Secret** and copy the secret string immediately.
5. In the **REDIRECT URIS** tab:
   - Add: `https://mcp6acumatica.inglerohan1808.workers.dev/callback`
6. In the **SCOPES** tab:
   - Ensure `api` and `offline_access` are present.
7. Click **Save** and note your **Client ID** (format: `<GUID>@<Tenant>`, e.g., `6D2DCD41-09F9-6EB8-6147-ED52F132EFE2@Company`).

---

### Step 3: Update Cloudflare Worker Configuration

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> Select **`mcp6acumatica`**.
3. Go to **Settings** -> **Variables and secrets**.
4. Update the settings:

| Variable Name | Type | Value |
| :--- | :--- | :--- |
| `ACUMATICA_URL` | Variable | `https://announcement-auction-classic-magazines.trycloudflare.com/Acumatica26R2` |
| `ACUMATICA_CLIENT_ID` | Variable | `6D2DCD41-09F9-6EB8-6147-ED52F132EFE2@Company` |
| `ACUMATICA_CLIENT_SECRET` | Secret | *(Secret string copied from SM303010)* |
| `ACUMATICA_TENANT` | Variable | `Company` |

5. Click **Save and Deploy**.

---

### Step 4: Configure Canary Generic Inquiry (`MCPAccess`)

MCP4Acumatica includes an **access gate** to safeguard company ERP data: during login, the server verifies whether the authenticating user has permissions to read a designated canary Generic Inquiry (default: `MCPAccess`).

1. Open **Generic Inquiry (`SM208000`)**.
2. Create or open inquiry `MCPAccess`.
3. Check the box: **Expose via OData**.
4. Under **Access Rights by Screen (`SM201020`)**, ensure the developer user or an `MCP Access` role has *Granted (Read)* access to this inquiry.

---

### Step 5: Configure AI Client & Authenticate

Add the MCP server to your AI client configuration:

#### Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "acumatica-local": {
      "url": "https://mcp6acumatica.inglerohan1808.workers.dev/sse"
    }
  }
}
```

#### First-Time Authentication:
1. In Claude or Cursor, trigger any Acumatica prompt (e.g., *"List available Acumatica tools"*).
2. The AI client opens an OAuth authorization window in your browser pointing to the tunnel URL (`https://<tunnel-subdomain>.trycloudflare.com/...`).
3. Sign in using your local Acumatica credentials and click **Authorize**.
4. Tokens are stored encrypted in Cloudflare KV, and your AI assistant is now connected to your local environment.

---

### Step 6: Testing with Preflight Diagnostic

Navigate to:
```
https://mcp6acumatica.inglerohan1808.workers.dev/docs/admin/preflight
```
Log in using your `ADMIN_SECRET` to automatically validate:
- Acumatica reachability over tunnel
- OIDC discovery configuration
- Connected Application client credentials
- REST Contract API endpoint
- Canary GI read permissions

---

## 4. Troubleshooting Matrix

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **Tunnel URL changes on restart** | Quick Tunnels generate ephemeral URLs every session. | Update `ACUMATICA_URL` in Cloudflare Worker settings upon restarting the tunnel, or configure a persistent Named Tunnel. |
| **502 Bad Gateway** | Local IIS service or Application Pool stopped. | Run `iisreset` as Administrator and verify `http://localhost/Acumatica26R2` loads locally. |
| **Redirect URI Mismatch** | Typo or extra trailing slash in SM303010. | Verify SM303010 redirect URI matches `https://<worker-domain>/callback` exactly. |
| **401 Unauthorized / Access Gate Denied** | User lacks permission to read canary GI `MCPAccess`. | In SM208000, ensure `MCPAccess` has **Expose via OData** enabled and user role has read access. |
| **OData Filter Refusal on Inquiries** | Filtering on calculated expression columns (`=...`). | Acumatica does not support `$filter` on calculated columns. Filter by stored DB fields instead. |

---

## 5. Setting Up a Permanent Named Tunnel (Optional)

To avoid changing the URL every time you restart the tunnel:
```powershell
# 1. Login to Cloudflare CLI
cloudflared tunnel login

# 2. Create persistent tunnel
cloudflared tunnel create dev-acumatica

# 3. Route your custom domain
cloudflared tunnel route dns dev-acumatica dev-acumatica.yourdomain.com

# 4. Run the tunnel
cloudflared tunnel run --url http://localhost dev-acumatica
```
With a named tunnel, your `ACUMATICA_URL` remains static indefinitely.

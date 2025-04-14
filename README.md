# SWGOH Proxy

A simple proxy that injects `x-date` and HMAC signature headers into requests to the SWGOH API.

## Usage

Deploy this on Render, add your `SECRET_KEY` as an environment variable, and forward all GPT calls to:

```
/data
```

It will forward requests to `https://swgoh-comlink-0zch.onrender.com/data` with the appropriate headers.
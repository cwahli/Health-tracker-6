#!/bin/bash
diff -u <(git show HEAD:server.ts 2>/dev/null || cat server.ts) server.ts

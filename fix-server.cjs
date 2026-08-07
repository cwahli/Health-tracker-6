const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `}

const app = express();
        status_message: err.message || 'Analysis failed',
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
    }
  }, 0);
});`;

const replace = `}

const app = express();`;

content = content.replace(target, replace);
fs.writeFileSync('server.ts', content);

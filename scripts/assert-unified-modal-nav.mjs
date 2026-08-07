import fs from 'fs';

const logChatSrc = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
const bottomNavSrc = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

let failed = false;
function assert(condition, msg) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

// 1. BottomNav.tsx contains centered + button
assert(bottomNavSrc.includes('+') || bottomNavSrc.includes('FloatingActionSheet') || bottomNavSrc.includes('Plus'), 'BottomNav missing FloatingActionSheet or + button');
// 2. FloatingActionSheet.tsx exists
assert(fs.existsSync('src/components/FloatingActionSheet.tsx'), 'FloatingActionSheet.tsx does not exist');
// 3. App.tsx does NOT contain old FAB
assert(!appSrc.includes('fab-food-btn'), 'App.tsx still contains fab-food-btn');
// 4. LogChat.tsx does NOT contain food mode pills
assert(!logChatSrc.includes('setUserSelectedMode("review")'), 'LogChat.tsx still contains mode pills logic');
// 5. LogChat.tsx accepts jobId prop
assert(logChatSrc.includes('jobId'), 'LogChat.tsx does not accept jobId prop');

if (failed) process.exit(1);
console.log('PASS');

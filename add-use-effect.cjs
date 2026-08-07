const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const target = `  useEffect(() => {
    // Configure executor for background queue runner`;
const replacement = `  const currentUserId = auth.currentUser?.uid;
  useEffect(() => {
    const cleanupSupabaseSync = initSupabaseJobSync(currentUserId);
    return () => {
      cleanupSupabaseSync();
    };
  }, [currentUserId]);

  useEffect(() => {
    // Configure executor for background queue runner`;
fs.writeFileSync('src/App.tsx', content.replace(target, replacement));

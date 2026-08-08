const fs = require('fs');
const code = fs.readFileSync('src/components/Header.tsx', 'utf-8');
const target = `<BugTrackerModal
        isOpen={showBugTracker}
        onClose={() => setShowBugTracker(false)}
      />
    </>
  );
}`;
const repl = `<BugTrackerModal
        isOpen={showBugTracker}
        onClose={() => setShowBugTracker(false)}
      />
      <BugSnapshotFab
        isAdmin={profile?.email?.toLowerCase().trim() === 'cwah.liu@gmail.com' || false}
        firebaseUid={auth.currentUser?.uid}
        activeTab={activeTab}
        profile={profile}
        biomarkers={biomarkers}
        biomarkerHistory={biomarkerHistory}
        getModalContext={async () => {
          const allJobs = JobStore.getAllJobs();
          const pendingFoodLog = allJobs[0]?.result?.pendingFoodLog || foodLogs?.[0] || null;
          return { pendingFoodLog, activeTab, timestamp: Date.now() };
        }}
      />
    </>
  );
}`;
fs.writeFileSync('src/components/Header.tsx', code.replace(target, repl));

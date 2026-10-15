# Unblock TahitiSpeak PR #30 artifact v4 push (2026-10-15)
# Local commit ready: 1c2b432 on fix/deployable-2026-10-14
# Blocker: gh OAuth token lacks `workflow` scope (needed to push .github/workflows/*)

gh auth refresh -h github.com -s workflow,repo,read:org,gist
cd C:\Users\Admin\GitHub\TahitiSpeak
git push origin fix/deployable-2026-10-14
gh pr view 30 --json headRefOid,url -q "{head: .headRefOid, url: .url}"

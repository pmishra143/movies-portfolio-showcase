"""Small explicit release gate, not a guarantee of absence of all secrets."""

from pathlib import Path
import re, sys, json

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE = {".git", ".local-review", "__pycache__", "node_modules"}
RULES = {
    "private home path": r"/(?:Users|home)/[A-Za-z0-9_.-]+",
    "private host": r"(?:movies|dashboard|trading)\.pmportals\.com",
    "personal address": r"[A-Za-z0-9_.+-]+@(?:gmail|outlook|yahoo)\.com",
    "private endpoint": r"(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|root\x40)",
    "private key": r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "github token": r"gh[pousr]_[A-Za-z0-9]{30,}",
    "cloud key": r"AKIA[0-9A-Z]{16}",
    "provider key": r"sk-[A-Za-z0-9_-]{24,}",
    "bearer credential": r"Bearer\s+[A-Za-z0-9._-]{25,}",
}
issues = []
count = 0
for p in sorted(ROOT.rglob("*")):
    if not p.is_file() or any(x in EXCLUDE for x in p.relative_to(ROOT).parts):
        continue
    rel = p.relative_to(ROOT)
    count += 1
    if p.name.startswith(".env") or p.suffix in {
        ".pem",
        ".key",
        ".sqlite",
        ".sqlite3",
        ".db",
        ".docx",
        ".zip",
    }:
        issues.append(f"{rel}: prohibited file type")
    if p.suffix == ".png":
        if str(rel) not in {
            "docs/assets/demo-desktop.png",
            "docs/assets/demo-mobile.png",
        }:
            issues.append(f"{rel}: unapproved binary image")
        continue
    try:
        text = p.read_text()
    except UnicodeDecodeError:
        issues.append(f"{rel}: unexpected binary")
        continue
    for label, pattern in RULES.items():
        if re.search(pattern, text):
            issues.append(f"{rel}: {label}")
    if str(rel).startswith("docs/js/"):
        calls = re.findall(r"fetch\(\s*[\'\"]([^\'\"]+)", text)
        if any(x != "data/catalog.json" for x in calls):
            issues.append(f"{rel}: unapproved fetch target")
    if p.suffix in {".html", ".css", ".mjs"} and re.search(
        r"https?://(?:images\.|fonts\.|api\.|cdn\.)", text
    ):
        issues.append(f"{rel}: remote runtime dependency")
report = {
    "files_reviewed": count,
    "issues": issues,
    "status": "PASS" if not issues else "FAIL",
    "limits": "Pattern scan plus curated file review; not a formal secret-detection guarantee.",
}
print(json.dumps(report, indent=2))
sys.exit(bool(issues))

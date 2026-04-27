import os
import re

files = [
    "frontend/src/components/admin/UserHistoryModal.tsx",
    "frontend/src/components/menu/CartModal.tsx",
    "frontend/src/components/layout/Header.tsx",
    "frontend/src/components/landing/ScannerModal.tsx",
    "frontend/src/components/order/OrderDetailModal.tsx"
]

for file in files:
    if not os.path.exists(file):
        print(f"Skipping {file}, not found.")
        continue
        
    with open(file, "r") as f:
        content = f.read()

    if "DialogDescription" not in content:
        content = re.sub(
            r"""(import\s*\{[^}]*DialogContent[^}]*)(\}\s*from\s*["']@/components/ui/dialog["'])""", 
            r"\1, DialogDescription \2", 
            content
        )

    if "<DialogDescription" not in content:
        content = re.sub(r"(<DialogContent[^>]*>)", r'\1\n        <DialogDescription className="sr-only">Dialog nội dung</DialogDescription>', content)

    with open(file, "w") as f:
        f.write(content)
        print(f"Updated {file}")

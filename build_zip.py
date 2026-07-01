#!/usr/bin/env python3
"""
build_zip.py — Packages the Christantus Medical Consult project into a ZIP file.

Usage:
    python3 build_zip.py

Run this script from the directory that CONTAINS the "christantus-medical"
project folder (i.e. one level above it). It will produce
"christantus-medical.zip" in the same location.

This excludes node_modules, .env (secrets), and other files that shouldn't
be shipped — matching the project's .gitignore.
"""

import os
import zipfile

PROJECT_DIR = "christantus-medical"
OUTPUT_ZIP = "christantus-medical.zip"

# Directories/files to skip entirely
EXCLUDE_DIRS = {"node_modules", ".git", ".vscode", ".idea", "dist", "build"}
EXCLUDE_FILES = {".env", ".DS_Store", "Thumbs.db"}
# Skip uploaded user content but keep the folder structure via .gitkeep
EXCLUDE_PATH_CONTAINS = {os.path.join("backend", "uploads")}


def should_skip_dir(dirname):
    return dirname in EXCLUDE_DIRS


def should_skip_file(filepath, filename):
    if filename in EXCLUDE_FILES:
        return True
    for marker in EXCLUDE_PATH_CONTAINS:
        if marker in filepath and filename != ".gitkeep":
            return True
    return False


def build_zip():
    if not os.path.isdir(PROJECT_DIR):
        print(f"❌ Could not find '{PROJECT_DIR}' in the current directory.")
        print("   Run this script from the folder that contains it.")
        return

    file_count = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(PROJECT_DIR):
            # Prune excluded directories in-place so os.walk skips them
            dirs[:] = [d for d in dirs if not should_skip_dir(d)]

            for filename in files:
                filepath = os.path.join(root, filename)
                if should_skip_file(filepath, filename):
                    continue

                arcname = os.path.relpath(filepath, start=".")
                zf.write(filepath, arcname)
                file_count += 1

    size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
    print(f"✅ Created {OUTPUT_ZIP} ({file_count} files, {size_mb:.2f} MB)")
    print("   Extract it and follow README.md to get started.")


if __name__ == "__main__":
    build_zip()

# UMIS Distribution Guide: Python Wheels & Standalone Executables

Welcome to the **Upemba Medical Information System (UMIS)** deployment reference sheet. This document details how to package, distribute, and run your software offline on employee computers. It explains the mechanics behind **Universal Wheels** and **Standalone Executables (`.exe`)**, how they work conceptually, and how to rebuild them.

---

## 1. Core Concepts: What are Wheels and Executables?

| Concept | Python Wheel (`.whl`) | Standalone Executable (`.exe`) |
| :--- | :--- | :--- |
| **What it is** | A standard Python package archive (a zip file with metadata) that installs directly into an existing Python environment. | A single, compiled Windows binary containing the app, resources, and the Python interpreter itself. |
| **Prerequisites** | The target computer **must** have Python installed (any version like 3.11, 3.12, 3.13 if universal). | **Zero prerequisites.** Works on any Windows 10/11 computer out-of-the-box. |
| **How it runs** | Executed in a terminal via a launcher command (e.g. `py -m cli` or `umis-start`). | Executed like a normal Windows program by double-clicking the `UMIS.exe` icon. |
| **IP Protection** | Code can be obfuscated into bytecode (`.pyc`), but bytecode is version-locked to a specific Python release. | High security; code and interpreter are bundled together in a single binary. |

---

## 2. Behind the Scenes: How the Packaging Pipeline Works

The UMIS build system utilizes a **Next.js static-export pipeline** combined with **Django asset staging** to deliver a single, offline-first application:

```
[Next.js Frontend] ──(npm run build)──> [Static Export: HTML/CSS/JS]
                                                  │
                                          (Staged Into)
                                                  ▼
                                       [Django App: core/static]
                                                  │
                      ┌───────────────────────────┴──────────────────────────┐
                      ▼                                                      ▼
           [Python Wheel Pipeline]                               [PyInstaller Compiler]
         (python setup.py bdist_wheel)                             (pyinstaller umis.spec)
                      │                                                      │
                      ▼                                                      ▼
         umis-1.0.0-py3-none-any.whl                                      UMIS.exe
        (Runs on any Python system)                            (Runs on any Windows PC)
```

1. **Frontend Export:** The Next.js frontend compiles all React pages into static HTML exports (`output: 'export'` in `next.config.ts`).
2. **Asset Staging:** These static files are copied directly into the Django **`core/static/`** folder, and the base `index.html` is placed in **`core/templates/`**. This ensures the frontend is physically packaged inside the Django app.
3. **Django URL Routing:** When the browser calls a file (like `/_next/static/chunks/...`), Django catches the route and serves the embedded Next.js static asset instantly from the `core/static` package directory.
4. **Binary Compilation:**
   * **For Wheels:** Setuptools packages the files into a standard `.whl` library.
   * **For Executables:** PyInstaller reads `umis.spec`, bundles the complete Python interpreter, and compiles the code and static folders into a single, standalone `UMIS.exe` binary.

---

## 3. How to Operate & Build the Packaging Pipelines

### A. The Universal Python Wheel (`.whl`)
Ideal for lightweight distribution on computers that already have Python installed.

#### 1. Rebuilding locally
Make sure your frontend is built, then run:
```bash
cd src/backend
python setup.py bdist_wheel
```
*Your universal wheel will be created inside `src/backend/dist/umis-1.0.0-py3-none-any.whl`.*

#### 2. Deploying via GitHub Actions
We have automated this! Simply push a tag to GitHub to trigger compilation:
```bash
git tag v1.0.6
git push origin v1.0.6
```
GitHub Actions will automatically build, package, and upload the wheel directly to your **GitHub Releases** draft!

#### 3. Installing on an employee computer
Copy the `.whl` file to the target computer and run:
```bash
py -m pip install ./umis-1.0.0-py3-none-any.whl --force-reinstall
```

#### 4. Launching the wheel system
```bash
py -m cli
```

---

### B. The Standalone Executable (`.exe`)
The premium, single-file Windows setup for standard employees with **zero technical prerequisites**.

#### 1. Prerequisites (For the developer compiling the EXE)
Install PyInstaller locally:
```bash
py -m pip install pyinstaller
```

#### 2. Compiling the `.exe`
Run the compiler inside the backend folder using your custom specification file:
```bash
cd src/backend
pyinstaller umis.spec
```
*PyInstaller will bundle all assets, dependencies, and the Python runtime into a single file.*

#### 3. Accessing the Executable
Once the build completes successfully, go to:
📁 **`src/backend/dist/`**
You will see your beautiful **`UMIS.exe`** file, customized with a medical cross icon!

#### 4. Deploying to Employees
1. Copy **`UMIS.exe`** to their computer (via USB, shared drive, or private link).
2. The employee simply **double-clicks the file** to run it. No installations, no terminals, and no configuration required!

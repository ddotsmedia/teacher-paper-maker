# PHASE 5: Desktop App (Tauri)

**Duration**: 1 week | **Lead**: Frontend Agent | **No questions, full autopilot**

**Prerequisite**: Phase 1-3 complete, API client ready (Phase 4)

## Objective

Desktop app for Windows, macOS, Linux. Native binary, lightweight, uses Tauri + React. Same functionality as web: login, create worksheet, edit, export PDF. Reads/writes local files directly.

## Key Differences from Web

- No browser toolbars/address bar (clean app UI)
- Direct file system access (save PDFs to user's Documents)
- System tray icon (quit from tray)
- Keyboard shortcuts (Cmd+S, Ctrl+N, etc.)
- Auto-updates via Tauri updater

## What to Build

### 1. Tauri Project Setup

```bash
npx create-tauri-app@latest --product-name "Teacher Paper Maker" \
  --ui react --typescript apps/desktop
```

**Structure**:
```
apps/desktop/
├── src/
│   ├── main.tsx         (React entry)
│   ├── App.tsx
│   └── screens/         (Same as web)
├── src-tauri/
│   ├── src/main.rs      (Rust backend)
│   └── tauri.conf.json  (Config)
└── package.json
```

### 2. Window Configuration (tauri.conf.json)

```json
{
  "app": {
    "windows": [
      {
        "title": "Teacher Paper Maker",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "frontendDist": "../dist"
  }
}
```

### 3. Rust Backend (Tauri Commands)

**`apps/desktop/src-tauri/src/main.rs`**:

```rust
#[tauri::command]
fn save_pdf(content: Vec<u8>, filename: String) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_default();
    let path = format!("{}/Documents/{}", home, filename);
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path)
}

#[tauri::command]
fn open_file_dialog(title: String) -> Result<String, String> {
    // Use tauri file dialog
    Ok("file_path".to_string())
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_pdf,
            open_file_dialog,
            get_app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4. API Client Integration

Reuse `packages/api-client` from Phase 4:

```tsx
// apps/desktop/src/services/api.ts
import { apiClient } from '@teacher-paper-maker/api-client';

// Set base URL from Tauri config
apiClient.setBaseUrl('http://localhost:3000');

export default apiClient;
```

### 5. File System Integration

**`apps/desktop/src/lib/file-system.ts`**:

```ts
import { invoke } from '@tauri-apps/api/tauri';

export async function savePDFToDisk(pdf: Buffer, filename: string): Promise<string> {
  const path = await invoke<string>('save_pdf', {
    content: Array.from(pdf),
    filename,
  });
  return path;
}

export async function openFileDialog(): Promise<string> {
  return invoke<string>('open_file_dialog', {
    title: 'Select worksheet file',
  });
}
```

### 6. Main Window Customization

**`apps/desktop/src/App.tsx`**:

```tsx
import { useEffect } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/window';

export default function App() {
  useEffect(() => {
    // Custom titlebar
    const titlebar = document.querySelector('.titlebar');
    if (titlebar) {
      ['mousedown', 'touchstart'].forEach(event => {
        titlebar.addEventListener(event, () => appWindow.startDragging());
      });
    }
  }, []);
  
  return (
    <div className="app">
      {/* Custom titlebar (optional) */}
      <div className="titlebar">
        <div className="titlebar-title">Teacher Paper Maker</div>
        <div className="titlebar-controls">
          <button onClick={() => appWindow.minimize()}>_</button>
          <button onClick={() => appWindow.toggleMaximize()}>□</button>
          <button onClick={() => appWindow.close()}>×</button>
        </div>
      </div>
      
      {/* App content */}
      <MainApp />
    </div>
  );
}
```

### 7. Keyboard Shortcuts

**`apps/desktop/src/hooks/useKeyboardShortcuts.ts`**:

```ts
import { useEffect } from 'react';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (ctrl && e.key === 's') {
        e.preventDefault();
        document.dispatchEvent(new Event('save-worksheet'));
      }
      
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        document.dispatchEvent(new Event('new-worksheet'));
      }
      
      if (ctrl && e.key === 'q') {
        e.preventDefault();
        window.close();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 8. App Menu (Native macOS/Windows Menus)

**`apps/desktop/src-tauri/src/menu.rs`**:

```rust
use tauri::Menu;

pub fn create_menu() -> Menu {
    Menu::new()
        .add_submenu(Submenu::new(
            "File",
            Menu::new()
                .add_item(CustomMenuItem::new("new", "New Worksheet"))
                .add_item(CustomMenuItem::new("open", "Open"))
                .add_item(CustomMenuItem::new("save", "Save"))
                .add_item(CustomMenuItem::new("export_pdf", "Export as PDF"))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        ))
        .add_submenu(Submenu::new(
            "Help",
            Menu::new().add_item(CustomMenuItem::new("about", "About")),
        ))
}
```

### 9. System Tray

**`apps/desktop/src-tauri/src/main.rs`**:

```rust
fn main() {
    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(menu))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => std::process::exit(0),
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    _ => {}
                }
            }
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 10. Auto-Updates

**`apps/desktop/src-tauri/tauri.conf.json`**:

```json
{
  "build": {
    "bundle": {
      "updater": {
        "active": true,
        "endpoints": [
          "https://releases.teacherpaper.app/update"
        ],
        "dialog": true,
        "pubkey": "..."
      }
    }
  }
}
```

### 11. Reuse Web Components

Desktop app imports React components from web:

```tsx
import { WorksheetForm } from '@teacher-paper-maker/ui';
import { DashboardContent } from '../web/src/screens/Dashboard';

// No duplication, same components
```

### 12. Testing

**Desktop-specific tests**:
- File system operations
- Keyboard shortcuts
- System tray interactions
- Auto-update checks

### What NOT to Do

- ❌ Do NOT implement file drag-drop (Phase X)
- ❌ Do NOT use Electron (Tauri is lighter)
- ❌ Do NOT build installers yet (Tauri handles this)
- ❌ Do NOT implement code signing (Phase X production)
- ❌ Do NOT add extensions/plugins

## Steps to Execute

### 1. Tauri Project Setup
```bash
npx create-tauri-app
```

### 2. Configure tauri.conf.json
- Window settings
- Build config
- App metadata

### 3. Rust Backend
- Implement save_pdf command
- Implement file dialog
- Implement version check

### 4. React UI
- Import from web components
- Add desktop-specific UI (titlebar, menu)
- Connect to Rust commands

### 5. Keyboard Shortcuts
- Implement useKeyboardShortcuts hook
- Bind common actions (Cmd+S, Ctrl+N)

### 6. Menu + Tray
- Create native menu
- Implement system tray toggle

### 7. File System Integration
- Test save PDF to Documents
- Test open file dialog

### 8. Testing
- Unit tests (file operations)
- Integration tests (UI + Rust)
- Manual testing (Windows, macOS, Linux)

### 9. Build Binaries
```bash
pnpm tauri build
```

## Validation Checklist

- [ ] Desktop app launches
- [ ] Login works
- [ ] Dashboard displays
- [ ] Can create worksheet
- [ ] Can export PDF to Documents folder
- [ ] PDF opens in system reader
- [ ] Keyboard shortcuts work
- [ ] System tray icon works
- [ ] Native menu appears
- [ ] App titlebar visible
- [ ] Window resizable
- [ ] Can minimize/maximize/close
- [ ] App closes cleanly
- [ ] Tests pass

## Exit Criteria (Phase 5 DONE when)

1. ✅ App builds for Windows, macOS, Linux
2. ✅ All features functional (login, create, export)
3. ✅ File system integration works
4. ✅ Keyboard shortcuts functional
5. ✅ System tray works
6. ✅ Tests pass
7. ✅ Binaries signed (for production)

---

**CRITICAL**: Reuse web components, share API client package. No duplication.

**EXECUTE WITHOUT ASKING.**

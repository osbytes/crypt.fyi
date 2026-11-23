//! Native shell for the crypt.fyi desktop app.
//!
//! This side only owns the tray, window lifecycle and plugin wiring. All encryption happens
//! in the webview through `@crypt.fyi/core`, so no secret, key or password ever crosses the
//! IPC bridge into Rust.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, State, WindowEvent, Wry,
};

const MAIN_WINDOW: &str = "main";
/// Payload is the view to show: `"create"` or `"settings"`.
const OPEN_EVENT: &str = "crypt://open";
/// Lets the frontend drop any plaintext still held in the form once the window is gone.
const HIDDEN_EVENT: &str = "crypt://hidden";

struct TrayItems {
    new_secret: MenuItem<Wry>,
    settings: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

fn show_main_window(app: &AppHandle, view: &str) {
    let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
        return;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.emit(OPEN_EVENT, view);
}

/// The tray is built natively so the app can always be reopened or quit, even if the
/// webview failed to load. The frontend localizes the labels once its translations load.
#[tauri::command]
fn set_tray_labels(
    items: State<'_, TrayItems>,
    new_secret: String,
    settings: String,
    quit: String,
) -> Result<(), String> {
    let labels = [
        (&items.new_secret, new_secret),
        (&items.settings, settings),
        (&items.quit, quit),
    ];
    for (item, label) in labels {
        item.set_text(label).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        // A second launch would add a duplicate tray icon and fail to claim the shortcut,
        // so hand off to the running instance instead.
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                show_main_window(app, "create");
            }))
            .plugin(tauri_plugin_global_shortcut::Builder::new().build());
    }

    builder
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_tray_labels])
        .setup(|app| {
            // Menu-bar utility: no Dock icon or app switcher entry on macOS.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let new_secret = MenuItem::with_id(app, "new", "New secret", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&new_secret, &settings, &separator, &quit])?;

            let mut tray = TrayIconBuilder::with_id("main")
                .tooltip("crypt.fyi")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "new" => show_main_window(app, "create"),
                    "settings" => show_main_window(app, "settings"),
                    "quit" => app.exit(0),
                    _ => {}
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            app.manage(TrayItems {
                new_secret,
                settings,
                quit,
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window keeps the app in the tray so the shortcut stays available.
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                let _ = window.emit(HIDDEN_EVENT, ());
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run the crypt.fyi desktop app");
}

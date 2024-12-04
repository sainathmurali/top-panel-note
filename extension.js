import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import Cogl from 'gi://Cogl';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

const TopPanelNote = GObject.registerClass(
    class TopPanelNote extends PanelMenu.Button {
        _init() {
            super._init(0.0, null, false);

            this._icon = new St.Icon({
                icon_name: 'x-office-document-template',
                style_class: 'system-status-icon',
                x_expand: false,
                y_expand: false,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                style: 'padding: 2px;',
            });

            this.add_child(this._icon);

            this._noteText = '';

            // Create a Clutter.Text actor
            this._entry = new Clutter.Text({
                editable: true,
                single_line_mode: false,
                line_wrap: true,
                line_wrap_mode: Pango.WrapMode.WORD_CHAR,
                text: _('Enter your note'),
                reactive: true,
            });

            // Set color using Cogl.Color
            let color = new Cogl.Color();
            color.init_from_4f(1, 1, 1, 1); // White color in normalized RGBA
            this._entry.set_color(color);

            // Enable clipboard paste functionality
            this._entry.connect('key-press-event', (actor, event) => {
                log(`Key pressed: key_symbol=${event.get_key_symbol()} state=${event.get_state()}`);
                
                // Check for Ctrl+V (paste) event
                if (event.get_key_symbol() === Clutter.KEY_v && event.get_state() & Clutter.ModifierType.CONTROL_MASK) {
                    log("Detected Ctrl+V (paste)");
                    this._pasteFromClipboard();
                    return Clutter.EVENT_STOP;
                }
                return Clutter.EVENT_PROPAGATE;
            });

            // Create a St.BoxLayout to hold the Clutter.Text
            const layout = new St.BoxLayout();
            layout.add_child(this._entry);

            let monitor = Main.layoutManager.primaryMonitor;
            let maxWidth = monitor.width * 0.2;
            let maxHeight = monitor.height * 0.35;

            // Create a St.ScrollView to add a scrollbar
            this._scrollView = new St.ScrollView({
                hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.AUTOMATIC,
                width: maxWidth,  // Adjust the width if needed
                height: maxHeight, // Adjust the height if needed
            });
            this._scrollView.add_child(layout);

            // Create a PopupMenuItem and add the scroll view
            this._noteMenuItem = new PopupMenu.PopupMenuItem('');
            this._noteMenuItem.actor.add_child(this._scrollView);
            this.menu.addMenuItem(this._noteMenuItem);

            // Add signal to allow focus on click anywhere in the text area
            layout.connect('button-press-event', (actor, event) => {
                this._entry.grab_key_focus(); // Focus the Clutter.Text input
                return Clutter.EVENT_STOP;    // Prevent event propagation
            });

            // Handle key focus events to control placeholder behavior
            this._entry.connect('key-focus-in', () => {
                if (this._entry.get_text() === _('Enter your note')) {
                    this._entry.set_text('');
                }
            });

            this._entry.connect('key-focus-out', () => {
                let text = this._entry.get_text().trim();
                if (text === '') {
                    this._entry.set_text(_('Enter your note'));
                } else {
                    this.setNoteText(text);
                }
            });

            // Load existing note from storage
            this._loadNoteFromStorage();
        }

        _getCacheFilePath() {
            return `${GLib.get_user_cache_dir()}/top_panel_note_cache.txt`;
        }

        setNoteText(text) {
            log(`Setting note text: ${text}`);
            this._noteText = text.trim();
            this._entry.set_text(this._noteText);
            this._storeNoteInStorage(this._noteText);
        }

        _storeNoteInStorage(text) {
            let filePath = this._getCacheFilePath();

            try {
                let file = Gio.File.new_for_path(filePath);
                let outputStream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);

                let textBytes = new TextEncoder().encode(text);
                outputStream.write_all(textBytes, null);
                outputStream.close(null);
                log("Note text stored successfully.");
            } catch (e) {
                logError(e, 'Failed to store note in cache');
            }
        }

        _loadNoteFromStorage() {
            let filePath = this._getCacheFilePath();

            try {
                let file = Gio.File.new_for_path(filePath);
                if (file.query_exists(null)) {
                    let [success, content] = file.load_contents(null);
                    if (success) {
                        let decoder = new TextDecoder();
                        let text = decoder.decode(content).trim();
                        this._noteText = text;
                        this._entry.set_text(this._noteText);
                        log("Note text loaded successfully.");
                    } else {
                        this._noteText = '';
                        this._entry.set_text(_('Enter your note'));
                    }
                } else {
                    this._noteText = '';
                    this._entry.set_text(_('Enter your note'));
                }
            } catch (e) {
                logError(e, 'Failed to load note from cache');
            }
        }

        _pasteFromClipboard() {
            log("Attempting to paste from clipboard...");
            
            // Access the clipboard using St.Clipboard
            let clipboard = St.Clipboard.get_default();
            
            // Request the clipboard text, with a callback function
            clipboard.get_text(St.ClipboardType.CLIPBOARD, (clipboard, text) => {
                if (text) {
                    log(`Clipboard content: ${text}`);
                    
                    // Insert the clipboard text into the entry
                    let currentText = this._entry.get_text();
                    let cursorPos = this._entry.get_cursor_position();
                    log(`Current text: ${currentText}`);
                    log(`Cursor position: ${cursorPos}`);
                    
                    let beforeCursor = currentText.slice(0, cursorPos);
                    let afterCursor = currentText.slice(cursorPos);
                    let newText = beforeCursor + text + afterCursor;
                    this._entry.set_text(newText);
                } else {
                    log("Clipboard is empty or failed to retrieve text.");
                }
            });
        }
    }
);

export default class TopPanelNoteExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        console.debug(`Constructing ${this.metadata.name}`);
    }

    enable() {
        console.debug(`Enabling ${this.metadata.name}`);
        this._topPanelNote = new TopPanelNote();
        Main.panel.addToStatusArea('topPanelNote', this._topPanelNote);
    }

    disable() {
        console.debug(`Disabling ${this.metadata.name}`);
        if (this._topPanelNote) {
            this._topPanelNote.destroy();
            this._topPanelNote = null;
        }
    }
}

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
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
                reactive: true,
                x_expand: true,
                y_expand: true,
            });

            // Clipboard paste handling (Ctrl+V)
            this._entry.connect('key-press-event', (actor, event) => {
                const symbol = event.get_key_symbol();
                const state = event.get_state();
                const isCtrl = (state & Clutter.ModifierType.CONTROL_MASK) !== 0;

                if (isCtrl && (symbol === Clutter.KEY_v || symbol === Clutter.KEY_V)) {
                    const clipboard = St.Clipboard.get_default();
                    clipboard.get_text(St.ClipboardType.CLIPBOARD, (_clipboard, text) => {
                        if (text) {
                            const currentText = this._entry.get_text();
                            const cursorPos = this._entry.get_cursor_position();
                            const beforeCursor = currentText.slice(0, cursorPos);
                            const afterCursor = currentText.slice(cursorPos);
                            this._entry.set_text(beforeCursor + text + afterCursor);
                            this._entry.set_cursor_position(cursorPos + text.length);
                        }
                    });
                    return true;
                }
                return false;
            });
            // Create a St.BoxLayout to hold the Clutter.Text
            const layout = new St.BoxLayout({
                vertical: true,
                x_expand: true,
                y_expand: true,
            });
            layout.add_child(this._entry);

            let monitor = Main.layoutManager.primaryMonitor;
            this._width = monitor ? monitor.width * 0.2 : 300;
            this._height = monitor ? monitor.height * 0.35 : 200;

            this._scrollView = new St.ScrollView({
                hscrollbar_policy: St.PolicyType.NEVER,
                vscrollbar_policy: St.PolicyType.ALWAYS,
                width: this._width,
                height: this._height,
            });
            this._scrollView.add_child(layout);

            // Create a PopupMenuItem and add the scroll view
            this._noteMenuItem = new PopupMenu.PopupMenuItem('');
            this._noteMenuItem.add_child(this._scrollView);
            this.menu.addMenuItem(this._noteMenuItem);

            // Focus and position cursor at end of text when clicking anywhere in empty space
            const focusAndPositionCursor = () => {
                this._entry.grab_key_focus();
                if (this._entry.get_text() === _('Enter your note')) {
                    this._entry.set_text('');
                }
                this._entry.set_cursor_position(-1);
                return true;
            };

            layout.connect('button-press-event', focusAndPositionCursor);
            this._scrollView.connect('button-press-event', focusAndPositionCursor);

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

            // Add resize handle via bottom-right corner
            this._resizeHandle = new St.Widget({
                reactive: true,
                can_focus: true,
                track_hover: true,
                style_class: 'resize-corner',
            });
            this._resizeHandle.set_style(`
                width: 16px;
                height: 16px;
                background: transparent;
                position: absolute;
                bottom: 0;
                right: 0;
            `);

            this._noteMenuItem.add_child(this._resizeHandle);

            this._resizeHandle.connect('button-press-event', () => {
                this._resizing = true;
                return true;
            });

            this._resizeHandle.connect('motion-event', () => {
                if (this._resizing) {
                    let [mouseX, mouseY] = global.get_pointer();
                    this._width = Math.max(200, mouseX - this._scrollView.x);
                    this._height = Math.max(100, mouseY - this._scrollView.y);
                    this._scrollView.set_width(this._width);
                    this._scrollView.set_height(this._height);
                }
                return false;
            });

            this._resizeHandle.connect('button-release-event', () => {
                this._resizing = false;
                return true;
            });
        }

        _getCacheFilePath() {
            return `${GLib.get_user_cache_dir()}/top_panel_note_cache.txt`;
        }

        setNoteText(text) {
            this._noteText = text.trim();
            this._entry.set_text(this._noteText);
            this._storeNoteInStorage(this._noteText);
        }

        _storeNoteInStorage(text) {
            let filePath = this._getCacheFilePath();

            try {
                let file = Gio.File.new_for_path(filePath);
                let textBytes = new TextEncoder().encode(text);
                file.replace_contents_bytes_async(
                    GLib.Bytes.new(textBytes),
                    null,
                    false,
                    Gio.FileCreateFlags.NONE,
                    null,
                    (src, res) => {
                        try {
                            src.replace_contents_finish(res);
                        } catch (e) {
                            console.error('Failed to finish replace_contents_bytes_async', e);
                        }
                    }
                );
            } catch (e) {
                console.error('Failed to store note in cache', e);
            }
        }

        _loadNoteFromStorage() {
            let filePath = this._getCacheFilePath();

            try {
                let file = Gio.File.new_for_path(filePath);
                file.load_contents_async(null, (src, res) => {
                    try {
                        let [success, content] = src.load_contents_finish(res);
                        if (success && content) {
                            let text = new TextDecoder().decode(content).trim();
                            if (text !== '') {
                                this._noteText = text;
                                this._entry.set_text(this._noteText);
                            } else {
                                this._noteText = '';
                                this._entry.set_text(_('Enter your note'));
                            }
                        } else {
                            this._noteText = '';
                            this._entry.set_text(_('Enter your note'));
                        }
                    } catch (e) {
                        this._noteText = '';
                        this._entry.set_text(_('Enter your note'));
                    }
                });
            } catch (e) {
                console.error('Failed to load note from cache', e);
            }
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

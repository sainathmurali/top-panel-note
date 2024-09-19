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
                text: _('Enter your note'),
                reactive: true,
            });
            this._entry.set_color(new Clutter.Color({ red: 255, green: 255, blue: 255, alpha: 255 }));

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
            this._scrollView.add_child(layout);  // Use add_child instead of add_actor

            // Create a PopupMenuItem and add the scroll view
            this._noteMenuItem = new PopupMenu.PopupMenuItem('');
            this._noteMenuItem.actor.add_child(this._scrollView);
            this.menu.addMenuItem(this._noteMenuItem);

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

            this._entry.connect('key-press-event', (actor, event) => {
                if (event.keyval === Clutter.KEY_Return && !(event.get_state() & Clutter.ModifierType.SHIFT_MASK)) {
                    let text = this._entry.get_text();
                    this.setNoteText(text);
                    return Clutter.EVENT_STOP;
                }
                return Clutter.EVENT_PROPAGATE;
            });

            // Set maximum panel size to 30% of screen width and height
            //this._setMaximumSize();

            // Load existing note from storage
            this._loadNoteFromStorage();
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
                let outputStream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
                
                let textBytes = new TextEncoder().encode(text);
                outputStream.write_all(textBytes, null);
                outputStream.close(null);
                //log("Note successfully stored in cache: " + text);
            } catch (e) {
                //logError(e, 'Failed to store note in cache');
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
                        //log("Note successfully loaded from cache: " + text);
                    } else {
                        //log("Failed to load contents from cache file");
                    }
                } else {
                    this._noteText = '';
                    this._entry.set_text(_('Enter your note'));
                    //log("No cache file found, initializing empty note.");
                }
            } catch (e) {
                //logError(e, 'Failed to load note from cache');
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

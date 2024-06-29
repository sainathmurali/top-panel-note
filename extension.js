import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

const cacheFilePath = `${GLib.get_user_cache_dir()}/top_panel_note_cache.txt`;

const TopPanelNote = GObject.registerClass(
    class TopPanelNote extends PanelMenu.Button {
        _init() {
            super._init(0.0, null, false);

            this._icon = new St.Icon({
                icon_name: 'x-office-document-template', // Change icon to a note symbol
                style_class: 'system-status-icon',
                x_expand: false, // Prevent icon from expanding horizontally
                y_expand: false, // Prevent icon from expanding vertically
                x_align: Clutter.ActorAlign.CENTER, // Center align horizontally
                y_align: Clutter.ActorAlign.CENTER, // Center align vertically
                style: 'padding: 2px;', // Adjust padding as needed
            });

            this.add_child(this._icon);

            this._noteText = ''; // Variable to store the note text

            this._noteMenuItem = new PopupMenu.PopupMenuItem('');
            this.menu.addMenuItem(this._noteMenuItem);

            this._entry = new St.Entry({
                hint_text: _('Enter your note'),
                track_hover: true,
                can_focus: true,
                style_class: 'top-panel-note-entry'
            });

            this._entry.clutter_text.connect('activate', () => {
                let text = this._entry.get_text();
                this.setNoteText(text);
                this._entry.set_text('');
            });

            this._clearButton = new St.Button({
                child: new St.Icon({ icon_name: 'edit-delete-symbolic', style_class: 'popup-menu-icon' }),
                style_class: 'panel-menu-button',
                reactive: true,
                can_focus: true
            });

            this._clearButton.connect('clicked', () => {
                this.setNoteText('');
                this._entry.set_text('');
                this._clearStorage();
            });

            this._loadNoteFromStorage(); // Load note from storage initially
            this.updateUI(); // Update UI based on loaded note
        }

        setNoteText(text) {
            this._noteText = text;
            this.updateUI();
            this._storeNoteInStorage(text);
        }

        updateUI() {
            if (this._noteText) {
                // Show clear button and set note text
                this._noteMenuItem.actor.remove_all_children();
                this._noteMenuItem.actor.add_child(new St.Label({ text: this._noteText }));
                this._noteMenuItem.actor.add_child(this._clearButton);
            } else {
                // Show input box
                this._noteMenuItem.actor.remove_all_children();
                this._noteMenuItem.actor.add_child(this._entry);
            }
        }

        _storeNoteInStorage(text) {
            let file = Gio.File.new_for_path(cacheFilePath);
            let outputStream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
            outputStream.write_all(text + '\n', null);
            outputStream.close(null);
        }

        _loadNoteFromStorage() {
            let file = Gio.File.new_for_path(cacheFilePath);
            if (file.query_exists(null)) {
                file.load_contents_async(null, (file, res) => {
                    try {
                        let [, contents] = file.load_contents_finish(res);
                        let noteText = contents.toString().trim();
                        if (noteText) {
                            this._noteText = noteText;
                            this.updateUI();
                        }
                    } catch (e) {
                        logError(e);
                    }
                });
            }
        }

        _clearStorage() {
            let file = Gio.File.new_for_path(cacheFilePath);
            if (file.query_exists(null)) {
                file.delete(null);
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

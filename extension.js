import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as St from 'gi://St';
import Soup from 'gi://Soup?version=3.0';
import * as Gio from 'gi://Gio';
import * as GLib from 'gi://GLib';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

let prayerIndicator;
let iconChanger;
let currentCityCode = '9541';  // Default city - İstanbul
let cities = {
    "İstanbul": "9541",
    "Ankara": "9206",
    "New York": "8869",
};
let prayerTimes = {};
let icons = ['mosque_whi.png', 'mosque_yel.png'];
let currentIconIndex = 0;
let timeCheckInterval;
let _settings;
//let homeDir = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_HOME);  // Kullanıcı ana dizini
//let homeDir = GLib.get_home_dir();  // Eski yöntem geri döndürüldü
let homeDir = GLib.getenv("HOME");  // Alternatif olarak HOME ortam değişkeni kullanılır


let soundFile = `${homeDir}/.local/share/gnome-shell/extensions/last_call@faymaz/sounds/call.mp3`;

const PRAYER_TIME_URL = 'https://namazvakitleri.diyanet.gov.tr/en-US/';

function initTranslations(domain) {
    let localeDir = `${homeDir}/.local/share/gnome-shell/extensions/last_call@faymaz/locale`;
    Gettext.bindtextdomain(domain, localeDir);
    Gettext.textdomain(domain);
}

function fetchPrayerTimes() {
    let session = new Soup.SessionAsync();
    let url = `${PRAYER_TIME_URL}${currentCityCode}`;

    let message = Soup.Message.new('GET', url);
    session.queue_message(message, (session, response) => {
        if (response.status_code !== 200) {
            log(_("Failed to fetch prayer times."));
            return;
        }

        let html = response.response_body.data;
        parsePrayerTimes(html);
    });
}

function parsePrayerTimes(html) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');

    let timeElements = doc.querySelectorAll('#today-pray-times-row .tpt-time');
    let prayerNames = ['Fajr', 'Sun', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    timeElements.forEach((el, index) => {
        prayerTimes[prayerNames[index]] = el.textContent;
    });

    checkNextPrayer();
}

function checkNextPrayer() {
    let now = new Date();
    let nextPrayerTime;
    let nextPrayerName;

    for (let prayer in prayerTimes) {
        let [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
        let prayerTime = new Date();
        prayerTime.setHours(hours);
        prayerTime.setMinutes(minutes);

        if (prayerTime > now) {
            nextPrayerTime = prayerTime;
            nextPrayerName = prayer;
            break;
        }
    }

    if (nextPrayerTime) {
        let timeRemaining = nextPrayerTime - now;
        log(`${_("Next prayer")} (${nextPrayerName}) ${_("is in")} ${(timeRemaining / 60000).toFixed(2)} ${_("minutes")}`);

        if (timeRemaining <= 15 * 60 * 1000) {
            playSound();
        }

        timeCheckInterval = setTimeout(checkNextPrayer, timeRemaining % 60000);
    }
}

function playSound() {
    let sound = Gio.File.new_for_path(soundFile);
    let player = new imports.gi.Gst.Pipeline.new('player');
    let playbin = player.get_by_name('playbin');
    playbin.set_property('uri', 'file://' + sound.get_path());
    player.set_state(imports.gi.Gst.State.PLAYING);
}

function updateIcon() {
    currentIconIndex = (currentIconIndex + 1) % icons.length;
    prayerIndicator.set_gicon(Gio.icon_new_for_string(icons[currentIconIndex]));

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, updateIcon);
}

function createCitySelectionMenu() {
    let cityMenuButton = new PanelMenu.Button(0.0, _("City Selection"), false);
    let menuIcon = new St.Icon({ icon_name: 'system-run-symbolic', style_class: 'system-status-icon' });
    cityMenuButton.add_child(menuIcon);

    for (let city in cities) {
        let cityItem = new PopupMenu.PopupMenuItem(city);
        cityItem.connect('activate', () => {
            currentCityCode = cities[city];
            fetchPrayerTimes();
        });
        cityMenuButton.menu.addMenuItem(cityItem);
    }

    Main.panel.addToStatusArea('cityMenuButton', cityMenuButton);
}

function init() {
    _settings = new Gio.Settings({ schema: 'org.gnome.shell.extensions.last_call' });
    initTranslations('lastcall');
    prayerIndicator = new St.Icon({
        style_class: 'system-status-icon',
        gicon: Gio.icon_new_for_string(icons[0])
    });

    createCitySelectionMenu();
    fetchPrayerTimes();
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(prayerIndicator, 0);
    iconChanger = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, updateIcon);
    timeCheckInterval = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, checkNextPrayer);
}

function disable() {
    Main.panel._rightBox.remove_child(prayerIndicator);
    if (iconChanger) GLib.source_remove(iconChanger);
    if (timeCheckInterval) GLib.source_remove(timeCheckInterval);
}

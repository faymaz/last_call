import Soup from 'gi://Soup?version=3.0';
import Gio from 'gi://Gio';
import St from 'gi://St';

import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
//import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as GLib from 'gi://GLib';




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
let homeDir = GLib.getenv("HOME");  // Alternatif olarak HOME ortam değişkeni kullanılır

let soundFile = `${homeDir}/.local/share/gnome-shell/extensions/last_call@faymaz/sounds/call.mp3`;

const PRAYER_TIME_URL = 'https://namazvakitleri.diyanet.gov.tr/en-US/';

function initTranslations(domain) {
    let localeDir = `${homeDir}/.local/share/gnome-shell/extensions/last_call@faymaz/locale`;
    Gettext.bindtextdomain(domain, localeDir);
    Gettext.textdomain(domain);
    log(`Translations initialized with localeDir: ${localeDir}`);
}

function fetchPrayerTimes() {
    log("Fetching prayer times...");
    let session = new Soup.SessionAsync();
    let url = `${PRAYER_TIME_URL}${currentCityCode}`;
    log(`Requesting data from URL: ${url}`);

    let message = Soup.Message.new('GET', url);
    session.queue_message(message, (session, response) => {
        if (response.status_code !== 200) {
            log(`Failed to fetch prayer times. Status Code: ${response.status_code}`);
            return;
        }

        let html = response.response_body.data;
        log("Prayer times data fetched successfully.");
        parsePrayerTimes(html);
    });
}

function parsePrayerTimes(html) {
    log("Parsing prayer times...");
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');

    let timeElements = doc.querySelectorAll('#today-pray-times-row .tpt-time');
    let prayerNames = ['Fajr', 'Sun', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    if (timeElements.length === 0) {
        log("No prayer times found in the HTML data.");
        return;
    }

    timeElements.forEach((el, index) => {
        prayerTimes[prayerNames[index]] = el.textContent;
        log(`Prayer time for ${prayerNames[index]}: ${el.textContent}`);
    });

    checkNextPrayer();
}

function checkNextPrayer() {
    log("Checking for the next prayer time...");
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
        log(`Next prayer (${nextPrayerName}) is in ${(timeRemaining / 60000).toFixed(2)} minutes`);

        if (timeRemaining <= 15 * 60 * 1000) {
            playSound();
        }

        timeCheckInterval = setTimeout(checkNextPrayer, timeRemaining % 60000);
    } else {
        log("No upcoming prayers found.");
    }
}

function playSound() {
    log("Playing sound for next prayer...");
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
            log(`City selected: ${city}`);
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

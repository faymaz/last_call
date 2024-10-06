
# Last Call - Prayer Times based on Diyanet's schedule GNOME Shell Extension


**Last Call** is a GNOME Shell extension that provides prayer times for various cities and alerts you with a sound notification 15 minutes before the next prayer time. The extension allows users to dynamically select their city and displays the remaining time until the next prayer directly on the GNOME top panel. The icon in the panel changes periodically, and sound notifications are triggered at the appropriate time.

## Features

- Displays prayer times for different cities (e.g., Irvine, New York, New Jersey, Frankfurt, Istanbul, Ankara).
- Notifies users with a sound (call.mp3) 15 minutes before the next prayer time.
- Allows users to switch between different cities using a menu.
- The top panel icon changes every two seconds to provide a dynamic appearance.
- Supports multiple languages (currently English and Turkish).

## Installation

### Requirements

- GNOME Shell (compatible with versions 40, 41, 42, 43)
- Gettext for localization
- GStreamer for playing audio notifications

### Steps to Install Locally

1. Clone or download this repository to your local machine:

    ```bash
    git clone https://github.com/yourusername/last-call.git
    ```

2. Create a directory for the extension in your local GNOME Shell extensions directory:

    ```bash
    mkdir -p ~/.local/share/gnome-shell/extensions/last-call@yourusername
    ```

3. Copy all the files from the cloned repository to the newly created directory:

    ```bash
    cp -r last-call/* ~/.local/share/gnome-shell/extensions/last-call@yourusername/
    ```

4. Install `gettext` and `gstreamer` if you haven't already:

    ```bash
    sudo apt install gettext gstreamer1.0-plugins-base
    ```

5. Compile the translation files if necessary (optional, if you've added new translations):

    ```bash
    msgfmt -o locale/en/LC_MESSAGES/lastcall.mo locale/en/LC_MESSAGES/lastcall.po
    msgfmt -o locale/tr/LC_MESSAGES/lastcall.mo locale/tr/LC_MESSAGES/lastcall.po
    ```

6. Restart GNOME Shell by pressing `Alt + F2`, typing `r`, and pressing `Enter`, or log out and log back in.

7. Enable the extension using the GNOME Tweaks tool or the Extensions application.

## Usage

Once the extension is installed and activated, you will see an icon in the GNOME top panel. By default, the extension will fetch prayer times for the city of Mörfelden-Walldorf. You can change the city by clicking on the panel icon and selecting a different city from the dropdown menu.

The panel icon will change every two seconds to give a dynamic appearance. The remaining time until the next prayer will be calculated and, when 15 minutes remain, the `call.mp3` sound file will play as a notification.

### Adding or Modifying Cities

If you want to add more cities, you can modify the `cities` object in the `extension.js` file. For example:

```javascript
let cities = {
    "New York": "8869",
    "London": "10713"  // Add new city like this
};
```

## Customization

- **Icons**: The extension uses two icons (`mosque_whi.png` and `mosque_yel.png`) located in the `icons/` directory. You can customize these icons or replace them with your own.
- **Sound Notification**: The sound file used for the notification is `call.mp3`, located in the `sounds/` directory. You can replace this file with your own sound by keeping the file name `call.mp3`.

## Contributing

Feel free to fork the repository and submit pull requests with your changes. Any contributions, including bug fixes, translations, or new features, are welcome!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Credits

Developed by [faymaz](https://github.com/faymaz).

Special thanks to the Diyanet prayer times service for providing the data.



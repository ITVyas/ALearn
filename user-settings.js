const path = require('node:path');
const fs = require('node:fs');

const UserSettings = ((path) => {
    return {
        readSettings: () => {
            const jsonString = fs.readFileSync(path, 'utf8');
            return JSON.parse(jsonString);
        },
        setSetting: (key, value) => {
            const jsonString = fs.readFileSync(path, 'utf8');
            const settings = JSON.parse(jsonString);
            settings[key] = value;
            fs.writeFileSync(path, JSON.stringify(settings));
        }
    };
})(path.join(__dirname, 'user-settings.json'));


module.exports = UserSettings;
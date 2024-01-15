const fs = require('fs');
const path = require('path');
const assert = require('assert');

describe('Translation Tests', function() {
    it('Check if all strings used by t() are present in en.json', function() {
        const appDirectory = './app';
        const enTranslationsPath = './translations/locales/en.json';

        // Read en.json file
        const enTranslations = JSON.parse(fs.readFileSync(enTranslationsPath, 'utf8'));

        // Get all JavaScript files in the app directory
        const jsFiles = getAllFiles(appDirectory, '.js');
        const htmlFiles = getAllFiles(appDirectory, '.html');
        const allFiles = jsFiles.concat(htmlFiles);

        // Array to store missing translations
        const missingTranslations = [];

        // Loop through each JavaScript file
        allFiles.forEach(file => {
            const fileContent = fs.readFileSync(file, 'utf8');
            const regex = /(?<![a-zA-Z])t\(['"]([^'"]+)['"]/g;
            let match;

            // Find all strings used by t() function in the file
            while ((match = regex.exec(fileContent)) !== null) {
                const translationKey = match[1];

                // Check if the translation key is present in en.json
                const translationKeys = translationKey.split('.');
                let currentObj = enTranslations;
                let isMissingTranslation = false;

                for (let i = 0; i < translationKeys.length; i++) {
                    const key = translationKeys[i];

                    if (!currentObj.hasOwnProperty(key)) {
                        isMissingTranslation = true;
                        break;
                    }

                    currentObj = currentObj[key];
                }

                if (isMissingTranslation) {
                    missingTranslations.push(translationKey);
                }
            }
        });

        // Throw an error if there are missing translations
        assert.deepStrictEqual(missingTranslations, [], `Missing translations: ${missingTranslations.join(', ')}`);
    });
});

// Helper function to get all files with a specific extension in a directory
function getAllFiles(directory, extension) {
    let files = [];

    fs.readdirSync(directory).forEach(file => {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            files = files.concat(getAllFiles(filePath, extension));
        } else if (path.extname(file) === extension) {
            files.push(filePath);
        }
    });

    return files;
}

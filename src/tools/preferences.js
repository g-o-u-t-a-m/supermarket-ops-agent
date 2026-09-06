const db = require("../db/database");

// --------------------------------------------------
// SET PREFERENCE
// --------------------------------------------------

function setPreference(key, value) {

    if (!key || !key.trim()) {
        return {
            success: false,
            error: "Preference key is required"
        };
    }

    if (value === undefined || value === null) {
        return {
            success: false,
            error: "Preference value is required"
        };
    }

    db.prepare(`
        INSERT INTO owner_preferences (
            preference_key,
            preference_value,
            updated_at
        )
        VALUES (?, ?, CURRENT_TIMESTAMP)

        ON CONFLICT(preference_key)
        DO UPDATE SET
            preference_value = excluded.preference_value,
            updated_at = CURRENT_TIMESTAMP
    `).run(
        key.trim(),
        String(value)
    );

    return {
        success: true,
        key: key.trim(),
        value: String(value)
    };
}


// --------------------------------------------------
// GET PREFERENCE
// --------------------------------------------------

function getPreference(key) {

    const preference = db.prepare(`
        SELECT
            preference_key,
            preference_value
        FROM owner_preferences
        WHERE preference_key = ?
    `).get(key);

    if (!preference) {
        return {
            success: true,
            found: false,
            value: null
        };
    }

    return {
        success: true,
        found: true,
        key: preference.preference_key,
        value: preference.preference_value
    };
}


// --------------------------------------------------
// GET ALL PREFERENCES
// --------------------------------------------------

function getAllPreferences() {

    const preferences = db.prepare(`
        SELECT
            preference_key,
            preference_value
        FROM owner_preferences
        ORDER BY preference_key
    `).all();

    return {
        success: true,
        preferences
    };
}


// --------------------------------------------------
// DELETE PREFERENCE
// --------------------------------------------------

function deletePreference(key) {

    const result = db.prepare(`
        DELETE FROM owner_preferences
        WHERE preference_key = ?
    `).run(key);

    return {
        success: true,
        deleted: result.changes > 0
    };
}


module.exports = {
    setPreference,
    getPreference,
    getAllPreferences,
    deletePreference
};
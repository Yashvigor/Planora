const axios = require('axios');

/**
 * Converts a physical address into GPS coordinates using OpenStreetMap's Nominatim API.
 * @param {string} address - Full address string (e.g., "123 Main St, City, State, Zip")
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
const geocodeAddress = async (address) => {
    if (!address) return null;

    try {
        // Nominatim requires a User-Agent to identify the application
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'Planora-Construction-App/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon)
            };
        }

        console.warn(`Geocoding failed for address: ${address}`);
        return null;
    } catch (err) {
        console.error('Geocoding API error:', err.message);
        return null;
    }
};

module.exports = { geocodeAddress };

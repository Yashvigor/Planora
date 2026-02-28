const dns = require('dns');
const { Resolver } = require('dns').promises;

const resolver = new Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

const originalLookup = dns.lookup;

/**
 * 🛠️ DNS WORKAROUND: Global Resolver for Neon DB hostnames.
 * Intercepts 'neon.tech' lookups to bypass ISP-level DNS blocking.
 */
const setupDNSOverride = () => {
    dns.lookup = (hostname, options, callback) => {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        const cleanHost = (typeof hostname === 'string') ? hostname.trim().replace(/[\n\r\t]/g, '') : hostname;

        if (cleanHost && cleanHost.includes('neon.tech')) {
            const resolveRecursive = async (host) => {
                try {
                    const addresses = await resolver.resolve4(host);
                    if (addresses && addresses.length > 0) return addresses[0];
                } catch (e) {
                    try {
                        const cnames = await resolver.resolveCname(host);
                        if (cnames && cnames.length > 0) return await resolveRecursive(cnames[0]);
                    } catch (e2) { throw e2; }
                }
                throw new Error('DNS failure');
            };

            resolveRecursive(cleanHost)
                .then(ip => callback(null, ip, 4))
                .catch(() => originalLookup(cleanHost, options, callback));
        } else {
            return originalLookup(hostname, options, callback);
        }
    };
};

module.exports = { setupDNSOverride };

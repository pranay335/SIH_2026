const xml2js = require('xml2js');
const fs = require('fs');

class AadhaarService {
    /**
     * Parse Aadhaar XML and extract data
     * @param {string} filePath - Path to the uploaded XML file
     * @param {string} password - Zip password (if applicable, though often handled before XML)
     */
    async parseAadhaarXML(filePath) {
        try {
            const xmlData = fs.readFileSync(filePath, 'utf-8');
            const parser = new xml2js.Parser({
                explicitArray: false,
                tagNameProcessors: [xml2js.processors.stripPrefix, xml2js.processors.firstCharLowerCase]
            });
            const result = await parser.parseStringPromise(xmlData);

            // Find the root - common ones are OfflinePaperlessKyc or just Kyc
            // After stripPrefix and firstCharLowerCase, "OfflinePaperlessKyc" becomes "offlinePaperlessKyc"
            const kycData = result.offlinePaperlessKyc || result.kycData || result.kyc;

            if (!kycData) {
                console.error('Available keys in XML:', Object.keys(result));
                throw new Error('Aadhaar XML structure mismatch: Could not find OfflinePaperlessKyc root.');
            }

            const uidData = kycData.uidData || kycData.uIDData || kycData.uid;
            if (!uidData) {
                throw new Error('Aadhaar XML structure mismatch: Could not find UidData tag.');
            }

            const poi = uidData.poi || uidData.pOI;
            const poa = uidData.poa || uidData.pOA;

            if (!poi || !poa) {
                throw new Error(`Aadhaar XML structure mismatch: Missing ${!poi ? 'Poi' : 'Poa'} info.`);
            }

            const getAttr = (obj, attr) => (obj.$ ? obj.$[attr] : obj[attr]) || '';

            return {
                name: getAttr(poi, 'name'),
                gender: getAttr(poi, 'gender'),
                dob: getAttr(poi, 'dob'),
                address: {
                    house: getAttr(poa, 'house'),
                    street: getAttr(poa, 'street'),
                    loc: getAttr(poa, 'loc'),
                    vtc: getAttr(poa, 'vtc'),
                    dist: getAttr(poa, 'dist'),
                    state: getAttr(poa, 'state'),
                    pc: getAttr(poa, 'pc'),
                    fullAddress: `${getAttr(poa, 'house')}, ${getAttr(poa, 'street')}, ${getAttr(poa, 'loc')}, ${getAttr(poa, 'vtc')}, ${getAttr(poa, 'dist')}, ${getAttr(poa, 'state')} - ${getAttr(poa, 'pc')}`
                }
            };
        } catch (error) {
            console.error('Aadhaar XML Parsing Error Details:', error.message);
            throw error; // Rethrow to be caught by controller
        } finally {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    /**
     * Validate if the Aadhaar address matches the selected municipality
     * @param {Object} aadhaarData - Extracted Aadhaar data
     * @param {string} selectedMunicipalityCode - Municipality code provided during registration
     */
    validateMunicipality(aadhaarData, selectedMunicipalityCode) {
        const city = (aadhaarData.address.vtc || '').toLowerCase();
        const district = (aadhaarData.address.dist || '').toLowerCase();

        const mapping = {
            'mumbai': 'BMC',
            'suburban mumbai': 'BMC',
            'thane': 'TMC',
            'kalyan': 'KDMC',
            'dombivli': 'KDMC',
            'pune': 'PMC',
            'navi mumbai': 'NMMC',
            'vasai': 'VVMC',
            'virar': 'VVMC'
        };

        // Check mapping
        const detectedCode = mapping[city] || mapping[district];

        if (!detectedCode) {
            // If not in mapping, we might need a more fuzzy match or allow
            return {
                isValid: false,
                message: `Your location (${city || district}) is not supported in our current system.`
            };
        }

        if (detectedCode !== selectedMunicipalityCode) {
            return {
                isValid: false,
                message: `Jurisdiction mismatch. Your Aadhaar address indicates ${detectedCode}, but you selected ${selectedMunicipalityCode}.`
            };
        }

        return { isValid: true };
    }
}

module.exports = new AadhaarService();

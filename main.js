// modules required for this script
const fs = require('fs');
const crypto = require('crypto');
const extract = require('png-chunks-extract');
const encode = require('png-chunks-encode');
const prompts = require('prompts');
const path = require('path');
// clipboardy exports as default in the installed package; handle both CJS/ESM shapes
const _clipboardy = require('clipboardy');
const clipboardy = _clipboardy && _clipboardy.default ? _clipboardy.default : _clipboardy;

/*
    .png Encryption Zone - Start
*/
function encryptImage() {
    // set a empty pass string to store the password
    let pass = '';
    // create a random number generator
    let rng = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // set a variable of symbols
    const specialChar = `!@#$%^&*()-_=+[{]};:'",.<>/?`;
    const key = crypto.randomBytes(32); // Generate a random 256-bit key
    const iv = crypto.randomBytes(16); // Generate a random 128-bit initialization vector
    // create encrypt function that converts text to utf8 hex using the aes-256-cbc algorithm
    function encrypt(text) {
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    // read the audio file and generate a random base64 password from it
    const audioPath = path.join(__dirname, 'assets', 'audio.wav');
    fs.readFile(audioPath, (err, data) => {
        if (err) {
            console.error('Error reading the audio file:', err);
            return;
        }
        // convert the audio data to a base64 string
        const base64Audio = data.toString('base64');
        // iterate through the base64 string
        for (let i = 0; i < rng(8, 24); i++) {
            // add a random character from the base64 string to the password
            pass += base64Audio[rng(0, base64Audio.length - 1)];
        }
        // check if the generated password includes at least one special character.
        if (!/[!@#$%^&*()\-_=+\[\]{}\\|;:'",.<>\/?]/.test(pass)) {
            // if it does not include a special character, replace one of the characters with a special character.
            pass = pass.slice(0, rng(0, pass.length - 1)) + specialChar[rng(0, specialChar.length - 1)] + pass.slice(rng(0, pass.length - 1));
        }
        // check if the pass variable includes at least one uppercase letter, one lowercase letter and one.
        if (!/[A-Z]/.test(pass)) {
            pass = pass.slice(0, rng(0, pass.length - 1)) + String.fromCharCode(rng(65, 90)) + pass.slice(rng(0, pass.length - 1));
        } else if (!/[a-z]/.test(pass)) {
            pass = pass.slice(0, rng(0, pass.length - 1)) + String.fromCharCode(rng(97, 122)) + pass.slice(rng(0, pass.length - 1));
        } else if (!/[0-9]/.test(pass)) {
            pass = pass.slice(0, rng(0, pass.length - 1)) + String.fromCharCode(rng(48, 57)) + pass.slice(rng(0, pass.length - 1));
        }
        // ensure that the pass variable is at least 8 characters long
        if (pass.length < 8) {
            pass += crypto.randomBytes(8 - pass.length).toString('base64').slice(0, 8 - pass.length);
        }
        const encryptedPass = encrypt(pass);
        console.log('Generated Password:', pass);
        console.log('Encrypted Password:', encryptedPass);
    // read the .png file (use __dirname-based path so it's the same file used by check/launch)
    const pngBuffer = fs.readFileSync(file);
        // embed encrypted password into a tEXt chunk with keyword 'passWord'
        // PNG chunks must have 4-letter names; using a tEXt chunk keeps the data visible
        const chunks = extract(pngBuffer);
            // also store the key and iv (hex) so the file can be decrypted later
            const keyHex = key.toString('hex');
            const ivHex = iv.toString('hex');
            const passText = Buffer.from('passWord\0' + encryptedPass, 'utf8');
            const keyText = Buffer.from('key\0' + keyHex, 'utf8');
            const ivText = Buffer.from('iv\0' + ivHex, 'utf8');
            const passChunk = { name: 'tEXt', data: passText };
            const keyChunk = { name: 'tEXt', data: keyText };
            const ivChunk = { name: 'tEXt', data: ivText };
            // insert the text chunks before the final IEND chunk
            const iendIndex = chunks.findIndex(c => c.name === 'IEND');
            const newChunks = [
                ...chunks.slice(0, iendIndex),
                keyChunk,
                ivChunk,
                passChunk,
                ...chunks.slice(iendIndex)
            ];
            const updatedBuffer = encode(newChunks);
        // write the updated buffer to the .png file
        fs.writeFileSync(file, updatedBuffer);
            console.log('Encrypted password, key and iv have been embedded into the PNG file as tEXt chunks (keywords: "passWord","key","iv").');
    });
}
/*
    .png Encryption Zone - End
*/

/*
    .png Check Zone - Start
*/
// Assets directory and PNG file (use __dirname so paths work regardless of cwd)
const assetsDir = path.join(__dirname, 'assets');
const file = path.join(assetsDir, 'album.png');
function check() {
    try {
        const buf = fs.readFileSync(file);
        const chunks = extract(buf);
        // find all tEXt chunks and print their keyword and text
        const textChunks = chunks.filter(c => c.name === 'tEXt');
        if (textChunks.length === 0) {
            console.log('No tEXt chunks found in', file);
            process.exit(0);
        }
        for (const c of textChunks) {
            // tEXt chunk format: keyword (Latin-1) then 0x00 then text (Latin-1)
            const idx = c.data.indexOf(0);
            if (idx === -1) {
            console.log('Malformed tEXt chunk (no null separator)');
            continue;
        }
        let keywordBuf = c.data.slice(0, idx);
        let textBuf = c.data.slice(idx + 1);
        // Some tools or prior writes may store the bytes as comma-separated decimals
        // (e.g. "112,97,115,115,87,111,114,100"). Detect and decode that.
        const tryDecodeCommaList = (buf) => {
        const s = buf.toString('utf8').trim();
            if (/^[0-9]+(,[0-9]+)*$/.test(s)) {
            const nums = s.split(',').map(n => parseInt(n, 10));
            return Buffer.from(nums).toString('latin1');
            }
            return null;
        };
        let keyword = tryDecodeCommaList(keywordBuf) || keywordBuf.toString('latin1');
        let text = tryDecodeCommaList(textBuf) || textBuf.toString('utf8');
        console.log(`tEXt chunk — keyword: "${keyword}", text: ${text}`);
        }
    } catch (err) {
        console.error('Error reading PNG or extracting chunks:', err.message);
        process.exit(1);
    }
}
/*
.png Check Zone - End
*/

/* 
.png Launch Zone - Start
*/
function launch() {
    console.log('Launching PNG file and outputting decrypted password...');
    // implementation of launching PNG and decrypting password goes here
    const buffer = fs.readFileSync(file);
    const chunks = extract(buffer);
    // find tEXt chunks for key, iv and passWord
    const textChunks = chunks.filter(c => c.name === 'tEXt');
    // inspect text chunks and decode keywords/values
    let keyHex = null, ivHex = null, encryptedPass = null;
    // helper: decode comma-separated decimal lists (some tools store bytes that way)
    const tryDecodeCommaList = (buf) => {
        const s = buf.toString('utf8').trim();
        if (/^[0-9]+(,[0-9]+)*$/.test(s)) {
            const nums = s.split(',').map(n => parseInt(n, 10));
            return Buffer.from(nums).toString('latin1');
        }
        return null;
    };

    for (const c of textChunks) {
        // find null separator in the raw chunk buffer (more reliable)
        const splitIdx = c.data.indexOf(0);
        if (splitIdx === -1) continue;
        const keywordBuf = c.data.slice(0, splitIdx);
        const textBuf = c.data.slice(splitIdx + 1);
        const keyword = tryDecodeCommaList(keywordBuf) || keywordBuf.toString('latin1');
        const value = tryDecodeCommaList(textBuf) || textBuf.toString('utf8');
        if (keyword === 'key') keyHex = value.trim();
        if (keyword === 'iv') ivHex = value.trim();
        if (keyword === 'passWord') encryptedPass = value.trim();
    }
    if (!encryptedPass) {
        console.log('No embedded password found in PNG.');
        return;
    }
    if (!keyHex || !ivHex) {
        console.log('Missing key/iv in PNG; cannot decrypt. Embedded encrypted value:', encryptedPass);
        return;
    }
    try {
        const keyBuf = Buffer.from(keyHex, 'hex');
        const ivBuf = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf);
        let decrypted = decipher.update(encryptedPass, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('Decrypted Password:', decrypted);
        // copy to clipboard (async API)
        clipboardy.write(decrypted)
            .then(() => console.log('Decrypted password copied to clipboard.'))
            .catch(err => console.error('Failed to copy decrypted password to clipboard:', err.message));
    } catch (err) {
        console.error('Failed to decrypt embedded password:', err.message);
    }
}
/*
.png Launch Zone - End
*/

console.log(
    `
Y88b         /      e      Y88b      / 888~~        e88~~\        e      ~~~888~~~ 888~~  
 Y88b       /      d8b      Y88b    /  888___      d888         d8b        888    888___ 
  Y88b  e  /      /Y88b      Y88b  /   888    ____ 8888 __     /Y88b       888    888    
   Y88bd8b/      /  Y88b      Y888/    888         8888   |   /  Y88b      888    888    
    Y88Y8Y      /____Y88b      Y8/     888         Y888   |  /____Y88b     888    888    
     Y  Y      /      Y88b      Y      888___       "88__/  /      Y88b    888    888___ 
                                                                                         `
);

let x;
let ifState = () => {
    // x is a string coming from prompts (mainMenu). Handle the string values.
    switch (x) {
        case 'check':
            check();
            break;
        case 'encrypt':
            encryptImage();
            break;
        case 'launch':
            launch();
            break;
        case 'exit':
        default:
            process.exit();
    }
}

let menu = () => {
        (async () => {
        const response = await prompts({
            type: 'select',
            name: 'mainMenu',
            message: 'Select an option:',
            choices: [
                { title: 'Check .png', value: 'check', description: 'Check for embedded encrypted password in PNG' },
                { title: 'Encrypt .png', value: 'encrypt', description: 'Embed encrypted password into PNG' },
                { title: 'Launch .png', value: 'launch', description: 'Open PNG file and outputs the decrypted password' },
                { title: 'Exit', value: 'exit' }
            ],
            initial: 0
        });
        // prompts returns an object with the selected value at the property named by `name` (mainMenu)
        console.log(response);
        x = response.mainMenu;
        ifState();
    })();
}

// If ACTION env var is set, run that action non-interactively (useful for tests / CI).
if (process.env.ACTION) {
    const act = process.env.ACTION;
    console.log('ACTION env var detected:', act);
    x = act;
    ifState();
} else {
    menu();
}
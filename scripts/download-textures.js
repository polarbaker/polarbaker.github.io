import https from 'https';
import fs from 'fs';
import path from 'path';

const textures = {
    'earth_daymap.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'earth_normal.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'earth_specular.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
};

const downloadTexture = (filename, url) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(process.cwd(), 'public', 'textures', filename);
        const file = fs.createWriteStream(filePath);

        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
};

const downloadAllTextures = async () => {
    try {
        const downloads = Object.entries(textures).map(([filename, url]) => 
            downloadTexture(filename, url)
        );
        await Promise.all(downloads);
        console.log('All textures downloaded successfully!');
    } catch (error) {
        console.error('Error downloading textures:', error);
        process.exit(1);
    }
};

downloadAllTextures(); 
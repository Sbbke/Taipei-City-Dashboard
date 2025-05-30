import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const librarys = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../../public/data/nt_library_20250529.json'), 'utf-8')
);

const defaultMapData = {
	"type": "FeatureCollection",
	"name": "library_NEW_TPE",
	"features": []
}

const convertlibrary = () => {
	const filename = "library_new_tpe";
	const mapData = { ...defaultMapData };
	librarys.forEach(library => {
		const { x, y, ...restProps } = library;

		mapData.features.push({
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [x, y]
			},
			"properties": {
				...restProps
			}
		})
	})

	fs.writeFileSync(path.resolve(__dirname, `../../public/mapData/${filename}.geojson`), JSON.stringify(mapData));
}

convertlibrary();
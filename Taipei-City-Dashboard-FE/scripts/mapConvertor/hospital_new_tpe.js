import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hospitals = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../../public/data/hospital_20250529.json'), 'utf-8')
);

const defaultMapData = {
	"type": "FeatureCollection",
	"name": "Hospital_NEW_TPE",
	"features": []
}

const convertHospital = () => {
	const filename = "hospital_new_tpe";
	const mapData = { ...defaultMapData };
	hospitals.forEach(hospital => {
		const { x, y, ...restProps } = hospital;

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

convertHospital();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rentals = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../../public/data/rental_20250529.json'), 'utf-8')
);

const defaultMapData = {
	"type": "FeatureCollection",
	"name": "Rental_TPE",
	"features": []
}

const convertRental = () => {
	const filename = "rental";
	const mapData = { ...defaultMapData };
	rentals.forEach(rental => {
		const { x, y, ...restProps } = rental;

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

convertRental();
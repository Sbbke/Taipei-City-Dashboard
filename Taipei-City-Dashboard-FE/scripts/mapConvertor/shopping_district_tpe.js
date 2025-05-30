import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shoppings = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../../public/data/t_shopping_20250529.json'), 'utf-8')
);

const defaultMapData = {
	"type": "FeatureCollection",
	"name": "Shopping_District_TPE",
	"features": []
}

const convertShopping = () => {
	const filename = "shopping_district_tpe";
	const mapData = { ...defaultMapData };
	shoppings.forEach(shopping => {
		const { x, y, ...restProps } = shopping;

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

convertShopping();
const fs = require('fs');
// import data from '/Users/auousers/Downloads/datas_20250527_test.json';
const mapData = {
	"type": "FeatureCollection",
	"name": "Bike_Network_TPE",
	"crs": {
		"type": "name",
		"properties": {
			"name": "urn:ogc:def:crs:OGC:1.3:CRS84"
		}
	},
	"features": []
}

const sourceData = fs.readFileSync("/Users/auousers/Downloads/datas_20250527_test.json");
const data = JSON.parse(sourceData);

data.forEach(item => {
	const { x, y, ...restProps } = item;

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

fs.writeFileSync('./Taipei-City-Dashboard-FE/public/mapData/bear_bear.geojson', JSON.stringify(mapData));
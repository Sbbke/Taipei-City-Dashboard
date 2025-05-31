<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import mapboxgl from "mapbox-gl";
import bus from "../assets/map/bus.png";
import metro from "../assets/map/metro.png";
import triangle_green from "../assets/map/triangle_green.png";
import triangle_white from "../assets/map/triangle_white.png";
import bike_green from "../assets/map/bike_green.png";
import bike_orange from "../assets/map/bike_orange.png";
import bike_red from "../assets/map/bike_red.png";
import cross_bold from "../assets/map/cross_bold.png";
import cross_normal from "../assets/map/cross_normal.png";
import cctv from "../assets/map/cctv.png";
import hospital from "../assets/map/hospital.png";
import rental from "../assets/map/rental.png";
import library from "../assets/map/library.png";
import shopping_district from "../assets/map/shopping_district.png";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../store/authStore";
import { useMapStore } from "../../store/mapStore";
import { useDialogStore } from "../../store/dialogStore";
import AddCustomMarker from "../../components/dialogs/AddCustomMaker.vue";
import { circle, distance, midpoint } from "@turf/turf";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
const MAPBOXTOKEN = import.meta.env.VITE_MAPBOXTOKEN;

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const route = useRoute();
const mapStore = useMapStore();
const isCurrentPageMapView = computed(() => route.name === "mapview");
const searchText = ref("");

const props = defineProps([
	"chart_config",
	"series",
	"activeChart",
	"activeCity",
	"map_config",
	"map_filter",
	"map_filter_on",
]);
const emits = defineEmits([
	"filterByParam",
	"filterByLayer",
	"clearByParamFilter",
	"clearByLayerFilter",
	"fly",
	"setByLayer",
]);

const geocoder = new MapboxGeocoder({
	accessToken: mapboxgl.accessToken ?? MAPBOXTOKEN,
	mapboxgl: mapboxgl,
});
mapStore.map?.addControl(geocoder);

function returnIcon(name) {
	switch (name) {
		case "bus":
			return bus;
		case "metro":
			return metro;
		case "triangle_green":
			return triangle_green;
		case "triangle_white":
			return triangle_white;
		case "bike_green":
			return bike_green;
		case "bike_orange":
			return bike_orange;
		case "bike_red":
			return bike_red;
		case "cross_bold":
			return cross_bold;
		case "cross_normal":
			return cross_normal;
		case "cctv":
			return cctv;
		case "hospital":
			return hospital;
		case "rental":
			return rental;
		case "library":
			return library;
		case "shopping_district":
			return shopping_district;
		default:
			return "";
	}
}

const getLifeAreaData = () => {
	const center = [
		mapStore.personalMarkerMap["important"].lng,
		mapStore.personalMarkerMap["important"].lat,
	];
	// console.log("center",center)
	const area = circle(center, 2, {
		steps: 64,
		units: "kilometers",
	});
	console.log("area", area);
	return area;
};

const clearLifeArea = () => {
	mapStore.map.getSource("life-area")?.setData({
		type: "FeatureCollection",
		features: [],
	});
};

const drawLifeArea = () => {
	if (!mapStore.map.getSource("life-area")) {
		console.log("[init]", mapStore.map.getSource("life-area"));
		// 加入圖層
		mapStore.map.addSource("life-area", {
			type: "geojson",
			data: getLifeAreaData(),
		});

		mapStore.map.addLayer({
			id: "life-area-fill",
			type: "fill",
			source: "life-area",
			layout: {},
			paint: {
				"fill-color": "#0000ff",
				"fill-opacity": 0.3,
			},
		});

		mapStore.map.addLayer({
			id: "life-area-outline",
			type: "line",
			source: "life-area",
			layout: {},
			paint: {
				"line-color": "#0000ff",
				"line-width": 2,
			},
		});
	} else {
		console.log("[Refresh] life area");
		mapStore.map.getSource("life-area").setData(getLifeAreaData());
	}
};

const selectedIndexs = ref([]);

function handleDataSelection(index) {
	const idx = selectedIndexs.value.indexOf(index);
	if (idx === -1) {
		selectedIndexs.value.push(index);
	} else {
		selectedIndexs.value.splice(idx, 1);
	}

	const selectedNames = props.series
		.filter((item, i) => selectedIndexs.value.includes(i))
		.map((item) => item.name);

	emits("setByLayer", props.map_config, selectedNames);
	// console.log("setByLayer", props.map_config, selectedNames);
}

const onSearch = async () => {
	geocoder.query(searchText.value);
};

const drawDashedLine = (id, from, to) => {
	const lineData = {
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: [from, to],
		},
	};

	mapStore.map.addSource(`${id}-dashed-line`, {
		type: "geojson",
		data: lineData,
	});

	// 加入虛線圖層
	mapStore.map.addLayer({
		id: `${id}-dashed-line-layer`,
		type: "line",
		source: `${id}-dashed-line`,
		layout: {
			"line-cap": "round",
			"line-join": "round",
		},
		paint: {
			"line-color": "#ff0000",
			"line-width": 2,
			"line-dasharray": [2, 4], // 2px 線段, 4px 間隔
		},
	});
};

const drawDistanceLabel = (id, from, to) => {
	const dist = distance(from, to, { units: "kilometers" }).toFixed(2);

	// 計算中點，作為標籤的位置
	const mid = midpoint(from, to);

	mapStore.map.addSource(`${id}-distance-label`, {
		type: "geojson",
		data: {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: mid.geometry.coordinates,
					},
					properties: {
						label: `${dist} km`,
					},
				},
			],
		},
	});

	mapStore.map.addLayer({
		id: `${id}-distance-label-layer`,
		type: "symbol",
		source: `${id}-distance-label`,
		layout: {
			"text-field": ["get", "label"],
			"text-font": ["Open Sans Bold"],
			"text-size": 14,
			"text-offset": [0, -1],
			"text-anchor": "top",
		},
		paint: {
			"text-color": "#FFFFFF",
		},
	});
};

const drawDashedLinesFromCenter = () => {
	for (const [key, value] of Object.entries(mapStore.personalMarkerMap)) {
		// Ignore important center
		if (key === "important") continue;

		console.log("[drawDashedLinesFromCenter]", key);
		const from = [
			mapStore.personalMarkerMap["important"].lng,
			mapStore.personalMarkerMap["important"].lat,
		];
		const to = [value.lng, value.lat];
		drawDashedLine(key, from, to);
		drawDistanceLabel(key, from, to);
	}
};

onMounted(() => {
	if (!mapStore.map) return;

	console.log("[onMounted] personalMarkerMap", mapStore.personalMarkerMap);
	clearLifeArea();
	if (mapStore.personalMarkerMap["important"]) {
		drawLifeArea();
		drawDashedLinesFromCenter();
	}
});

watch(
	() => mapStore?.personalMarkerMap,
	() => {
		if (!mapStore.map) return;

		console.log("[watch] personalMarkerMap", mapStore.personalMarkerMap);
		clearLifeArea();
		if (mapStore.personalMarkerMap["important"]) {
			drawLifeArea();
			drawDashedLinesFromCenter();
		}
	}
);
</script>

<template>
	<template v-if="mapStore.map">
		<div
			v-if="authStore.user?.user_id && isCurrentPageMapView"
			class="fifteen-minute-life"
		>
			<div class="container">
				<input
					class="address-input"
					type="text"
					placeholder="搜尋想創建地標"
					@keydown.enter="onSearch"
					v-model="searchText"
				/>
			</div>
			<div class="container">
				<button
					v-if="mapStore.tempMarkerCoordinates"
					:disabled="!mapStore.tempMarkerCoordinates"
					class="address-button"
					@click="dialogStore.showDialog('addCustomMarker')"
				>
					建立個人臨時地標
				</button>
			</div>
		</div>
		<div class="maplegend">
			<div class="maplegend-legend">
				<button
					v-for="(item, index) in series"
					:key="item.name"
					:class="{
						'maplegend-legend-item': true,
						'maplegend-filter': map_filter_on && map_filter,
						'maplegend-selected':
							map_filter_on && selectedIndexs.includes(index),
					}"
					@click="handleDataSelection(index)"
				>
					<input
						type="checkbox"
						:checked="selectedIndexs.includes(index)"
						@click.stop
						readonly
					/>
					<!-- Show different icons for different map types -->
					<div
						v-if="item.type !== 'symbol'"
						:style="{
							backgroundColor: `${chart_config.color[index]}`,
							height: item.type === 'line' ? '0.4rem' : '1rem',
							borderRadius:
								item.type === 'circle' ? '50%' : '2px',
						}"
					/>
					<img v-else :src="returnIcon(item.icon)" />
					<!-- If there is a value attached, show the value -->
					<div v-if="item.value">
						<h5>{{ item.name }}</h5>
						<h6>{{ item.value }} {{ chart_config.unit }}</h6>
					</div>
					<div v-else>
						<h6>{{ item.name }}</h6>
					</div>
				</button>
			</div>
		</div>
		<AddCustomMarker name="addCustomMarker" />
	</template>
	<template v-else>
		<div class="map-used-hint">地圖專用</div>
	</template>
</template>

<style scoped lang="scss">
* {
	margin: 0;
	padding: 0;
	font-family: "微軟正黑體", "Microsoft JhengHei", "Droid Sans", "Open Sans",
		"Helvetica";
	overflow: hidden;
}

button {
	border: none;
	background-color: transparent;
}

.maplegend {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: -var(--font-ms);
	overflow: visible;

	&-legend {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 0.5rem;
		row-gap: 0.5rem;
		overflow: visible;

		&-item {
			display: flex;
			align-items: center;
			padding: 5px 10px 5px 5px;
			border: 1px solid transparent;
			border-radius: 5px;
			transition: box-shadow 0.2s;
			cursor: auto;

			div:first-child,
			img {
				width: var(--font-ms);
			}

			h5 {
				color: var(--color-complement-text);
				font-size: 0.75rem;
				text-align: left;
			}

			h6 {
				color: var(--color-normal-text);
				font-size: var(--font-ms);
				font-weight: 400;
				text-align: left;
			}
		}
	}

	&-filter {
		border: 1px solid var(--color-border);
		cursor: pointer;

		&:hover {
			box-shadow: 0px 0px 5px black;
		}
	}

	&-selected {
		box-shadow: 0px 0px 5px black;
	}
}

.fifteen-minute-life {
	width: 100%;
	display: flex;
	flex-direction: column;
}

.container {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.address-input {
	width: 100%;
	margin: 5px auto;
	height: 2rem;
	color: #fff;
	border: 1px solid #fff;
	border-radius: 5px;
	background-color: #000;
	padding: 0 0.5rem;
}

.address-input::placeholder {
	color: #ccc;
	opacity: 1;
}

.address-button {
	width: 100%;
	height: 2rem;
	color: #fff;
	border: none;
	border-radius: 5px;
	background-color: #007bff;
	cursor: pointer;
	transition: background-color 0.3s;

	&:hover {
		background-color: #0056b3;
	}
}

.maplegend-legend-item {
	display: grid;
	grid-template-columns: auto auto 1fr;
	gap: 8px;
	align-items: center;
}

.map-used-hint {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}
</style>

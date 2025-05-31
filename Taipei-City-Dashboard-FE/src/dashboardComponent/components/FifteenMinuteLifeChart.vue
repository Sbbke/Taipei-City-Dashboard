<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<script setup>
import { ref, computed } from "vue";
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

const authStore = useAuthStore();
const dialogStore = useDialogStore();
const route = useRoute();
const mapStore = useMapStore();
const isCurrentPageMapView = computed(() => route.name === "mapview");

const props = defineProps([
	"chart_config",
	"series",
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

loadAllPersonalMarkers();
// removeAllPersonalMarkers();

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
	console.log("setByLayer", props.map_config, selectedNames);
}

function loadAllPersonalMarkers() {
	const stored = JSON.parse(localStorage.getItem("customMarkers") || "[]");
	stored.forEach((item) => {
		const el = document.createElement("div");
		el.style.backgroundImage = `url('${item.icon}')`;
		el.style.backgroundSize = "cover";
		el.style.width = "30px";
		el.style.height = "30px";
		el.style.borderRadius = "50%";
		el.style.boxShadow = "0 0 5px rgba(0,0,0,0.5)";

		const popupContent = document.createElement("div");
		popupContent.style.fontSize = "14px";
		popupContent.style.margin = "5px";
		popupContent.style.width = "250px";

		// ✅ 修正 HTML
		const buttonId = item.category === "important" ? `delete-${item.category}` : `delete-${item.id}`;
		popupContent.innerHTML = `
			📍 <b>${item.name}</b><br/>
			🗺️ ${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}<br/>
			<button
				id="${buttonId}"
				style="width: 100%; height: 2rem; color: #fff; border: none; border-radius: 5px;
				background-color: #007bff; cursor: pointer; margin-top: 5px;">
				刪除
			</button>
		`;

		const popup = new mapboxgl.Popup({ offset: 30 }).setDOMContent(popupContent);

		// ✅ 安全處理 DOM null 情況
		const deleteBtn = popupContent.querySelector(`#${buttonId}`);
		if (deleteBtn) {
			if(item.category === "important") {
				deleteBtn.addEventListener("click", () => {
					deleteMarker(item.id, item.category);
				});
			} else {
				deleteBtn.addEventListener("click", () => {
					deleteMarker(item.id, item.category);
				});
			}
		} else {
			console.warn(`找不到按鈕 delete-${item.id}`);
		}

		const marker = new mapboxgl.Marker({ element: el })
			.setLngLat([item.lng, item.lat])
			.setPopup(popup)
			.addTo(mapStore.map);

		if(item.category === "important") {
			mapStore.removePersonalMarker("important");
			mapStore.addPersonalMarker(item.category, marker);
		}else{
			mapStore.addPersonalMarker(item.id, marker);
		}
	});
}

function removeAllPersonalMarkers() {
	localStorage.removeItem("customMarkers");
	mapStore.clearAllPersonalMarkers();
	// 這裡假設不保留 mapStore.markers 參考，無法逐個 remove 就改為清空後刷新地圖
	window.location.reload(); // 或重新 render 地圖
}

function deleteMarker(id, category) {
	const storedMarkers = JSON.parse(localStorage.getItem("customMarkers") || "[]");

	// 根據 id 找到 index
	if (category === "important") {
		const index = storedMarkers.findIndex(marker => marker.category === "important");
		if (index !== -1) {
			storedMarkers.splice(index, 1);
			localStorage.setItem("customMarkers", JSON.stringify(storedMarkers));

			mapStore.removePersonalMarker(category);
			return;
		}
	}else{
		const index = storedMarkers.findIndex(marker => marker.id === id);
		if (index !== -1) {
			storedMarkers.splice(index, 1);
			localStorage.setItem("customMarkers", JSON.stringify(storedMarkers));

			mapStore.removePersonalMarker(id);
		} else {
			console.warn("未找到要刪除的標記");
		}
	}
}
</script>

<template>
	<div v-if="authStore.user?.user_id && isCurrentPageMapView" class="fifteen-minute-life">
		<div class="container">
			<input
				class="address-input"
				type="text"
				placeholder="搜尋想創建地標"
			/>
		</div>
		<div class="container">
			<button
				v-if="mapStore.tempMarkerCoordinates"
				:disabled="!mapStore.tempMarkerCoordinates"
				class="address-button"
				@click="dialogStore.showDialog('addCustomMarker')"
			>建立個人臨時地標</button>
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
						borderRadius: item.type === 'circle' ? '50%' : '2px',
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
				margin-right: 0.75rem;
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

.address-input{
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
</style>

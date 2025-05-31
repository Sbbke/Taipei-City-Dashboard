<script setup>
import { ref, onMounted } from "vue";
import mapboxgl from "mapbox-gl";
import { useMapStore } from "../../store/mapStore";
import { useDialogStore } from "../../store/dialogStore";

import DialogContainer from "./DialogContainer.vue";

const props = defineProps(["name"]);
const dialogStore = useDialogStore();
const mapStore = useMapStore();

const markerInfo = ref({
	name: "",
	category: "important",
});

const categoryOptions = [
	{ value: "important", label: "15分鐘城市中心", icon: "https://cdn-icons-png.flaticon.com/128/1828/1828884.png" },
	{ value: "work", label: "工作場所", icon: "https://cdn-icons-png.flaticon.com/128/8955/8955270.png" },
	{ value: "school", label: "學校", icon: "https://cdn-icons-png.flaticon.com/128/1048/1048947.png" },
	{ value: "home", label: "住所", icon: "https://cdn-icons-png.flaticon.com/128/2641/2641242.png" },
	{ value: "other", label: "其他", icon: "https://cdn-icons-png.flaticon.com/128/14988/14988939.png" },
];

function handleClose() {
	markerInfo.value.name = "";
	markerInfo.value.category = "important";
	dialogStore.hideAllDialogs();
}

function handleAddMarker() {
	const coords = mapStore.tempMarkerCoordinates;
	if (!coords) return;

	const category = categoryOptions.find(opt => opt.value === markerInfo.value.category);
	const icon = category?.icon || categoryOptions[3].icon; // default to 'other'

	const id = `marker-${Date.now()}`;
	const stored = JSON.parse(localStorage.getItem("customMarkers") || "[]");

	// 如果 category 是 immportant，把舊的取代
	if (markerInfo.value.category === "important") {
		const index = stored.findIndex(marker => marker.category === "important");
		if (index !== -1) {
			stored.splice(index, 1); // 移除舊的重要地標
		}
	}

	stored.push({
		id: id,
		name: markerInfo.value.name,
		category: markerInfo.value.category,
		lat: coords.lat,
		lng: coords.lng,
		icon: icon
	});

	localStorage.setItem("customMarkers", JSON.stringify(stored));

	if (mapStore.marker) {
		mapStore.marker.remove();
	}

	mapStore.tempMarkerCoordinates = null;
	dialogStore.showNotification("success", "新增地標成功");
	loadAllPersonalMarkers();
	handleClose();
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
			mapStore.addPersonalMarker(item.category, marker, item.name, item.lat, item.lng, item.category);
		}else{
			mapStore.addPersonalMarker(item.id, marker, item.name, item.lat, item.lng, item.category);
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

onMounted(()=> {
	loadAllPersonalMarkers();
})

</script>

<template>
  <DialogContainer :dialog="name" @on-close="handleClose">
    <div class="addmarker">
      <div class="addmarker-title">
        <h2>新增個人地標</h2>
        <button
          v-if="markerInfo.name.length > 0"
          @click="handleAddMarker"
        >
          確認
        </button>
      </div>
      <div class="addmarker-content">
        <label>名稱 ({{ markerInfo.name.length }}/10)</label>
        <input
          v-model="markerInfo.name"
          maxlength="10"
          type="text"
          placeholder="請輸入地標名稱"
        >

        <label style="margin-top: 1rem;">分類</label>
        <select v-model="markerInfo.category">
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>
  </DialogContainer>
</template>

<style scoped lang="scss">
.addmarker {
	width: 300px;
	display: flex;
	flex-direction: column;

	&-title {
		display: flex;
		justify-content: space-between;
		align-items: center;

		button {
			background-color: var(--color-highlight);
			padding: 2px 6px;
			font-size: var(--font-ms);
			border-radius: 5px;
			cursor: pointer;
		}
	}

	&-content {
		display: flex;
		flex-direction: column;
		margin-top: 1rem;

		label {
			font-size: var(--font-s);
			color: var(--color-complement-text);
		}

		input, select {
			margin-top: 4px;
			padding: 6px;
			font-size: var(--font-s);
		}
	}
}
</style>

<script setup>
import { ref } from "vue";
import { useMapStore } from "../../store/mapStore";
import { useDialogStore } from "../../store/dialogStore";

import DialogContainer from "./DialogContainer.vue";

const props = defineProps(["name"]);
const dialogStore = useDialogStore();
const mapStore = useMapStore();

const markerInfo = ref({
	name: "",
	category: "work",
});

const categoryOptions = [
	{ value: "work", label: "工作場所", icon: "https://cdn-icons-png.flaticon.com/512/1077/1077042.png" },
	{ value: "school", label: "學校", icon: "https://cdn-icons-png.flaticon.com/512/1946/1946429.png" },
	{ value: "home", label: "住所", icon: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png" },
	{ value: "other", label: "其他", icon: "https://cdn-icons-png.flaticon.com/512/10927/10927264.png" }
];

function handleClose() {
	markerInfo.value.name = "";
	markerInfo.value.category = "work";
	dialogStore.hideAllDialogs();
}

function handleAddMarker() {
	const coords = mapStore.tempMarkerCoordinates;
	if (!coords) return;

	const category = categoryOptions.find(opt => opt.value === markerInfo.value.category);
	const icon = category?.icon || categoryOptions[3].icon; // default to 'other'

	const id = `marker-${Date.now()}`;
	const stored = JSON.parse(localStorage.getItem("customMarkers") || "[]");

	stored.push({
		id,
		name: markerInfo.value.name,
		category: markerInfo.value.category,
		lat: coords.lat,
		lng: coords.lng,
		icon
	});
	localStorage.setItem("customMarkers", JSON.stringify(stored));

	mapStore.tempMarkerCoordinates = null;
	dialogStore.showNotification("success", "新增地標成功");
	handleClose();
}
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

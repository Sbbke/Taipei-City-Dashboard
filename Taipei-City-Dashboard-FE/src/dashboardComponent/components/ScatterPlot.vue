<!-- Developed by Taipei Urban Intelligence Center 2023-2024-->

<script setup>
import { ref } from "vue";
import VueApexCharts from "vue3-apexcharts";

const props = defineProps(["chart_config", "activeChart", "series"]);

const chartOptions = ref({
  chart: {
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: true,
      type: 'xy'
    },
  },
  colors: [...props.chart_config.color],
  dataLabels: {
    enabled: false,
  },
  grid: {
    show: true,
  },
  legend: {
    show: props.series.length > 1,
  },
  markers: {
    size: 5,
    hover: {
      sizeOffset: 2,
    },
  },
  tooltip: {
    custom: function ({ series, seriesIndex, dataPointIndex, w }) {
      const data = w.config.series[seriesIndex].data[dataPointIndex];
      return `
        <div class="chart-tooltip">
          <h6>${w.globals.seriesNames[seriesIndex]}</h6>
          <span>人口數量: ${data.x}</span><br/>
          <span>商圈數量: ${data.y}</span>
        </div>`;
    },
  },
  xaxis: {
    title: {
      text: '人口數量'
    },
    type: 'numeric',
    labels: {
      formatter: (val) => parseInt(val).toLocaleString(),
    },
  },
  yaxis: {
    title: {
      text: '商圈數量'
    },
    min: 0,
  },
});

const series = [
  {
    name: "各區人口與商圈關係圖",
    data: [
      { x: 120000, y: 15 },  // 人口12萬，商圈15個
      { x: 95000, y: 12 },
      { x: 75000, y: 8 },
      { x: 62000, y: 6 },
      { x: 103000, y: 10 },
      { x: 86000, y: 9 },
    ],
  },
];

</script>

<template>
  <div v-if="activeChart === 'TimelineSeparateChart'">
    <VueApexCharts
      width="100%"
      height="260px"
      type="scatter"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

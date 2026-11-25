<script setup>
// Floor plan on which the user clicks a point. Positions are percentages (0-100)
// of the image's width and height, so they do not depend on the screen size.
const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: "Plan de l'étage" },
  // { x, y } or null
  modelValue: { type: Object, default: null },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function round(value) {
  return Math.round(value * 100) / 100
}

function onClick(event) {
  if (props.readonly) {
    return
  }
  const image = event.currentTarget
  emit('update:modelValue', {
    x: round((event.offsetX / image.clientWidth) * 100),
    y: round((event.offsetY / image.clientHeight) * 100),
  })
}
</script>

<template>
  <div class="plan" :class="{ readonly }">
    <img :src="src" :alt="alt" @click="onClick" />
    <span
      v-if="modelValue"
      class="marker"
      :style="{ left: `${modelValue.x}%`, top: `${modelValue.y}%` }"
      aria-hidden="true"
    ></span>
  </div>
</template>

<style scoped>
.plan {
  position: relative;
  max-width: 800px;
}
.plan img {
  display: block;
  width: 100%;
  cursor: crosshair;
}
.plan.readonly img {
  cursor: default;
}
.marker {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-radius: 50%;
  background: crimson;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>

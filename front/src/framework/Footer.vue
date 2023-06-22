<script setup lang="ts">
const active = true;
</script>

<template>
  <div class="fr_footer">
    <div class="timer"></div>
    <div class="paginator">
      <ul v-if="active" class="pointer">
        <li class="sysIcon sysIcon_caretleft"></li>
        <li>1</li>
        <li>2</li>
        <li>3</li>
        <li>4</li>
        <li>...</li>
        <li>8</li>
        <li class="sysIcon sysIcon_caretright"></li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fr_footer {
  display: flex;
  justify-content: space-between;
  line-height: $footerHeight;
}
//.timer {
//}
.paginator {
  ul {
    display: inline-block;
  }
  li {
    font-size: $fontSize;
    display: inline-block;
    padding: 0 $fontSize * 0.5;
  }
}
.active,
.paginator li:hover {
  background-color: map-get($colors, bk);
  color: map-get($colors, font);
}
</style>

<template>
  <div id="app">
    <el-config-provider :locale="zhCn">
      <RouterView />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<style>
@import '@/styles/global.scss';
</style>

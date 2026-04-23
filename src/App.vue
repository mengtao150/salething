<template>
  <el-config-provider :locale="zhCn">
    <div class="app-shell">
      <header class="app-header">
        <div class="brand-block">
          <span class="brand-kicker">SaleThing</span>
          <strong class="brand-title">商品流转面板</strong>
        </div>

        <el-menu :default-active="route.path" mode="horizontal" router class="app-nav">
          <el-menu-item index="/">
            <el-icon><Goods /></el-icon>
            <span>正式商品</span>
          </el-menu-item>
          <el-menu-item index="/procurement">
            <el-icon><ShoppingCartFull /></el-icon>
            <span>采购到得物</span>
          </el-menu-item>
        </el-menu>
      </header>

      <main class="app-main">
        <RouterView />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style>
@import '@/styles/global.scss';

.app-shell {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px 0;
  backdrop-filter: blur(18px);
}

.brand-block {
  display: grid;
  gap: 4px;
}

.brand-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e85c9;
}

.brand-title {
  font-size: 20px;
  color: #152947;
  letter-spacing: -0.03em;
}

.app-nav.el-menu--horizontal {
  border-bottom: none;
  background: rgba(255, 255, 255, 0.74);
  border-radius: 999px;
  padding: 6px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.app-nav.el-menu--horizontal > .el-menu-item {
  height: 42px;
  border-radius: 999px;
  border-bottom: none !important;
  color: #5d6b82;
  gap: 6px;
}

.app-nav.el-menu--horizontal > .el-menu-item span {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

.app-nav.el-menu--horizontal > .el-menu-item.is-active {
  color: #ffffff;
  background: linear-gradient(135deg, #5b7def, #7aa2ff);
}

.app-main {
  min-height: calc(100vh - 74px);
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    padding: calc(12px + env(safe-area-inset-top)) 14px 0;
  }

  .app-nav.el-menu--horizontal {
    width: 100%;
    justify-content: space-between;
  }

  .app-nav.el-menu--horizontal > .el-menu-item {
    flex: 1;
    justify-content: center;
    min-width: 0;
    padding: 0 8px;
    font-size: 13px;
  }

  .app-nav.el-menu--horizontal > .el-menu-item span {
    white-space: normal;
    line-height: 1.1;
    text-align: center;
  }
}
</style>

<template>
  <section class="workspace-grid">
    <article class="panel">
      <p class="eyebrow">Profile</p>
      <h3>{{ state.profile.name }}</h3>
      <div class="profile-grid">
        <label class="field">
          <span>昵称</span>
          <input v-model="state.profile.name" />
        </label>
        <label class="field">
          <span>城市</span>
          <input v-model="state.profile.city" />
        </label>
        <label class="field">
          <span>标签</span>
          <input v-model="state.profile.role" />
        </label>
      </div>
    </article>

    <article class="panel span-two">
      <div class="panel-head">
        <div>
          <p class="eyebrow">History</p>
          <h3>历史分析记录</h3>
        </div>
      </div>

      <div v-if="state.records.length" class="record-list">
        <div v-for="item in state.records" :key="item.id" class="record-row">
          <div>
            <strong>{{ item.profile.label }}</strong>
            <p class="muted">{{ new Date(item.createdAt).toLocaleString() }}</p>
          </div>
          <div class="record-tags">
            <span>{{ item.source }}</span>
            <span>{{ Math.round(item.confidence * 100) }}%</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="history-placeholder-grid">
          <article class="summary-card">
            <span>累计分析</span>
            <strong>0 次</strong>
            <p class="muted">完成一次上传或拍照后开始累计。</p>
          </article>
          <article class="summary-card">
            <span>最近来源</span>
            <strong>待生成</strong>
            <p class="muted">识别结果会记录接口分析或拍照采集来源。</p>
          </article>
          <article class="summary-card">
            <span>档案状态</span>
            <strong>等待更新</strong>
            <p class="muted">本轮分析结束后自动同步到这里。</p>
          </article>
        </div>

        <div class="history-empty-copy">
          <strong>暂无记录</strong>
          <p class="muted">完成一次分析后，记录会显示在这里。</p>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { useSmartlashState } from '../composables/useSmartlashState'

const { state } = useSmartlashState()
</script>

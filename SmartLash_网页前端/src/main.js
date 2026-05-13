import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

document.title = 'SmartLash 眼妆辅助系统'

createApp(App).use(router).mount('#app')

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import './scss/styles.scss'

// Import Bootstrap’s CSS (Bootstrap's CSS should be imported separately before JS)
import 'bootstrap/dist/css/bootstrap.min.css'

import 'bootstrap-icons/font/bootstrap-icons.css'
// Import all of Bootstrap’s JS
import 'bootstrap'
import 'boxicons/css/boxicons.min.css'

// Import the main App component and the router
import App from './App.vue'
import router from './router'

// Create and mount the Vue app
const app = createApp(App)

app.use(createPinia()) // Pinia state management
app.use(router) // Vue Router

app.mount('#app') // Mount the app to the DOM

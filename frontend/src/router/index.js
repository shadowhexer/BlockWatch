import { createRouter, createWebHistory } from 'vue-router'
import ReportingViews from '@/views/user/ReportingViews.vue'
import TanodLogin from '@/views/barangay/Tanod/TanodLogin.vue'
import TanodInterface from '@/views/barangay/Tanod/TanodInterface.vue'
import BarangayView from '@/views/barangay/BarangayView.vue'
import StartedViews from '@/views/user/StartedViews.vue'
import LoginAdmin from '@/views/barangay/LoginAdmin.vue'
import UnVerified_Verified from '@/components/barangay/UnVerified_Verified.vue'
import AssigningTanod from '@/components/barangay/AssigningTanod.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/assigning-tanod', name: 'assigning-tanod', component: AssigningTanod },
    { path: '/unverified-verified', name: 'unverified-verified', component: UnVerified_Verified },
    { path: '/report', name: 'report', component: ReportingViews },
    { path: '/tanod-login', name: 'tanod-login', component: TanodLogin },
    { path: '/tanod-interface', name: 'tanod-interface', component: TanodInterface },
    { path: '/barangay-view', name: 'barangay-view', component: BarangayView },
    { path: '/', name: 'started', component: StartedViews },
    { path: '/login-admin', name: 'login-admin', component: LoginAdmin },
  ]
})

export default router

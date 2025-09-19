<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <aside id="sidebar" class="bg-dark text-light p-3 d-flex flex-column" style="width: 250px; height: 100vh;">
      <h1 class="text-center text-primary mb-4 fs-4">Admin Dashboard</h1>
      <nav class="flex-grow-1">
        <ul class="list-unstyled">
          <li>
            <button @click="selectPage('dashboard')"
              class="d-flex align-items-center p-2 text-light rounded mb-2"
              :class="{ 'bg-primary': activePage === 'dashboard', 'text-white': activePage === 'dashboard' }"
            >
              <i class="bi bi-house-door-fill me-3"></i> Dashboard
            </button>
          </li>
          <li>
            <button @click="selectPage('verified')"
              class="d-flex align-items-center p-2 text-light rounded mb-2"
              :class="{ 'bg-primary': activePage === 'verified', 'text-white': activePage === 'verified' }"
            >
              <i class="bi bi-check-circle-fill me-3"></i> Verified/Unverified
            </button>
          </li>
          <li>
            <button @click="selectPage('assign')"
              class="d-flex align-items-center p-2 text-light rounded mb-2"
              :class="{ 'bg-primary': activePage === 'assign', 'text-white': activePage === 'assign' }"
            >
              <i class="bi bi-person-check-fill me-3"></i> Assigning Tanod
            </button>
          </li>
          <li>
            <button @click="selectPage('tanodregistration')"
              class="d-flex align-items-center p-2 text-light rounded mb-2"
              :class="{ 'bg-primary': activePage === 'tanodregistration', 'text-white': activePage === 'tanodregistration' }"
            >
              <i class="bi bi-person-add me-3"></i> Tanod Registration
            </button>
          </li>
        </ul>
      </nav>

      <!-- Logout Link at the Bottom -->
      <div class="mt-auto">
        <button
          class="d-flex align-items-center p-2 text-light rounded"
          :class="{ 'bg-primary': activePage === 'logout', 'text-white': activePage === 'logout' }"
          @click="logout"
        >
          <i class="bi bi-box-arrow-right me-3"></i> Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content flex-grow-1 p-4" style="margin-left: 250px;">
      <!-- Dynamically Render the Selected Page -->
      <component :is="currentView" />
    </main>
  </div>
</template>

<script>
import DashboardaView from '@/components/barangay/DashboardaView.vue';
import Assigning from '@/components/barangay/AssigningTanod.vue';
import TanodRegistration from '@/components/barangay/TanodRegistration.vue';
import UnVerified_Verified from '@/components/barangay/UnVerified_Verified.vue';

export default {
  components: {
    DashboardaView,
    Assigning,
    TanodRegistration,
    UnVerified_Verified,
  },
  data() {
    return {
      activePage: 'dashboard', // Default to 'dashboard' page
    };
  },
  computed: {
    // Dynamically determine which component to render based on activePage
    currentView() {
      switch (this.activePage) {
        case 'assign':
          return 'Assigning';
        case 'verified':
          return 'UnVerified_Verified';
        case 'tanodregistration':
          return 'TanodRegistration';
        case 'dashboard':
          return 'DashboardaView';
        default:
          return null;
      }
    }
  },
  methods: {
    selectPage(page) {
      this.activePage = page;
    },
    logout() {
      // Logic for logging out
      console.log("Logging out...");
    }
  }
};
</script>

<style scoped>
/* Optional: Add custom styling for the sidebar and layout here */
#sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  transition: all 0.3s ease;
}

button {
  width: 100%;
  padding: 10px;
  background-color: transparent;
  border: 1px solid transparent;
  color: #fff;
  text-align: left;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #1193d4;
}

.main-content {
  padding: 20px;
  margin-left: 250px;
}
</style>

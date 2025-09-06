<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <h2>Barangay Mahay</h2>
      <nav>
        <ul>
          <li><button @click="selectPage('dashboard')">📋 Dashboard</button></li>
          <li><button @click="selectPage('verified')">✅ Verified Reports</button></li>
          <li><button @click="selectPage('assign')">👮 Assigning Tanod</button></li>
          <li><button @click="selectPage('search')">🔍 Search Record</button></li>
          <li><button @click="selectPage('tanodregistration')">👮 Tanod Registration</button></li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">

      <section v-if="activePage === 'search'" class="card-section">
        <h2>🔍 Search Crime Record</h2>
        <div class="form-row">
          <input v-model="searchId" placeholder="Enter Crime ID" type="text" />
          <button @click="fetchCrime">Find</button>
          <button class="clear-btn" @click="clearResults">Clear</button>
        </div>
        <pre class="result-box" v-if="result">{{ result }}</pre>
      </section>

      <section v-if="activePage === 'verified'" class="card-section">
        <h3>Verified/UnVerified Reports</h3>
      </section>

      <component :is="currentView" v-if="currentView" />
    </main>
  </div>
</template>

<script scoped>
import DashboardaView from '@/components/barangay/DashboardaView.vue';
import Assigning from '@/components/barangay/AssigningTanod.vue';
import TanodRegistration from '@/components/barangay/TanodRegistration.vue'
import UnVerified_Verified from '@/components/barangay/UnVerified_Verified.vue';
export default {
  components: {
    DashboardaView,
    Assigning,
    TanodRegistration,
    UnVerified_Verified
  },
  data() {
    return {
      searchId: '',
      result: '',
      activePage: 'dashboard',
    };
  },
  computed: {
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
    },
  },
  methods: {
    selectPage(page) {
      this.activePage = page;
      this.clearResults();
    },
    async fetchCrime() {
      if (!this.searchId || isNaN(this.searchId)) {
        alert("Please enter a valid Crime ID");
        return;
      }
      try {
        this.result = '';
        const res = await fetch(`http://localhost:3000/crime/${this.searchId}`);
        if (!res.ok) {
          const result = await res.json();
          alert(`Error fetching crime record: ${result.error}`);
          return;
        }
        const data = await res.json();
        const crimeData = data.data.split(",");
        this.result = `
        Crime ID: ${crimeData[0]}
        Description: ${crimeData[1]}
        Date: ${crimeData[2]}
        Status: ${crimeData[3]}
        Message: ${data.message}
        `;
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while fetching the crime record.");
      }
    },
    clearResults() {
      this.result = '';
      this.searchId = '';
    },
  },
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-wrap: wrap;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9fafb;
}

/* Sidebar styles */
.sidebar {
  width: 240px;
  background-color: #212529;
  color: white;
  padding: 20px;
  flex-shrink: 0;
}

.sidebar h2 {
  color: #ffc107;
  margin-bottom: 20px;
  font-size: 20px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar button {
  width: 100%;
  background-color: #343a40;
  color: white;
  border: 1px solid #495057;
  padding: 10px;
  margin-bottom: 10px;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
}

.sidebar button:hover {
  background-color: #495057;
}

/* Main content styles */
.main-content {
  flex-grow: 1;
  padding: 30px;
  min-width: 0;
  flex-basis: calc(100% - 240px);
}

.card-section {
  background: white;
  border: 1px solid #dee2e6;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

/* Form layout */
.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

.form-row input {
  flex: 1 1 200px;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.form-row button {
  padding: 8px 16px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.clear-btn {
  background-color: #6c757d;
}

.result-box {
  background: #f1f3f5;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  margin-top: 10px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    padding: 15px;
    order: 1;
  }

  .main-content {
    flex-basis: 100%;
    padding: 20px;
    order: 2;
  }

  .sidebar button {
    font-size: 14px;
    padding: 8px;
  }

  .form-row {
    flex-direction: column;
  }

  .form-row input,
  .form-row button {
    width: 100%;
  }

  .card-section {
    padding: 15px;
  }

  .main-content h1 {
    font-size: 22px;
    margin-bottom: 10px;
  }
}
</style>

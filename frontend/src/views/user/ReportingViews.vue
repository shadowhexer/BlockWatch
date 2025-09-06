<template>
  <div class="container-fluid">
    <!-- Header with Flexbox -->
    <div class="header bg-dark text-white text-center p-3 rounded d-flex justify-content-between align-items-center">
      <!-- Left side: Guide Button -->
      <div class="d-flex">
        <button class="btn btn-info" @click="showGuide">Guide to Use</button>
      </div>
      <!-- Centered text: Title and descriptions -->
      <div class="text-center flex-grow-1">
        <h1 id="font">🚨 BlockNo-Mity System</h1>
      </div>
    </div>

    <!-- User Guide Popup -->
    <UserGuide v-if="isVisible" @close-guide="closeGuidePopup" />

    <div class="row-layout">
      <!-- Left: Report Form -->
      <div class="col-form">
        <section class="card shadow-lg p-4">
          <h3 id="font" class="mb-3">📝 Report an Illegal Activity</h3>

          <div class="form-group mb-3">
            <label id="font">Your Anonymous Name</label>
            <input v-model="anonymousName" type="text" class="form-control" placeholder="e.g. Witness101" />
          </div>

          <div class="form-group mb-3">
            <label>Choose Input Type</label>
            <div>
              <label class="me-3">
                <input type="radio" v-model="inputType" value="text" />
                <span>Text Input</span>
              </label>
              <label>
                <input type="radio" v-model="inputType" value="voice" disabled />
                <span>Voice Recording (Disabled)</span>
              </label>
            </div>
          </div>

          <div class="form-group mb-3" v-if="inputType === 'text'">
            <label id="font">Crime Description</label>
            <textarea v-model="description" rows="4" class="form-control" placeholder="Describe what happened..."></textarea>
          </div>

          <div class="text-end mt-3">
            <button id="font" class="btn btn-danger" @click="submitReport">📤 Submit Report</button>
          </div>
        </section>
      </div>

      <!-- Right: View Reports -->
      <div class="col-view">
        <section class="card shadow-sm p-4" style="max-height: 500px; overflow-y: auto;">
          <h3 id="font">📋 View Tracking Reports</h3>
          <input v-model="searchName" type="text" class="form-control my-2" placeholder="Search by anonymous name" />

          <ul class="list-group mt-3">
            <li class="list-group-item d-flex justify-content-between align-items-start" v-for="(report, index) in filteredReports" :key="index">
              <div class="col-4">
                <strong>{{ report.name }}</strong>
              </div>
              <div class="col-5">
                <span v-if="report.type === 'text'">{{ report.description }}</span>
              </div>
              <div class="col-3 text-end">
                <span class="text-danger fw-bold">{{ report.status }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <footer class="bg-dark text-white text-center p-3">
      <p>&copy; 2025 BlockNomy-mity. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';
import UserGuide from '@/components/user/UserGuide.vue';  // Import UserGuide component

export default {
  components: {
    UserGuide,  // Register UserGuide component
  },
  data() {
    return {
      anonymousName: '',
      inputType: 'text',  // Disabled voice recording
      description: '',
      reports: [],  // This will hold the reports data
      searchName: '',  // Search query for filtering reports
      userIdentity: '',  // Store user identity here
      isVisible: false,  // Control visibility of the guide popup
    };
  },
  computed: {
    // Filter reports based on the searchName entered by the user
    filteredReports() {
      if (!this.searchName.trim()) return this.reports;
      return this.reports.filter(r => r.name.toLowerCase().includes(this.searchName.toLowerCase()));
    },
  },
  methods: {
    // Show the user guide popup
    showGuide() {
      this.isVisible = true;
    },
    // Close the user guide popup
    closeGuidePopup() {
      this.isVisible = false;
    },
    // Fetch user identity from the server
    async fetchUserIdentity() {
      try {
        const response = await axios.get("http://localhost:3000/get-identity-session", {
          withCredentials: true,  // Ensure cookies (session) are sent
        });
        this.userIdentity = response.data.userIdentity || '';
        console.log("User Identity:", this.userIdentity);

        // Once the identity is set, fetch the reports based on the user identity
        if (this.userIdentity) {
          this.fetchReports(this.userIdentity); // Fetch reports for this identity
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    },
    // Fetch reports from the server using the userIdentity dynamically
    async fetchReports(userIdentity) {
      if (!userIdentity) {
        console.warn("User identity is not set. Cannot fetch reports.");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/reports?userIdentity=${userIdentity}`, {
          withCredentials: true,  // Ensure cookies (session) are sent
        });

        // Assuming the data returned is in the format you provided
        this.reports = response.data || [];  // Set the reports data
        console.log("Fetched Reports:", this.reports);  // Log the actual reports
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    },
    // Get API base URL
    getApiBase() {
      const isNgrok = location.hostname.includes("ngrok");
      return isNgrok ? `http://${location.hostname}` : "http://localhost:3000";
    },
    // Submit the report to the server
    async submitReport() {
      if (!this.anonymousName.trim()) {
        alert("Please enter your anonymous name.");
        return;
      }

      if (this.inputType === 'text' && !this.description.trim()) {
        alert("Please enter a crime description.");
        return;
      }

      const apiBase = "http://localhost:3000";

      const formData = new FormData();
      formData.append('anonyname', this.anonymousName);
      formData.append('userIdentity', this.userIdentity);
      formData.append('status', "unverified");
      formData.append('description', this.description);

      try {
        const res = await axios.post(`${apiBase}/report`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(res.data.message || "Report submitted.");
        this.fetchReports(this.userIdentity); // Refetch reports after submitting
      } catch (err) {
        console.error(err);
        alert("Server error.");
      }

      // Reset the form
      this.anonymousName = '';
      this.description = '';
    },
  },
  // Call the fetchUserIdentity() when the component is mounted
  async mounted() {
    await this.fetchUserIdentity();
  },
  watch: {
    // Watch for changes in userIdentity and fetch reports automatically
    userIdentity(newVal) {
      if (newVal) {
        this.fetchReports(newVal); // Fetch reports whenever the userIdentity changes
      }
    },
  },
};
</script>

<style scoped>
/* Layout */
.container-fluid {
  padding: 20px;
  background: #FAF7F3;
  min-height: 100vh;
}

#font{
  font-family: serif;
}

#font h1{
  font-size: 30px;
}
#font h{
  font-size: 20px;
  font-weight: bold;
}
.header {
  display: flex;  /* Use Flexbox to align elements */
  justify-content: space-between; /* Put space between the elements */
  align-items: center;  /* Vertically center the content */
}

.header h1,
.header p {
  margin: 0;  /* Remove default margin */
}

.text-center {
  flex-grow: 1;  /* Allow the text content to grow and occupy available space */
  text-align: center;  /* Ensure that text is centered */
}

button {
  background-color: #FBF5DE;
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover{
  background-color: #F8F8F8;
  color: black;
}
/* 2-Column Layout */
.row-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
}

.col-form {
  flex: 1 1 54%;
}

.col-view {
  flex: 1 1 44%;
}

/* Card Style */
.card {
  border: 1px solid #ced4da;
  border-radius: 12px;
  background: #FEF9F2;
  padding: 24px;
}

/* Form Inputs */
label {
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

input[type="text"],
textarea,
.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 10px;
}

textarea {
  resize: vertical;
}

/* Buttons */
button {
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  border: none;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: #fff;
}

.btn-secondary {
  background-color: #6c757d;
  color: #fff;
}

.btn-danger {
  background-color: #D7D7D7;
  color: #141313;
}

.btn-primary:hover {
  background-color: #0069d9;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger:hover {
  background-color: #c82333;
}

audio {
  width: 100%;
  margin-top: 10px;
}

/* Reports List */
.list-group {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 500px;
  overflow-y: auto;
}

.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid #ddd;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #fdfdfd;
}

.list-group-item .col-4 {
  flex: 0 0 33%;
  font-weight: bold;
  color: #333;
}

.list-group-item .col-5 {
  flex: 0 0 47%;
}

.list-group-item .col-3 {
  flex: 0 0 20%;
  text-align: right;
}

.list-group-item audio {
  width: 100%;
  margin-top: 4px;
}

.text-danger {
  color: red;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {

  .header h1{
    font-size: 20px;
  }

  .header button{
    font-size: 10px;
  }

  .row-layout {
    flex-direction: column;
  }

  .col-form,
  .col-view {
    flex: 1 1 100%;
  }

  .list-group-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-group-item .col-4,
  .list-group-item .col-5,
  .list-group-item .col-3 {
    width: 100%;
    margin-bottom: 6px;
    text-align: left;
  }

  .list-group-item .col-3 {
    text-align: left;
  }
}
</style>


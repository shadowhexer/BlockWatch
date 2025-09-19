<template>
  <div class="container-fluid mt-5 bg-dark text-light p-4 rounded">
    <!-- Nav Tabs for Verified and Unverified Reports -->
    <ul class="nav nav-tabs mb-4" id="reportTab" role="tablist">
      <!-- Verified Reports Tab -->
      <li class="nav-item" role="presentation">
        <a
          class="nav-link active"
          id="verified-tab"
          data-bs-toggle="tab"
          href="#verified-reports"
          role="tab"
          aria-controls="verified-reports"
          aria-selected="true"
        >
          <i class="bi bi-check-circle me-2"></i> Verified Reports
        </a>
      </li>

      <!-- Unverified Reports Tab -->
      <li class="nav-item" role="presentation">
        <a
          class="nav-link"
          id="unverified-tab"
          data-bs-toggle="tab"
          href="#unverified-reports"
          role="tab"
          aria-controls="unverified-reports"
          aria-selected="false"
        >
          <i class="bi bi-x-circle me-2"></i> Unverified Reports
        </a>
      </li>
    </ul>

    <!-- Tab Content -->
    <div class="tab-content" id="reportTabContent">
      <!-- Verified Reports Content -->
      <div
        class="tab-pane fade show active"
        id="verified-reports"
        role="tabpanel"
        aria-labelledby="verified-tab"
      >
        <div class="card bg-secondary text-light border-0 rounded">
          <div class="card-body">
            <h4 class="card-title">Verified Reports</h4>

            <!-- Check if there are any verified reports -->
            <div v-if="verifiedReports.length > 0">
              <table class="table table-bordered table-striped text-light">
                <thead class="bg-dark">
                  <tr>
                    <th>Report ID</th>
                    <th>Report Title</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(report, index) in verifiedReports" :key="index">
                    <td>{{ report.crimeId }}</td>
                    <td>{{ report.description }}</td>
                    <td :class="getStatusClass(report.status)">{{ report.status }}</td>
                    <td>{{ report.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Display message if no verified reports -->
            <div v-else>
              <p class="text-danger">No reported verified crimes.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Unverified Reports Content -->
      <div
        class="tab-pane fade"
        id="unverified-reports"
        role="tabpanel"
        aria-labelledby="unverified-tab"
      >
        <div class="card bg-secondary text-light border-0 rounded">
          <div class="card-body">
            <h4 class="card-title">Unverified Reports</h4>

            <!-- Check if there are any unverified reports -->
            <div v-if="unverifiedReports.length > 0">
              <table class="table table-bordered table-striped text-light">
                <thead class="bg-dark">
                  <tr>
                    <th>Report ID</th>
                    <th>Report Title</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(report, index) in unverifiedReports" :key="index">
                    <td>{{ report.crimeId }}</td>
                    <td>{{ report.description }}</td>
                    <td :class="getStatusClass(report.status)">{{ report.status }}</td>
                    <td>{{ report.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Display message if no unverified reports -->
            <div v-else>
              <p class="text-danger">No reported unverified crimes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ReportList",
  data() {
    return {
      reports: [], // Array to hold reports data
      userIdentity: "", // Placeholder for user identity
    };
  },
  computed: {
    // Filter Verified reports
    verifiedReports() {
      return this.reports.filter((report) => report.status === "verified");
    },
    // Filter Unverified reports
    unverifiedReports() {
      return this.reports.filter((report) => report.status === "unread");
    },
  },
  methods: {
    // Get the base API URL
    getApiBase() {
      const isNgrok = location.hostname.includes("ngrok");
      return isNgrok ? `http://${location.hostname}` : "http://localhost:3000";
    },

    // Method to determine the class based on report status
    getStatusClass(status) {
      if (status === "verified") {
        return "verified"; // Return the 'verified' class
      }
      if (status === "unverified") {
        return "unverified"; // Return the 'unverified' class
      }
      return ""; // Default return in case no match
    },

    // Fetch the user identity from the backend
    async fetchUserIdentity() {
      const apiBase = this.getApiBase(); // Get the base API URL
      try {
        // Fetch user identity from the backend API
        const response = await axios.get(`${apiBase}/get-identity-session`, {
          withCredentials: true,
        });
        if (response.status === 200) {
          this.userIdentity = response.data.userIdentity;
          console.log("User Identity:", this.userIdentity);

          // After fetching user identity, fetch reports
          this.fetchReports();
        } else {
          console.error("Failed to retrieve user identity:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    },

    // Fetch reports from the backend API
    async fetchReports() {
      const apiBase = this.getApiBase(); // Get the base API URL
      const userIdentity = this.userIdentity; // User identity should already be available here

      try {
        if (!userIdentity) {
          console.error("User identity is not available");
          return;
        }

        // Fetch crime reports based on the user identity
        const response = await axios.get(`${apiBase}/blockchain/reports`, {
          params: { userIdentity },
          withCredentials: true, // Include cookies with the request
        });

        if (response.status === 200) {
          this.reports = response.data; // Assign the fetched reports data
        } else {
          console.error("Failed to fetch reports");
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    },
  },
  mounted() {
    // Fetch user identity first when the component is mounted
    this.fetchUserIdentity();
  },
};
</script>


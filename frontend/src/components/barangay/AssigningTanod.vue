<template>
  <div class="container mt-5 bg-dark text-light p-4 rounded">
    <div class="row">
      <!-- Left Column: Reports -->
      <div class="col-md-6">
        <div class="card bg-secondary text-light border-0 rounded">
          <div class="card-header bg-dark text-light">
            <h3>📋 View Reports</h3>
          </div>
          <ul class="list-group list-group-flush">
            <li
              class="list-group-item bg-dark text-light rounded mb-3"
              v-for="(report, index) in reports"
              :key="index"
            >
              <div class="card mb-3">
                <div class="card-header">
                  Feature
                </div>
                <div class="card-body">
                  <h5 class="card-title"><label>Anonymized Name: </label> <strong> {{ report.anonyname }}</strong></h5>
                  <p class="card-text border border-1 mb-2 p-2">
                    <label>Description: </label>
                    <span class="p-4"> {{ report.description }}</span>
                  </p>
                  <p class="card-text mb-2">
                    <label>Status: </label>
                    <span class="text-danger fw-bold"> {{ report.status }}</span>
                  </p>

                  <div>
                    <!-- Check if the report has been assigned, if not show the tanod selection -->
                    <div
                      v-if="!isAssigned(report.crimeId)"
                      class="d-flex align-items-center"
                      style="border:3px solid #007bff; background:#e3f0ff; padding:16px; border-radius:8px; margin:8px 0; z-index:1000; position:relative;"
                    >
                      <label for="tanod-select" class="me-2">Assign Tanod: </label>
                      <select
                        v-model="selectedTanod[report.crimeId]"
                        @change="assignTanod(report, selectedTanod[report.crimeId])"
                        class="form-select form-select-sm ms-2"
                        id="tanod-select"
                      >
                        <option value="">Select tanod</option>
                        <option
                          v-for="tanod in tanods"
                          :value="JSON.stringify({ id: tanod.id, name: tanod.username })"
                          :key="tanod.id"
                        >
                          {{ tanod.username }}
                        </option>
                      </select>
                    </div>

                    <!-- Display assigned info if the report is already assigned -->
                    <div v-else class="card-footer text-muted assigned-info">
                      <div v-for="(assignment, index) in assignments" :key="index">
                        <div v-if="assignment.crime_id == report.crimeId">
                          <p class="mb-1"><span class="text-success">Assigned to: </span>{{ assignment.assigned_to }}</p>
                          <p class="mb-0">Assigned at: {{ assignment.assigned_at }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right Column: Tanods -->
      <div class="col-md-6">
        <div class="card bg-secondary text-light border-0 rounded">
          <div class="card-header bg-dark text-light">
            <h3>👮 Assigned Report Count</h3>
          </div>
          <table v-if="tanods.length" class="table table-bordered table-striped text-light">
            <thead class="bg-dark">
              <tr>
                <th>Username</th>
                <th>Assigned Reports</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tanod in tanods" :key="tanod.id">
                <td>{{ tanod.username }}</td>
                <td>
                  <span v-if="tanod.assignmentCount !== undefined">
                    {{ tanod.assignmentCount }}
                  </span>
                  <span v-else>No assignments</span>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-else class="text-center text-muted">No matching tanods found.</p>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';
import { reactive } from 'vue';

export default {
  name: 'AssigningTanod',
  data() {
    return {
      tanods: [],
      reports: [],
      assignments: [],
      selectedTanod: reactive({}),  // Track selected tanods by crimeId
      userIdentity: '', // Placeholder for user identity
    };
  },
  async created() {
    await this.fetchTanods();
    await this.fetchAssignments();
    await this.fetchAssignmentsCount();
    await this.fetchUserIdentity(); // Fetch the user identity first
  },
  methods: {
    getApiBase() {
      const isNgrok = location.hostname.includes("ngrok");
      return isNgrok
        ? `http://${location.hostname}`
        : "http://localhost:3000";
    },

    // Fetch reports from the backend API
    async fetchReports() {
      const apiBase = this.getApiBase(); // Get the base API URL
      const userIdentity = this.userIdentity; // User identity should already be available here

      try {
        // Ensure user identity is available before making the request
        if (!userIdentity) {
          console.error("User identity is not available");
          return;
        }

        // Fetch crime reports based on the user identity
        const response = await axios.get(`${apiBase}/blockchain/reports?userIdentity=${encodeURIComponent(userIdentity)}`, {
          withCredentials: true,  // Include cookies with the request
        });

        // Check if the response is valid and contains the expected data
        if (response && Array.isArray(response.data)) {
          const data = response.data;

          // Map through the data and attach assignment info
          this.reports = data.map(report => {
            const assignment = this.assignments.find(a => a.crimeId === report.crimeId);
            if (assignment) {
              report.assignedTo = assignment.assigned_to;
              report.assignedAt = assignment.assigned_at;
            } else {
              report.assignedTo = null;
              report.assignedAt = null;
            }
            return report;
          });
        } else {
          console.error("Invalid response data format:", response.data);
        }
      } catch (err) {
        console.error('Fetch reports failed:', err);
      }
    },

    // Fetch the user identity from the backend
    async fetchUserIdentity() {
      try {
        const response = await axios.get('http://localhost:3000/get-identity-session', {
          withCredentials: true,
        });

        if (response.status === 200) {
          this.userIdentity = response.data.userIdentity; // Make sure this is the correct property
          console.log("User Identity:", this.userIdentity);

          // After fetching user identity, call fetchReports
          this.fetchReports();  // Fetch reports only when user identity is available
        } else {
          console.error("Failed to retrieve user identity:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    },

    // Fetch assignments from the backend API
    async fetchAssignments() {
      try {
        const res = await axios.get('http://localhost:3000/assignments', { withCredentials: true });
        this.assignments = res.data || [];
      } catch (err) {
        console.error('Fetch assignments failed:', err);
      }
    },

    // Fetch tanods from the backend API
    async fetchTanods() {
      try {
        const res = await axios.get('http://localhost:3000/tanods', { withCredentials: true });
        this.tanods = res.data || [];
      } catch (err) {
        console.error('Fetch tanods failed:', err);
      }
    },

    // Check if the report is assigned by checking the assignments list
    isAssigned(crimeId) {
      return this.assignments.some(assignment => assignment.crime_id == crimeId);
    },

    // Assign a tanod to a report
    async assignTanod(report, selectedValue) {
      if (this.isAssigned(report.crimeId)) {
        alert(`This report is already assigned to ${this.getAssignedTo(report.crimeId)}!`);
        return;
      }

      try {
        const tanodData = JSON.parse(selectedValue);

        const crimeId = report.crimeId;
        const tanodId = tanodData.id;

        const res = await axios.post('http://localhost:3000/assign', {
          crimeId: crimeId,
          tanodId: tanodId,
        });

        if (res.status === 200) {
          report.assignedTo = tanodData.name;
          report.assignedAt = new Date().toISOString();
          alert(`Successfully assigned to ${tanodData.name}`);

          // Update the assignments array with new assignment data
          this.assignments.push({
            crimeId: report.crimeId,
            assigned_to: tanodData.name,
            assigned_at: report.assignedAt,
            assigned: 1,
          });

          // Store the selected tanod correctly as an object for this specific report
          this.selectedTanod[report.crimeId] = tanodData;
        } else {
          alert(res.data.error || 'Assignment failed');
        }
      } catch (error) {
        console.error('Assignment error:', error);
        alert(error.message);
      }
    },

    // Fetch assignment counts for each tanod
    async fetchAssignmentsCount() {
      try {
        const res = await axios.get('http://localhost:3000/assignments/count', { withCredentials: true });
        const data = res.data || [];

        this.tanods = this.tanods.map(tanod => {
          const count = data.find(item => item.tanod_id === tanod.id)?.count || 0;
          tanod.assignmentCount = count;
          return tanod;
        });
      } catch (err) {
        console.error('Fetch assignment counts failed:', err);
      }
    },
  },
};
</script>

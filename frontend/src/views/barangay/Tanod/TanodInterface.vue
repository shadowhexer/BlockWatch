<template>
  <div class="dashboard-container">
    <!-- Logo Section Outside the Dashboard -->
    <div class="logo-container">
      <img src="@/assets/logo.png" alt="logo" class="logo" />
      <img src="@/assets/buenavista.png" alt="logo" class="logo" />
      <img src="@/assets/mahay.png" alt="logo" class="logo" />
    </div>

    <!-- Welcome Message -->
    <h2 class="welcome">Welcome, {{ username }} 👮</h2>

    <!-- Section Title -->
    <h3 class="section-title">Barangay Reports</h3>

    <!-- Table for Barangay Reports -->
    <table v-if="assignments.length">
      <thead>
        <tr>
          <th>Crime ID</th>
          <th>Report</th>
          <th>Reported at</th>
          <th>Assigned at</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop through the assignments and display the report details -->
        <tr v-for="(a, index) in assignments" :key="index">
          <td>{{ a.crime_id }}</td>
          <td>{{ a.assignReport }}</td>
          <td>{{ a.date }}</td>
          <td>{{ a.assigned_at }}</td>
          <td>
            <span :class="a.status === 'verified' ? 'verified' : 'not-verified'">
              {{ a.status }}
            </span>
          </td>
          <td>
            <!-- Disable the button if the report is already verified -->
            <button
              @click="confirmVerification(index)"
              :class="a.status === 'verified' ? 'btn-unverify' : 'btn-verify'"
              :disabled="a.status === 'verified'"
            >
              {{ a.status === 'verified' ? 'Mark Unverified' : 'Mark Verified' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- No Data Message -->
    <div v-else class="no-data">
      <p>No assignments found</p>
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router';

export default {
  name: 'TanodDashboard',
  data() {
    return {
      username: '',
      assignments: []
    };
  },
  async created() {
    const route = useRoute();
    this.username = route.query.user || '';
    if (this.username) {
      await this.fetchAssignments();
    }
  },
  methods: {
    // Fetch assignments for the given user
    async fetchAssignments() {
      try {
        const res = await fetch(`http://localhost:3000/assign?user=${this.username}`);
        const data = await res.json();

        // Ensure that the 'status' field is properly initialized
        this.assignments = data.map(item => ({
          ...item,
          status: item.status || 'unverified'  // Default status to 'unverified' if not present
        }));
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    },

    // Method to confirm before toggling verification
    confirmVerification(index) {
      const action = this.assignments[index].status === 'verified' ? 'unverified' : 'verified';
      const message = `Are you sure you want to mark this report as ${action}?`;

      // Show confirmation dialog
      if (confirm(message)) {
        this.toggleVerification(index); // Toggle verification if user confirms
      }
    },

    // Toggle the verification status
    async toggleVerification(index) {
      const updatedStatus = this.assignments[index].status === 'verified' ? 'unverified' : 'verified';
      this.assignments[index].status = updatedStatus;

      // Send the updated assignment status to the server
      try {
        await this.updateAssignmentStatus(this.assignments[index].crime_id, updatedStatus);
      } catch (error) {
        console.error('Failed to update the assignment:', error);
      }
    },

    // Method to send updated status to the server
    async updateAssignmentStatus(crimeId, status) {
      try {
        const res = await fetch('http://localhost:3000/updateAssignmentStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            crime_id: crimeId,
            status: status,  // Send the correct 'status' value to the backend
          })
        });

        if (!res.ok) {
          throw new Error('Failed to update status on the server');
        }

        // Optionally, handle server response (e.g., show success message)
        console.log(`Crime ID ${crimeId} has been successfully ${status}`);
      } catch (err) {
        console.error('Error updating the assignment status:', err);
      }
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  width: 80%;
  margin: 50px auto;
  padding: 24px;
  font-family: 'Segoe UI', sans-serif;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.logo-container {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  width: 100px;
  height: auto;
}

.welcome,
.section-title {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th, table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #dee2e6;
}

table th {
  background-color: #f8f9fa;
}

.label {
  font-weight: 600;
  color: #2c3e50;
}

.status {
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 5px;
}

.verified {
  color: green;
  background-color: #eafaf1;
}

.not-verified {
  color: red;
  background-color: #fdecea;
}

.btn-verify,
.btn-unverify {
  border: none;
  padding: 6px 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
}

.btn-verify {
  background-color: #2ecc71;
  color: white;
}

.btn-unverify {
  background-color: #e74c3c;
  color: white;
}

.no-data {
  text-align: center;
  color: #888;
  font-size: 1rem;
  margin-top: 30px;
}
</style>


<style scoped>
.dashboard-container {
  width: 80%;
  margin: 50px auto;
  padding: 24px;
  font-family: 'Segoe UI', sans-serif;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.logo-container {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  width: 100px;
  height: auto;
}

.welcome,
.section-title {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th, table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #dee2e6;
}

table th {
  background-color: #f8f9fa;
}

.label {
  font-weight: 600;
  color: #2c3e50;
}

.status {
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 5px;
}

.verified {
  color: green;
  background-color: #eafaf1;
}

.not-verified {
  color: red;
  background-color: #fdecea;
}

.btn-verify,
.btn-unverify {
  border: none;
  padding: 6px 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
}

.btn-verify {
  background-color: #2ecc71;
  color: white;
}

.btn-unverify {
  background-color: #e74c3c;
  color: white;
}

.no-data {
  text-align: center;
  color: #888;
  font-size: 1rem;
  margin-top: 30px;
}
</style>

<template>
  <div class="container-fluid py-4 bg-dark text-light" style="min-height: 100vh;">
    <!-- Navbar Section -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center"></div>
      <div class="d-flex align-items-center">
        <!-- Search Input -->
        <input
          class="form-control me-3"
          type="search"
          v-model="searchTerm"
          placeholder="Search by Crime ID"
          @input="filterAssignments"
        />
        <!-- Avatar Dropdown for Logout -->
        <div class="dropdown">
          <img
            src="@/assets/logo.png"
            alt="Avatar"
            class="rounded-circle"
            width="50"
            height="50"
            id="avatarDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          />
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="avatarDropdown">
            <li>
              <button class="dropdown-item" @click="logout">
                <i class="bi bi-box-arrow-right me-2"></i> Logout
              </button>
            </li>
            <li>
              <button class="dropdown-item">
                <i class="bi bi-person-circle me-2"></i> Profile
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Crime Reports Card Section -->
    <div class="container bg-transparent text-light card shadow-lg">
      <div class="card-title text-light p-3">Assigned Reports</div>
      <div class="card-body">
        <!-- Responsive Cards for Assignments -->
        <div v-if="filteredAssignments.length" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          <div
            v-for="(a, index) in filteredAssignments"
            :key="index"
            class="col"
            style="cursor: pointer;"
            @click="toggleVerification(index)"
          >
            <div class="card p-3 bg-transparent boder border-1 text-light h-100">
              <div class="card-body">
                <h5 class="card-title">Crime ID: {{ a.crime_id }}</h5>
                <p class="card-text">Reported By: {{ a.assignReport }}</p>
                <p class="card-text">Reported At: {{ a.date }}</p>
                <p class="card-text">Assigned At: {{ a.assigned_at }}</p>
                <p class="card-text">
                  <span
                    :class="{
                      'badge bg-success': a.status === 'verified',
                      'badge bg-warning': a.status === 'unverified',
                      'badge bg-info': a.status === 'in-progress',
                    }"
                  >
                    {{ a.status }}
                  </span>
                </p>
                <button
                  class="btn btn-outline-info text-light fw-light"
                  :disabled="a.status === 'verified'"
                >
                  Mark as {{ a.status === 'verified' ? 'unverified' : 'verified' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data Message -->
        <div v-if="!filteredAssignments.length" class="text-center text-muted">
          No assignments found
        </div>
      </div>
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
      assignments: [],
      searchTerm: '',  // Search term bound to input
      filteredAssignments: [],  // Filtered list of assignments based on search
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
          status: item.status || 'unverified',  // Default status to 'unverified' if not present
        }));

        // Set the filtered assignments to the full list initially
        this.filteredAssignments = [...this.assignments];
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    },

    // Method to filter assignments based on the search term
    filterAssignments() {
      const searchTermLower = this.searchTerm.trim().toLowerCase();

      // If search term is empty, show all assignments
      if (!searchTermLower) {
        this.filteredAssignments = [...this.assignments];
        return;
      }

      // Filter the assignments based on exact crime_id match (case-insensitive)
      this.filteredAssignments = this.assignments.filter(assignment =>
        assignment.crime_id.toString().toLowerCase().includes(searchTermLower)
      );
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            crime_id: crimeId,
            status: status,  // Send the correct 'status' value to the backend
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update status on the server');
        }

        // Optionally, handle server response (e.g., show success message)
        console.log(`Crime ID ${crimeId} has been successfully ${status}`);
      } catch (err) {
        console.error('Error updating the assignment status:', err);
      }
    },

    // Handle logout action
    async logout() {
      console.log('Logging out...');

      try {
        const res = await fetch('http://localhost:3000/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (data.message === 'Logout successful') {
          // Redirect to login page after successful logout
          this.$router.push({ name: 'tanod-login' });
        } else {
          console.error('Logout failed:', data.error);
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    },
  },
};
</script>

<style scoped>
/* Add padding for card body */
.card-body {
  padding: 1rem;
}

/* Ensure buttons are styled properly */
button.btn-outline-info {
  width: 100%;
  margin-top: 1rem;
}

/* Style for table headers in case you decide to keep them visible for larger screens */
.table-responsive {
  display: none;
}

@media (min-width: 768px) {
  .table-responsive {
    display: block;
  }
}

</style>

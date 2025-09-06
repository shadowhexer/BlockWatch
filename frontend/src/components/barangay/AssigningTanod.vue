<template>
  <div class="row-container">
    <!-- Left Column: Reports -->
    <div class="column-box">
      <h3>📋 View Reports</h3>

      <ul class="list-group mt-3">
        <li
          class="list-group-item"
          v-for="(report, index) in reports"
          :key="index"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="col-4">
              <strong>{{ report.anonyname }}</strong>
            </div>
            <div class="col-5">
              <span>{{ report.description }}</span>
            </div>
            <div class="col-3 text-end">
              <span class="text-danger fw-bold">{{ report.status }}</span>
            </div>
          </div>

          <div>
            <!-- Check if the report has been assigned, if not show the tanod selection -->
            <div
              v-if="!isAssigned(report.crimeId)"
              class="d-flex align-items-center"
              style="border:3px solid #007bff; background:#e3f0ff; padding:16px; border-radius:8px; margin:8px 0; z-index:1000; position:relative;"
            >
              <select
                v-model="selectedTanod[report.crimeId]"
                @change="assignTanod(report, selectedTanod[report.crimeId])"
                class="form-select form-select-sm ms-2"
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
            <div v-else class="assigned-info">
              <div v-for="(assignment, index) in assignments" :key="index">
                <div v-if="assignment.crime_id == report.crimeId">
                  <span class="text-success">Assigned to: {{ assignment.assigned_to }}</span>
                  <span class="text-muted">Assigned at: {{ assignment.assigned_at }}</span>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Right Column: Tanods -->
    <div class="column-box">
      <h3>👮 Assigned Report Count</h3>

      <table v-if="tanods.length" class="table table-bordered">
        <thead>
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

      <p v-else class="no-records">No matching tanods found.</p>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';

export default {
  name: 'AssigningTanod',
  data() {
    return {
      tanods: [],
      reports: [],
      assignments: [],
      selectedTanod: reactive({}),  // Track selected tanods by crimeId
    };
  },
  async created() {
    await this.fetchTanods();
    await this.fetchReports();
    await this.fetchAssignments();
    await this.fetchAssignmentsCount();
  },
  methods: {
    // Fetch reports from the backend API
    async fetchReports() {
      try {
        const res = await fetch('http://localhost:3000/blockchain/reports');
        const data = await res.json();
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
      } catch (err) {
        console.error('Fetch reports failed:', err);
      }
    },

    // Fetch assignments from the backend API
    async fetchAssignments() {
      try {
        const res = await fetch('http://localhost:3000/assignments');
        if (!res.ok) {
          throw new Error('Failed to fetch assignments');
        }
        const data = await res.json();
        this.assignments = data.length > 0 ? data : [];
      } catch (err) {
        console.error('Fetch assignments failed:', err);
        this.assignments = [];
      }
    },

    // Fetch tanods from the backend API
    async fetchTanods() {
      try {
        const res = await fetch('http://localhost:3000/tanods');
        if (!res.ok) {
          throw new Error('Failed to fetch tanods');
        }
        this.tanods = await res.json();
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

        const res = await fetch('http://localhost:3000/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            crimeId: crimeId,
            tanodId: tanodId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Assignment failed');
        }

        const data = await res.json();
        if (data.message) {
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
          alert(data.error || 'Assignment failed');
        }
      } catch (error) {
        console.error('Assignment error:', error);
        alert(error.message);
      }
    },

    // Fetch assignment counts for each tanod
    async fetchAssignmentsCount() {
      try {
        const res = await fetch('http://localhost:3000/assignments/count');
        if (!res.ok) {
          throw new Error('Failed to fetch assignment counts');
        }
        const data = await res.json();

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


<style scoped>
.table {
  width: 100%;
  margin-top: 20px;
}

.table th,
.table td {
  text-align: left;
  padding: 10px;
}

.no-records {
  margin-top: 20px;
  font-style: italic;
  color: #888;
}
.row-container {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  padding: 20px;
  flex-wrap: wrap;
}

.column-box {
  flex: 1;
  min-width: 320px;
  max-width: 50%;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  background-color: #fff;
}

.list-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.no-records {
  color: #999;
  font-style: italic;
}
</style>

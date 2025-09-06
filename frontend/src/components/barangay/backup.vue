<template>
  <div class="row-container">
    <!-- Left Column: Reports -->
    <div class="column-box">
      <h3>📋 View Reports</h3>
      <input
        v-model="searchName"
        type="text"
        class="form-control my-2"
        placeholder="Search by anonymous name"
      />

      <ul class="list-group mt-3">
        <li
          class="list-group-item"
          v-for="(report, index) in filteredReports"
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

          <div style="font-size: 12px; color: #888;">
            Assigned? {{ isAssigned(report.crime_id) }} | crime_id: {{ report.crime_id }}
          </div>

          <div>
            <ul>
              <li
                class="list-group-item"
                v-for="(assignment, index) in filteredAssignments"
                :key="index"
              >
                <p v-if="assignment.crime_id === report.crime_id">
                  Assigned To: {{ assignment.assigned_to }}
                </p>
              </li>
            </ul>

            <div
              v-if="!isAssigned(report.crime_id)"
              class="d-flex align-items-center"
              style="border:3px solid #007bff; background:#e3f0ff; padding:16px; border-radius:8px; margin:8px 0; z-index:1000; position:relative;"
            >
              <select
                v-model="selectedTanod[report.crime_id]"
                @change="assignTanod(report, selectedTanod[report.crime_id])"
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

            <div v-else class="assigned-info">
              <span class="text-success">Assigned to: {{ getAssignedTo(report.crime_id) }}</span>
              <span class="text-muted">Assigned at: {{ getAssignedAt(report.crime_id) }}</span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Right Column: Tanods -->
    <div class="column-box">
      <h3>👮 Assigned Report Count</h3>
      <input
        v-model="searchTanod"
        type="text"
        class="form-control my-2"
        placeholder="Search tanod by username"
      />

      <table v-if="filteredTanods.length" class="table table-bordered">
        <thead>
          <tr>
            <th>Username</th>
            <th>Assigned Reports</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tanod in filteredTanods" :key="tanod.id">
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
export default {
  name: 'AssigningTanod',
  data() {
    return {
      tanods: [],
      reports: [],
      assignments: [],
      searchName: '',
      searchTanod: '',
      selectedTanod: {},
      activeAssignIndex: null,
    };
  },
  computed: {
    filteredAssignments() {
      const term = this.searchName.trim().toLowerCase();
      return term
        ? this.assignments.filter(assignment =>
            assignment.name.toLowerCase().includes(term)
          )
        : this.assignments;
    },

    filteredReports() {
      const term = this.searchName.trim().toLowerCase();
      return term
        ? this.reports.filter(report =>
            report.anonyname.toLowerCase().includes(term)
          )
        : this.reports;
    },

    filteredTanods() {
      const keyword = this.searchTanod.trim().toLowerCase();
      return keyword
        ? this.tanods.filter(t => t.username.toLowerCase().includes(keyword))
        : this.tanods;
    },
  },
  async created() {
    await this.fetchTanods();
    await this.fetchReports();
    await this.fetchAssignments();
    await this.fetchAssignmentsCount(); // Add this to update tanod count after data fetch
  },
  methods: {
    isAssigned(crime_id) {
      return this.assignments.some(
        assignment => assignment.crime_id === crime_id && assignment.assigned === 1
      );
    },

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

    async fetchReports() {
      try {
        const res = await fetch('https://localhost:3001/blockchain/reports');
        const data = await res.json();
        this.reports = data.map(report => {
          const assignment = this.assignments.find(a => a.crime_id === report.crime_id);
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

    // New method to fetch assignment counts for each tanod
    async fetchAssignmentsCount() {
      try {
        const res = await fetch('http://localhost:3000/assignments/count');
        if (!res.ok) {
          throw new Error('Failed to fetch assignment counts');
        }
        const data = await res.json();
        console.log('Fetched assignment counts:', data); // Log the fetched data to debug

        // Map the count of assignments to each tanod
        this.tanods = this.tanods.map(tanod => {
          const count = data.find(item => item.tanod_id === tanod.id)?.count || 0;
          tanod.assignmentCount = count;
          console.log(`Tanod ${tanod.username} assignment count: ${count}`); // Log for debugging
          return tanod;
        });
      } catch (err) {
        console.error('Fetch assignment counts failed:', err);
      }
    },

    async assignTanod(report, selectedValue) {
  if (this.isAssigned(report.crime_id)) {
    alert(`This report is already assigned to ${this.getAssignedTo(report.crime_id)}!`);
    return;
  }

  try {
    // Parse the selected tanod data
    const tanodData = JSON.parse(selectedValue);

    const res = await fetch('http://localhost:3000/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crimeId: report.crime_id,
        tanodId: tanodData.id,
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

      this.assignments.push({
        crime_id: report.crime_id,
        assigned_to: tanodData.name,
        assigned_at: report.assignedAt,
        assigned: 1,
      });

      // Clear selection for the report
      this.selectedTanod[report.crime_id] = null;  // Make sure we reset the specific report's selection

    } else {
      alert(data.error || 'Assignment failed');
    }
  } catch (error) {
    console.error('Assignment error:', error);
    alert(error.message);
  }
},


    getAssignedTo(crime_id) {
      const assignment = this.assignments.find(a => a.crime_id === crime_id);
      return assignment ? assignment.assigned_to : 'Not assigned';
    },

    getAssignedAt(crime_id) {
      const assignment = this.assignments.find(a => a.crime_id === crime_id);
      return assignment ? assignment.assigned_at : 'Not assigned';
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

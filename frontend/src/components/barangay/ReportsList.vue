<template>
  <div class="view-container">
    <section class="report-card">
      <h3>📋 View Reports</h3>
      <input
        v-model="searchName"
        type="text"
        class="search-box"
        placeholder="Search by anonymous name"
      />

      <div class="scrollable-report-list">
        <table class="report-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(report, index) in filteredReports"
              :key="index"
              class="report-item"
            >
              <td class="report-name">{{ report.name }}</td>
              <td class="status-text">{{ report.status }}</td>
              <td class="report-date">{{ report.date }}</td>
              <td>
                <button class="view-report-btn" @click="openModal(report.description)">View Report</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <button class="close-btn" @click="closeModal">✖️</button>
          <h3>Report Description</h3>
        </div>
        <div class="modal-body">
          <!-- Table to display report details -->
          <table class="modal-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Description:</strong></td>
                <td>{{ modalContent }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="read-full-btn" @click="ReportedRead">Read</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      reports: [],
      searchName: "",
      isModalOpen: false,
      modalContent: ""
    };
  },
  computed: {
    filteredReports() {
      const term = this.searchName.trim().toLowerCase();
      return term
        ? this.reports.filter(report =>
            report.name.toLowerCase().includes(term)
          )
        : this.reports;
    }
  },
  methods: {
    openModal(description) {
      this.modalContent = description;
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    ReportedRead() {
      alert("Report read.");
      // Redirect or load detailed content as needed
    }
  },
  async mounted() {
    try {
      const res = await fetch("http://localhost:3000/blockchain/reports");
      if (res.ok) {
        const data = await res.json();
        this.reports = data.map(report => ({
          name: report.anonyname,
          description: report.description,
          status: report.status,
          date: report.date,
        }));
      } else {
        console.error("Failed to fetch reports:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch blockchain reports:", err);
    }
  }
};
</script>

<style scoped>
.view-container {
  padding: 20px;
}

.report-card {
  background: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.search-box {
  width: 100%;
  padding: 8px 12px;
  margin-top: 10px;
  margin-bottom: 20px;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.scrollable-report-list {
  max-height: 400px;
  overflow-y: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.report-table th, .report-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.report-table th {
  background-color: #f8f9fa;
}

.report-name {
  font-weight: 600;
  color: #343a40;
}

.status-text {
  color: #dc3545;
  font-weight: bold;
}

.report-date {
  color: #6c757d;
  font-size: 0.9em;
}

.view-report-btn {
  background-color: #007bff; /* Blue color */
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.view-report-btn:hover {
  background-color: #0056b3; /* Darker blue for hover effect */
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 600px;
  position: relative;
  overflow-y: auto;
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #343a40;
}

.modal-header h3 {
  font-size: 1.5em;
  margin: 0;
}

.modal-body {
  padding: 15px;
  font-size: 1em;
  color: #343a40;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.modal-table {
  width: 100%;
  border-collapse: collapse;
}

.modal-table th, .modal-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.modal-table th {
  background-color: #f8f9fa;
}

.read-full-btn {
  background-color: #28a745;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 20px;
  display: block;
  width: 100%;
  text-align: center;
}

.read-full-btn:hover {
  background-color: #218838;
}
</style>

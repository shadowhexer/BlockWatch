<template>
  <div class="table-container">
    <!-- Verified Reports Table -->
    <p>✅</p>
    <table>
      <thead>
        <tr>
          <th>Report ID</th>
          <th>Report Title</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop through the reports and display only Verified ones -->
        <tr v-for="(report, index) in verifiedReports" :key="index">
          <td>{{ report.crimeId }}</td>
          <td>{{ report.description }}</td>
          <!-- Apply class using computed class method -->
          <td :class="getStatusClass(report.status)">{{ report.status }}</td>
          <td>{{ report.date }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Unverified Reports Table -->
    <p>❌</p>
    <table>
      <thead>
        <tr>
          <th>Report ID</th>
          <th>Report Title</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop through the reports and display only Unverified ones -->
        <tr v-for="(report, index) in unverifiedReports" :key="index">
          <td>{{ report.crimeId }}</td>
          <td>{{ report.description }}</td>
          <!-- Apply class using computed class method -->
          <td :class="getStatusClass(report.status)">{{ report.status }}</td>
          <td>{{ report.date }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "ReportList",
  data() {
    return {
      reports: [] // Array to hold reports data
    };
  },
  computed: {
    // Filter Verified reports
    verifiedReports() {
      return this.reports.filter(report => report.status === 'verified');
    },
    // Filter Unverified reports
    unverifiedReports() {
      return this.reports.filter(report => report.status === 'unverified');
    }
  },
  methods: {
    // Method to determine the class based on report status
    getStatusClass(status) {
      if (status === 'verified') {
        return 'verified'; // Return the 'verified' class
      }
      if (status === 'unverified') {
        return 'unverified'; // Return the 'unverified' class
      }
      return ''; // Default return in case no match
    },

    async fetchReports() {
      try {
        const response = await fetch('http://localhost:3000/blockchain/reports');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.reports = await response.json(); // Assign the fetched reports data
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    }
  },
  mounted() {
    this.fetchReports(); // Fetch reports when component is mounted
  }
};
</script>

<style scoped>
.table-container {
  width: 80%;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

table th, table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #dee2e6;
}

table th {
  background-color: #f8f9fa;
}

.verified {
  color: green;
}

.unverified {
  color: red;
}
</style>

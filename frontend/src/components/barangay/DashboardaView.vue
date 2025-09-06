<template>
  <div class="dashboard">
    <!-- Date Picker for Selecting a Date -->
    <div class="date-selector">
      <label for="report-date">Select Date:</label>
      <input type="date" v-model="selectedDate" @change="filterReportsByDate" />
    </div>

    <!-- Main Content Layout with Border (Table-like structure) -->
    <div class="main-content-container">
      <div class="main-content">
        <!-- Pie Chart for Crime Statistics (Small Picture) -->
        <h2>Crime Statistics Overview</h2>
        <div class="chart-container">
          <Pie :data="chartData" :options="chartOptions" :width="100" :height="100" />
        </div>

        <!-- Right-side Boxes for Report Information -->
        <div class="items">
          <div class="info-box blue">
            <h4>Today's Report Total</h4>
            <p>{{ computedTotalReports }}</p>
            <p>{{ reportsTodayPercentage }}% ({{ selectedDate }})</p>
          </div>
          <div class="info-box purple">
            <h4>Total Reports</h4>
            <p>{{ computedTotalReports }}</p>
            <p>{{ reportsPercentage }}% ({{ selectedDate }})</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Crime Stats (Remaining Content) -->
    <div class="stats-container">
      <h3>Crime Statistics</h3>
      <p>Total Reports: {{ computedTotalReports }}</p>
      <p>High Crime Reports: {{ highCrimeReports }}</p>
      <p>Low Crime Reports: {{ lowCrimeReports }}</p>
    </div>

    <!-- High Crime Reports Table -->
    <div class="crime-table">
      <h3>High Crime Reports</h3>
      <table>
        <thead>
          <tr>
            <th>Crime ID</th>
            <th>Description</th>
            <th>Anonymized Name</th>
            <th>Category</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(report, index) in highCrimeReportsList" :key="index">
            <td>{{ report.crimeId }}</td>
            <td>{{ report.description }}</td>
            <td>{{ report.anonyname }}</td>
            <td>{{ report.category }}</td>
            <td>{{ report.date }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Low Crime Reports Table -->
    <div class="crime-table">
      <h3>Low Crime Reports</h3>
      <table>
        <thead>
          <tr>
            <th>Crime ID</th>
            <th>Description</th>
            <th>Anonymized Name</th>
            <th>Category</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(report, index) in lowCrimeReportsList" :key="index">
            <td>{{ report.crimeId }}</td>
            <td>{{ report.description }}</td>
            <td>{{ report.anonyname }}</td>
            <td>{{ report.category }}</td>
            <td>{{ report.date}} </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
// Import necessary components from Vue-Chartjs and Axios
import { Pie } from 'vue-chartjs'
import axios from 'axios'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale)

export default {
  components: {
    Pie,
  },
  data() {
    return {
      crimeReports: [], // Empty array to store fetched reports
      totalReportsToday: 0, // Placeholder for today's total reports
      reportsTodayPercentage: 0, // Placeholder for today's report percentage
      totalReports: 0, // Placeholder for total reports
      reportsPercentage: 0, // Placeholder for percentage of total reports
      selectedDate: '', // Placeholder for selected date (formatted as YYYY-MM-DD)
      userIdentity: '', // Placeholder for user identity
    };
  },
  computed: {
    computedTotalReports() {
      return this.crimeReports.length;
    },
    highCrimeReports() {
      return this.crimeReports.filter((report) => report.category === "High").length;
    },
    lowCrimeReports() {
      return this.crimeReports.filter((report) => report.category === "Low").length;
    },
    highCrimeReportsList() {
      return this.crimeReports.filter((report) => report.category === "High");
    },
    lowCrimeReportsList() {
      return this.crimeReports.filter((report) => report.category === "Low");
    },
    chartData() {
      return {
        labels: ['High Crime', 'Low Crime'],
        datasets: [
          {
            data: [this.highCrimeReports, this.lowCrimeReports],
            backgroundColor: ['#FF6347', '#32CD32'], // Red for high, green for low
            hoverBackgroundColor: ['#FF4500', '#228B22'], // Darker shades for hover effect
            borderColor: ['#FFFFFF', '#FFFFFF'], // White borders for each segment
            borderWidth: 2,
          },
        ],
      };
    },
    chartOptions() {
      return {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              fontSize: 14,
            },
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const dataset = tooltipItem.dataset;
                const total = dataset.data.reduce((acc, value) => acc + value, 0);
                const percentage = ((tooltipItem.raw / total) * 100).toFixed(2);
                return `${tooltipItem.label}: ${tooltipItem.raw} reports (${percentage}%)`;
              },
            },
          },
        },
      };
    },
  },
created() {
  // Fetch data from the server when the component is created
  this.fetchCrimeReports();
},
methods: {
  getApiBase() {
    const isNgrok = location.hostname.includes("ngrok");
    return isNgrok
      ? `http://${location.hostname}`
      : "http://localhost:3000";
  },
  async fetchUserIdentity() {
    try {
      const response = await fetch("http://localhost:3000/get-identity-session", {
        method: "GET",
        credentials: "include",  // Ensure cookies (session) are sent
      });

      if (response.ok) {
        const data = await response.json();
        this.userIdentity = data.userIdentity; // Store user identity in data
        console.log("User Identity:", this.userIdentity); // Log to confirm it
      } else {
        const errorData = await response.json();
        console.error("Failed to retrieve user identity:", errorData.message);
      }
    } catch (error) {
      console.error("Error fetching user identity:", error);
    }
  },
 async fetchCrimeReports() {
  const apiBase = this.getApiBase();

  try {
    // Get the current userIdentity (this could be set on login or by some other logic in your app)
    const userIdentity = this.userIdentity || 'org1-admin';  // Default to org1-admin if not set

    // Add userIdentity to the API request
    const response = await axios.get(`${apiBase}/blockchain/reports?userIdentity=${encodeURIComponent(userIdentity)}`, {
      method: "GET",
      withCredentials: true,  // Include cookies with the request
    });

    const data = response.data;
    if (data && data.length > 0) {
      this.crimeReports = data;
    }

    // Optionally calculate the total reports today and percentage
    this.totalReports = this.crimeReports.length;

    // If you want to calculate reports today (assuming 'High' category is for today's reports)
    this.totalReportsToday = this.crimeReports.filter(report => report.category === 'High').length;
    this.reportsTodayPercentage = (this.totalReportsToday / this.totalReports * 100).toFixed(2);
  } catch (error) {
    console.error('Error fetching crime reports:', error);
  }
}
,

    filterReportsByDate() {
      if (this.selectedDate) {
        // Convert the selected date (DD/MM/YY) to match the format of report.date
        const formattedSelectedDate = this.convertToISOFormat(this.selectedDate);

        // Filter reports based on selected date (convert report.date to DD/MM/YY for comparison)
        const filteredReports = this.crimeReports.filter(report => {
          const formattedReportDate = this.convertToDDMMYY(report.date); // Convert report date to DD/MM/YY
          return formattedReportDate === formattedSelectedDate;
        });

        // Log the filtered reports to the console for debugging
        console.log("Filtered Reports:", filteredReports);

        // Update the crimeReports array with the filtered data
        this.crimeReports = filteredReports;
      } else {
        this.fetchCrimeReports(); // Reset to full reports if no date selected
      }
    },

    // Method to convert a date to DD/MM/YY format
    convertToDDMMYY(date) {
      const reportDate = new Date(date); // Convert string to Date object
      const day = String(reportDate.getDate()).padStart(2, '0'); // Get day and pad with zero if necessary
      const month = String(reportDate.getMonth() + 1).padStart(2, '0'); // Get month and pad with zero if necessary
      const year = String(reportDate.getFullYear()).slice(-2); // Get last two digits of year (YY)
      return `${day}/${month}/${year}`;
    },

    // Method to convert selected date (DD/MM/YY) to YYYY-MM-DD for comparison with report date
    convertToISOFormat(date) {
      const [day, month, year] = date.split('/');
      const fullYear = `20${year}`; // Assuming year is in YY format (e.g., 2025)
      return `${fullYear}-${month}-${day}`;
    },
  },

};
</script>

<style scoped>
.dashboard {
  padding: 20px;
  font-family: Arial, sans-serif;
  position: relative;
}

.main-content-container {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.main-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.chart-container {
  width: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
}

.items {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 70%;
}

.info-box {
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  color: white;
  width: 45%; /* Two boxes per row */
}

.blue {
  background-color: #4D9BF9;
}

.purple {
  background-color: #6F42C1;
}

.red {
  background-color: #D9534F;
}

.orange {
  background-color: #F0AD4E;
}

.stats-container,
.crime-table {
  margin: 20px 0;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.stats-container p {
  font-size: 16px;
}

.crime-table table {
  width: 100%;
  border-collapse: collapse;
}

.crime-table th, .crime-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.crime-table th {
  background-color: #f2f2f2;
}

.date-selector {
  margin-bottom: 20px;
}

.date-selector label {
  font-size: 16px;
  margin-right: 10px;
}

.date-selector input {
  padding: 5px;
  font-size: 14px;
}
</style>

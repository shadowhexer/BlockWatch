<template>
  <div class="container py-4 bg-dark text-white">
    <!-- Section 1: Crime Statistics Overview -->
    <div class="row mb-4">
      <h2 class="mb-3">Crime Statistics Overview</h2>
      <div class="col-12 col-md-5">
        <div class="card bg-transparent border border-light text-white">
          <div class="card-body">
            <h4 class="card-title">Reports Overview</h4>
            <div class="chart-container text-center">
              <div class="pie-chart">
                <Pie :data="chartData" :options="chartOptions" :width="200" :height="100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Info Column -->
      <div class="col-12 col-md-4 me-4 mt-5">
        <div class="row">
          <div class="col-12 mb-3">
            <div class="card bg-transparent border border-light mb-3">
              <div class="card-body">
                <h4 class="card-title text-light">Today's Report Total</h4>
                <p class="card-text text-info bold fs-2 fw-bold">{{ computedTotalReports }}</p>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div class="card text-info bg-transparent border border-light mb-3">
              <div class="card-body">
                <h4 class="card-title text-light">Report percentage</h4>
                <p class="card-text text-info fs-2">{{ reportsTodayPercentage }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Crime Statistics Summary -->
    <div class="row mb-5">
      <div class="col-12">
        <h3>Crime Statistics</h3>
        <div class="row">
          <div class="col-md-4">
            <div class="card text-secondary bg-transparent border border-success mb-3">
              <div class="card-body">
                <h4 class="card-title">Total of Verified Reports</h4>
                <p class="card-text text-light fs-3 fw-bold">{{ computedTotalReports }}</p>
                <progress :value="computedTotalReports" class="bg-success"></progress>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-secondary bg-transparent border border-danger mb-3">
              <div class="card-body">
                <h4 class="card-title">High Crime Reports</h4>
                <p class="card-text text-light fs-3 fw-bold">{{ highCrimeReports }}</p>
                <progress :value="highCrimeReports" class="bg-danger"></progress>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card text-secondary bg-transparent border border-info mb-3">
              <div class="card-body">
                <h4 class="card-title">Low Crime Reports</h4>
                <p class="card-text text-light fs-3 fw-bold">{{ lowCrimeReports }}</p>
                <progress :value="lowCrimeReports" :max="computedTotalReports" class="bg-info"></progress>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

   <!-- Section 3: High Crime Reports Table -->
<div class="row mb-4">
  <div class="col-12">
    <h3>High Crime Reports</h3>
    <!-- Check if there are any high crime reports -->
    <template v-if="highCrimeReportsList.length > 0">
      <table class="table table-bordered table-dark">
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
    </template>
    <!-- If there are no high crime reports -->
    <template v-else>
      <p class="text-danger">No reported high crimes.</p>
    </template>
  </div>
</div>

<!-- Section 4: Low Crime Reports Table -->
<div class="row mb-4">
  <div class="col-12">
    <h3>Low Crime Reports</h3>
    <!-- Check if there are any low crime reports -->
    <template v-if="lowCrimeReportsList.length > 0">
      <table class="table table-bordered table-dark">
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
            <td>{{ report.date }}</td>
          </tr>
        </tbody>
      </table>
    </template>
    <!-- If there are no low crime reports -->
    <template v-else>
      <p class="text-danger">No reported low crimes.</p>
    </template>
  </div>
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
    this.fetchUserIdentity();
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
        const response = await axios.get('http://localhost:3000/get-identity-session', {
          withCredentials: true,
        });

        if (response.status === 200) {
          this.userIdentity = response.data.userIdentity;
          this.fetchCrimeReports();
        } else {
          console.error("Failed to retrieve user identity:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    },

    async fetchCrimeReports() {
      const apiBase = this.getApiBase();

      try {
        const userIdentity = this.userIdentity;

        const response = await axios.get(`${apiBase}/blockchain/reports?userIdentity=${encodeURIComponent(userIdentity)}`, {
          method: "GET",
          withCredentials: true,
        });

        this.crimeReports = response.data;

        // Calculate today's reports and percentages
        this.totalReports = this.crimeReports.length;
        this.totalReportsToday = this.crimeReports.filter(report => report.category === 'High').length;
        this.reportsTodayPercentage = (this.totalReportsToday / this.totalReports * 100).toFixed(2);

        // Handle cases where there are no high crime reports
        if (this.highCrimeReports === 0) {
          this.reportsTodayPercentage = (this.lowCrimeReports / this.totalReports * 100).toFixed(2);
        }

      } catch (error) {
        console.error("Error fetching crime reports:", error);
      }
    },
  },
};
</script>

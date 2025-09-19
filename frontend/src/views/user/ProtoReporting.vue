<template>
  <div class="container-fluid bg-dark text-light min-vh-100">
    <!-- User Guide Popup -->
    <UserGuide v-if="isVisible" @close-guide="closeGuidePopup" />

    <!-- Header Section -->
    <header class="sticky-top bg-dark bg-opacity-75 border-bottom">
      <div class="d-flex justify-content-between align-items-center p-3">
        <h1 class="text-primary fw-bold mb-0">BlockWatch</h1>
        <nav class="d-none d-md-flex">
          <a href="#" :class="{'text-secondary': activeTab !== 'report', 'text-primary': activeTab === 'report'}" @click="toggleTab('report')" class="px-3 nav-link">
            <i class="bi bi-pencil-square"></i> Write a Report
          </a>
          <a href="#" :class="{'text-secondary': activeTab !== 'track', 'text-primary': activeTab === 'track'}" @click="toggleTab('track')" class="px-3 nav-link">
            <i class="bi bi-file-earmark-text"></i> View Reports
          </a>
          <a href="#" :class="{'text-secondary': activeTab !== 'guide', 'text-primary': activeTab === 'guide'}" @click="toggleTab('guide')" class="px-3 nav-link">
            <i class="bi bi-question-circle"></i> User Guide
          </a>
        </nav>
        <!-- Mobile Navigation -->
        <nav class="d-md-none">
          <a href="#" :class="{'text-secondary': activeTab !== 'report', 'text-primary': activeTab === 'report'}" @click="toggleTab('report')" class="px-3">
            <i class="bi bi-pencil-square"></i>
          </a>
          <a href="#" :class="{'text-secondary': activeTab !== 'track', 'text-primary': activeTab === 'track'}" @click="toggleTab('track')" class="px-3">
            <i class="bi bi-file-earmark-text"></i>
          </a>
          <a href="#" :class="{'text-secondary': activeTab !== 'guide', 'text-primary': activeTab === 'guide'}" @click="toggleTab('guide')" class="px-3">
            <i class="bi bi-question-circle"></i>
          </a>
        </nav>
      </div>
    </header>

    <!-- Tabs Navigation (Visible on Desktop) -->
    <div class="mt-3 d-none d-md-flex">
      <div class="d-flex gap-3 justify-content-start mx-auto" style="width: 80%;">
        <button class="btn btn-outline-secondary w-20" :class="{'active': activeTab === 'report'}" @click="toggleTab('report')">
          Report an Activity
        </button>
        <button class="btn btn-outline-secondary w-20" :class="{'active': activeTab === 'track'}" @click="toggleTab('track')">
          Track a Report
        </button>
        <button class="btn btn-outline-secondary w-20" :class="{'active': activeTab === 'guide'}" @click="toggleTab('guide')">
          User Guide
        </button>
      </div>
    </div>

    <!-- Report Activity Content -->
    <div v-if="activeTab === 'report'" class="tab-content mt-3 mx-auto" style="width: 80%;">
      <div class="bg-dark text-light p-4 rounded-3 mb-4">
        <h4>File a New Incident Report</h4>
        <p>Your report will be added to the decentralized ledger. Please provide accurate information.</p>

        <div class="mb-3">
          <label for="anonymousName" class="form-label">Your Anonymous Name</label>
          <input v-model="anonymousName" id="anonymousName" type="text" class="form-control custom-input" placeholder="e.g. Witness101" />
        </div>

        <div class="mb-3">
          <label for="incidentDescription" class="form-label">Incident Description</label>
          <textarea v-model="description" id="incidentDescription" rows="4" class="form-control custom-input" placeholder="Describe what happened..."></textarea>
        </div>

        <!-- File Upload -->
        <div class="mt-3">
          <label for="file-upload" class="btn btn-primary">
            <i class="bi bi-upload"></i> Upload an Image or Video
          </label>
          <input id="file-upload" type="file" name="file[]" @change="handleFileSelection" multiple class="d-none" />
          <p v-if="uploadStatus">{{ uploadStatus }}</p>

          <!-- Preview Images or Videos -->
            <div v-if="previewUrls.length" class="mt-3">
              <div class="d-flex flex-wrap">
                <div v-for="(url, index) in previewUrls" :key="index" class="me-3 mb-3 position-relative" style="width: 80px; height: 80px;">
                  <!-- Image Preview -->
                  <img v-if="isImage(url)" :src="url" alt="Preview" class="preview-img" />

                  <!-- Video Preview -->
                  <video v-else-if="isVideo(url)" :src="url" controls class="preview-img"></video>

                  <!-- Remove Preview -->
                  <i @click="removePreview(index)" class="bi bi-x-octagon cursor-pointer position-absolute top-0 end-0 text-black"></i>
                </div>
              </div>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="d-flex justify-content-end mt-3">
          <button class="btn btn-primary" @click="submitReport">Submit Report</button>
        </div>
      </div>
    </div>

    <!-- Track Report Content -->
  <div v-if="activeTab === 'track'" class="tab-content mt-3 mx-auto" style="width: 80%;">
  <div class="bg-dark text-light p-4 rounded-3 mb-4">
    <h3>📋 View Tracking Reports</h3>
    <input v-model="searchName" type="text" class="form-control custom-input my-2" placeholder="Search by anonymous name" />

    <div class="mt-3">
      <!-- Report Status Filters -->
      <div class="d-flex gap-2 mb-3">
        <span class="badge bg-primary">unverified</span>
        <span class="badge bg-secondary">in progress</span>
        <span class="badge bg-success">verified</span>
      </div>

      <!-- Cards for Each Report -->
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        <div
          v-for="(report, index) in filteredReports"
          :key="index"
          class="col"
        >
          <div class="card bg-dark text-light shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Alias: {{ report.name }}</h5>
               <p class="card-text">
                <strong>Reported Incidents: </strong>
                <span> {{ report.description }}</span>
               </p>
              <p class="card-text">
                <strong>Report Status: </strong>
                <span :class="getStatusClass(report.status)">{{ report.status }}</span>
              </p>
             <div class="card-text">
              <p>{{ report.message ? report.message : "No message provided" }}</p>
            </div>
              <!-- Message Section -->
              <div class="d-flex gap-2 mt-3">
                <i class="bi bi-chat-dots"></i>
                <input
                  v-model="report.message"
                  placeholder="Message to follow up"
                  class="form-control d-inline-block w-75 bg-dark text-light p-2"
                />
                <i class="bi bi-send pt-2 cursor ms-auto" @click="sendMessage(report)">send</i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-if="!filteredReports.length" class="text-center text-muted mt-4">
        No reports found matching your search.
      </div>
    </div>
  </div>
</div>


    <!-- User Guide Content -->
    <div v-if="activeTab === 'guide'" class="tab-content mt-3 mx-auto" style="width: 80%;">
      <div class="bg-dark text-light p-4 rounded-3 text-center">
        <button class="btn btn-info" @click="showGuide">Watch Guide</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styles for the inputs */
.custom-input {
  background-color: #202223;
  border: 1px solid white;
  color: white;
}

.custom-input::placeholder {
  color: white;
}

.custom-input:focus {
  background-color: #313537;
  border: 1px solid #1193d4;
  outline: none;
}

.cursor{
  cursor: pointer;
}

/* Remove underlines from the navigation links */
.nav-link {
  text-decoration: none;
}

.preview-img {
  width: 100%;  /* Ensures the image/video fits the container */
  height: 100%;  /* Ensures the image/video fits the container */
  object-fit: cover;  /* Maintains the aspect ratio without distortion */
  border: 1px solid white;  /* Optional: Adds a border around the preview */
  border-radius: 4px;  /* Optional: Rounds the corners */
}

.preview-img:hover {
  opacity: 0.8;  /* Optional: Add hover effect */
}
</style>

<script>
import axios from 'axios';
import UserGuide from '@/components/user/UserGuide.vue';

export default {
  components: {
    UserGuide,
  },
  data() {
    return {
      anonymousName: '',
      description: '',
      reports: [],
      searchName: '',
      uploadStatus: '',
      isVisible: false,
      activeTab: 'guide',
      userIdentity: '',
      previewUrls: [], // Array to store URLs of preview images or videos
      uploadedFileNames: [], // Store the file names for removal
    };
  },
  computed: {
    filteredReports() {
      if (!this.searchName.trim()) return this.reports;
      return this.reports.filter(r => r.name.toLowerCase().includes(this.searchName.toLowerCase()));
    },
  },
  methods: {
    toggleTab(tab) {
      if (this.activeTab === tab) {
        this.activeTab = '';
      } else {
        this.activeTab = tab;
      }
    },
    getStatusClass(status) {
      switch (status) {
        case 'unverified':
          return 'badge bg-primary';
        case 'in progress':
          return 'badge bg-secondary';
        case 'verified':
          return 'badge bg-success';
        default:
          return 'badge bg-light text-dark';
      }
    },
    showGuide() {
      this.isVisible = true;
    },
    closeGuidePopup() {
      this.isVisible = false;
    },
    handleFileSelection(event) {
      const files = event.target.files;  // Get all selected files
      if (!files.length) return;  // No files selected

      // Reset previous preview URLs and file names
      this.previewUrls = [];
      this.uploadedFileNames = [];

      // Create FormData for uploading files
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('file[]', file);  // Append each file to FormData
      });

      // Send the files to the server
      axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        // Assuming the response contains the URLs of the uploaded files
        this.uploadedFileNames = response.data.fileNames; // Store file names for potential removal
        this.previewUrls = response.data.fileUrls;  // Media links returned by the backend
        this.uploadStatus = 'Files uploaded successfully';
      })
      .catch((error) => {
        this.uploadStatus = 'Error uploading files.';
        console.error(error);
      });
    },

    // Remove file preview
    removePreview(index) {
      const fileName = this.uploadedFileNames[index];

      // Send a request to delete the file from the server
      axios.delete(`http://localhost:3000/delete-file/${fileName}`)
        .then(() => {
          // Remove the preview URL and file name from the arrays
          this.previewUrls.splice(index, 1);
          this.uploadedFileNames.splice(index, 1);
          this.uploadStatus = '';
        })
        .catch(() => {
          this.uploadStatus = 'Error removing file.';
        });
    },

    submitReport() {
      if (!this.anonymousName.trim()) {
        alert('Please enter your anonymous name.');
        return;
      }

      if (!this.description.trim()) {
        alert('Please enter a crime description.');
        return;
      }

      const formData = new FormData();
      formData.append('anonyname', this.anonymousName);
      formData.append('description', this.description);
      formData.append('userIdentity', this.userIdentity);

      // Add file(s) to formData
      const fileInput = document.getElementById('file-upload');
      const files = fileInput.files;
      if (files.length > 0) {
        Array.from(files).forEach((file) => {
          formData.append('file[]', file);  // Append each file
        });
      }

      // Show upload status
      this.uploadStatus = 'Uploading...';

      // Send the form data to the server
      axios.post('http://localhost:3000/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        alert('Report submitted successfully!');
      })
      .catch((error) => {
        this.uploadStatus = 'Error uploading file.';
        console.error(error);
      });

      // Reset form fields after submission
      this.anonymousName = '';
      this.description = '';
      this.previewUrls = [];
      this.uploadedFileNames = [];
    },

    async fetchUserIdentity() {
      try {
        const response = await axios.get("http://localhost:3000/get-identity-session", { withCredentials: true });
        this.userIdentity = response.data.userIdentity || '';
        console.log("Fetched user identity:", this.userIdentity);
        if (this.userIdentity) {
          this.fetchReports(this.userIdentity);
        }
      } catch (error) {
        console.error("Error fetching user identity:", error);
      }
    },

    async fetchReports(userIdentity) {
      if (!userIdentity) {
        console.warn("User identity is not set. Cannot fetch reports.");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/reports?userIdentity=${userIdentity}`, {
          withCredentials: true,
        });
        this.reports = response.data || [];
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    },

    sendMessage(report) {
      console.log('Sending message for report:', report);
    },

    isImage(url) {
      return url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg');
    },

    isVideo(url) {
      return url.endsWith('.mp4') || url.endsWith('.webm');
    },
  },
  mounted() {
    this.fetchUserIdentity();
  },
  watch: {
    userIdentity(newVal) {
      if (newVal) {
        this.fetchReports(newVal);
      }
    },
  },
};
</script>

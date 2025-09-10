<template>
  <div class="container">
    <!-- User Guide Popup -->
    <UserGuide v-if="isVisible" @close-guide="closeGuidePopup" />

    <!-- Tabs Navigation (Vertical & Centered) -->
    <div class="tabs-container">
      <div class="tabs">
        <!-- Report an Activity Tab -->
        <button class="btn btn-primary" :class="{ active: activeTab === 'report' }" @click="toggleTab('report')">
          Report an Activity
        </button>

        <!-- Track a Report Tab -->
        <button class="btn btn-primary" :class="{ active: activeTab === 'track' }" @click="toggleTab('track')">
          Track a Report
        </button>

        <!-- User Guide Tab -->
        <button class="btn btn-primary" :class="{ active: activeTab === 'guide' }" @click="toggleTab('guide')">
          User Guide
        </button>
      </div>
    </div>

    <!-- Report Activity Content -->
    <div v-if="activeTab === 'report'" class="tab-content">
      <div class="content-box">
        <h3 style="text-align: center; padding-bottom: 2%;">📝 Report an Illegal Activity</h3>

        <div class="form-group">
          <label>Your Anonymous Name</label>
          <input v-model="anonymousName" type="text" class="form-control" placeholder="e.g. Witness101" />
        </div>

        <div class="form-group">
          <label>Crime Description</label>
          <textarea v-model="description" rows="4" class="form-control" placeholder="Describe what happened..."></textarea>
        </div>

        <div class="upload-icon-container">
          <label for="file-upload" class="upload-label">
            <i class='bx bx-upload'></i> Upload an Image or Video
          </label>
          <input id="file-upload" type="file" @change="handleFileUpload" multiple style="display:none;" />
          <p v-if="uploadStatus">{{ uploadStatus }}</p>

           <!-- Preview Images or Videos -->
          <div v-if="previewUrls.length" class="preview-container">
            <div v-for="(url, index) in previewUrls" :key="index" class="preview-item">
              <img v-if="isImage(url)" :src="url" alt="Preview" class="preview-img" />
              <video v-else-if="isVideo(url)" :src="url" controls class="preview-video"></video>

              <!-- "X" icon to remove preview -->
              <i @click="removePreview(index)" class="remove-icon bx bx-x"></i>
            </div>
          </div>
        </div>

        <div class="submit-btn">
          <button class="btn mt-3" @click="submitReport"><i class='bx bx-send'></i> Submit</button>
        </div>
      </div>
    </div>

    <!-- Track Report Content -->
    <div v-if="activeTab === 'track'" class="tab-content">
      <div class="content-box">
        <h3 style="text-align: center; padding-bottom: 2%;">📋 View Tracking Reports</h3>
        <input v-model="searchName" type="text" class="form-control my-2" placeholder="Search by anonymous name" />

        <ul class="list-group status-container">
          <div class="status-labels">
            <span :class="{'text-danger': 'unverified'}">unverified</span>
            <span :class="{'text-primary': 'in-progress'}">in progress</span>
            <span :class="{'text-success': 'verified'}">verified</span>
          </div>
          <div class="scrollable-reports">
              <li class="list-group-item" v-for="(report, index) in filteredReports" :key="index">
                  <p>Alias: {{ report.name }}</p>
                  Report Status: <span
                  :class="{
                    'status-label': true,
                    'unverified': report.status === 'unverified',
                    'in-progress': report.status === 'in-progress',
                    'verified': report.status === 'verified'
                  }">
                  {{ report.status }}
                </span>

                  <div class="chat mt-2">
                    <i class='bx  bx-message'></i>
                    <input v-model="report.message" placeholder="Message to follow up" class="form-control" />
                    <i class='bx bx-send pt-2' @click="sendMessage(report)" style="cursor: pointer;"> send</i>
                  </div>
              </li>
           </div>
        </ul>
      </div>
    </div>

    <!-- User Guide Content -->
    <div v-if="activeTab === 'guide'" class="tab-content">
      <div class="content-box text-center w-100">
        <button class="btn btn-info" @click="showGuide">Watch Guide</button>
      </div>
    </div>
  </div>
</template>

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
      previewUrls: [],
      uploadedFileNames: [],
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
    showGuide() {
      this.isVisible = true;
    },
    closeGuidePopup() {
      this.isVisible = false;
    },
    handleClickOutside(event) {
      const content = this.$el.querySelector('.tab-content');
      if (content && !content.contains(event.target)) {
        this.activeTab = '';  // Hide tab content if clicked outside
      }
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      // Show upload status
      this.uploadStatus = 'Uploading...';

      // Send the file to the server
      axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        // Assuming the response contains the URL of the uploaded file
        this.previewUrls.push(response.data.fileUrl); // URL returned from the server
        this.uploadedFileNames.push(response.data.fileName); // Store the file name for deletion
      })
      .catch(() => {
        this.uploadStatus = 'Error uploading file.';
      });
    },
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

      axios.post('http://localhost:3000/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        alert('Report submitted.');
        this.fetchReports();
      })
      .catch(() => {
        alert('Server error.');
      });

      this.anonymousName = '';
      this.description = '';
    },
    async fetchUserIdentity() {
      try {
        const response = await axios.get("http://localhost:3000/get-identity-session", { withCredentials: true });
        this.userIdentity = response.data.userIdentity || '';
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

<style scoped>
/* Fullscreen layout */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;  /* Full viewport height */
  background-color: black;
  padding: 20px;
  max-width: 100%;
  overflow-y: auto;
}
.scrollable-reports {
  max-height: 250px; /* Adjust the height as needed */
  overflow-y: auto; /* Enable vertical scrolling */
  margin-top: 10px;
}
/* Make .btn gray with white text */
.btn {
  text-align: center;
  background-color: #dededc;
  color: #494949;
  border: none;
  width: 150px;
}

.btn:hover {
  background-color: #5a5a5a;
  color: #fff;
}

/* Center the submit button */
.submit-btn {
  display: flex;
  justify-content: center;
  align-items: center;
}
.upload-container {
  margin-top: 20px;
}

.upload-label {
  cursor: pointer;
}

.preview-container {
  margin-top: 20px;
  text-align: center;
  position: relative; /* Needed for absolute positioning of the "X" icon */
}

.preview-img {
  max-width: 100%;
  height: auto;
}

.preview-video {
  max-width: 100%;
  height: auto;
}

/* Style for the "X" icon */
.remove-icon {
  width: 30px;
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 30px;
  color: red;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  padding: 5px;
}

.remove-icon:hover {
  color: white;
  background-color: rgba(255, 0, 0, 0.8);
}
/* Tabs Container */
.tabs-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
  height: 100px; /* Adjust as needed for vertical centering */
}

.tabs {
  margin-top: 100px;
  display: flex;
  flex-direction: row;  /* Horizontal layout for buttons */
  place-items: center;
  justify-content: center;  /* Center buttons horizontally */
  width: 100%;  /* Ensure the buttons span full width */
}

.tabs button {
  border: none;
  background-color: #7A7A73;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  margin: 5px 10px;  /* Space between buttons */
  font-size: 18px;  /* Adjust font size */
  flex: 1;  /* Allow buttons to adjust equally */
}

.tabs button.active {
  background-color: green;
  color: white;
}

/* General Tab Content */
.tab-content {
  width: 100%;  /* Ensure content spans full width */
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Content Box */
.content-box {
  border: 2px solid #11f905;
  background-color: #434343;
  color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  width: 100%;  /* Ensure content spans full width */
  max-width: 800px;  /* Add max-width for better readability */
  margin-top: 20px;
}

/* Add padding-bottom to form-group */
.form-group {
  padding-bottom: 16px;
}

.status-labels {
  display: flex;
  background-color: #2c2c2c;
  border-radius: 10px;
  justify-content: space-between;
  width: 100%;
  padding: 10px;
}

.unverified {
  color: #ff4f61;
}

.in-progress {
  color: #0385ff;
}

.verified {
  color: #00ff3c;
}

.preview-container {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.preview-img {
  max-width: 80px;
  max-height: 80px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.preview-video {
  max-width: 120px;
  max-height: 80px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.list-group-item{
  background-color: transparent;
  color: white;
  border: none;
  margin-bottom: 10px;
}

/* Responsive Media Queries */
@media (max-width: 768px) {
  .tabs {
    flex-direction: column;  /* Stack buttons vertically on medium screens */
  }

  .tabs button {
    width: 100%;  /* Buttons will take full width on smaller screens */
    font-size: 16px;
    padding: 15px 20px;
  }

  .content-box {
    padding: 15px;
    width: 95%;  /* Allow more room for smaller screens */
  }

  .form-control {
    padding: 8px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .tabs button {
    font-size: 14px;
    padding: 12px 18px;
  }

  .content-box {
    padding: 10px;
  }

  .btn {
    padding: 10px;
    font-size: 14px;
  }

  .form-control {
    padding: 6px;
    font-size: 12px;
  }
}

</style>


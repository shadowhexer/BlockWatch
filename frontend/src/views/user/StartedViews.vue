<template>
  <div id="user-identity">
    <img src="@/assets/logo.png" alt="logo" class="logo" />
    <div class="container">
      <!-- Display identity -->
      <div v-if="userIdentity" class="form-group">
        <label for="identity">Your Location: </label>
        <p>{{ userIdentity }}</p>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading">
        <p>Loading...</p>
        <!-- Optionally, you can add a spinner here -->
      </div>

      <!-- Connect Button -->
      <button @click="connectToFabric" :disabled="!userIdentity || isLoading" class="btn btn-primary">Continue</button>

      <!-- Status Message -->
      <p v-if="connectionStatus" :style="{ color: statusColor }">{{ connectionStatus }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userIdentity: "", // To store the fetched identity
      connectionStatus: "", // To store connection status message
      statusColor: "black", // Status message color
      isLoading: false, // To show a loading spinner or message
    };
  },
  methods: {
    // Get user's coordinates and determine identity dynamically
    getCurrentLocation() {
      if (navigator.geolocation) {
        const options = {
          enableHighAccuracy: true, // Optional, but allows more precise location
          timeout: 15000, // Timeout after 10 seconds
          maximumAge: 0, // Force a fresh request every time
        };

        this.isLoading = true; // Start loading
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            this.reverseGeocode(latitude, longitude); // Proceed with reverse geocoding
          },
          (error) => {
            let errorMessage = "Unknown error";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "User denied the request for Geolocation.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage = "The request to get user location timed out.";
                break;
              case error.UNKNOWN_ERROR:
                errorMessage = "An unknown error occurred.";
                break;
            }

            console.error("Error getting location: ", error);
            this.connectionStatus = `❌ Error: ${errorMessage}`;
            this.statusColor = "red";
            this.isLoading = false; // Stop loading
          },
          options // Pass options as the third parameter
        );
      } else {
        this.connectionStatus = "❌ Geolocation is not supported by this browser.";
        this.statusColor = "red";
        this.isLoading = false; // Stop loading
      }
    },

    reverseGeocode(latitude, longitude) {
      // Construct the proper URL with the API key and location
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=40ab30f288d142e9bc097f4b490d76f9`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          // Check if the response contains any geocoding result
          if (data.features && data.features.length > 0) {
            const displayName = data.features[0].properties.formatted; // Get the full address

            // Match the address with known values like "Mahay" or "Buenavista"
            if (displayName.includes("Mahay")) {
              this.userIdentity = "Mahay"; // Set identity to "Mahay"
              this.connectionStatus = "Identity: Brgy. Mahay found!";
              this.statusColor = "green";
            } else if (displayName.includes("Buenavista")) {
              this.userIdentity = "Buenavista"; // Set identity to "Buenavista"
              this.connectionStatus = "Identity: Brgy. Buenavista found!";
              this.statusColor = "green";
            } else {
              this.userIdentity = displayName; // Use the full address if neither is found
              this.connectionStatus = "Identity determined from geocoding!";
              this.statusColor = "green";
            }
          } else {
            this.userIdentity = "Address not found"; // Fallback if no address found
            this.connectionStatus = "❌ Address not found";
            this.statusColor = "red";
          }
          this.isLoading = false; // Stop loading
        })
        .catch((error) => {
          console.error("Error fetching location:", error);
          this.connectionStatus = `❌ Error: ${error.message}`;
          this.statusColor = "red";
          this.isLoading = false; // Stop loading
        });
    },

    // Handle connection to the backend (Fabric network or other)
    async connectToFabric() {
      if (!this.userIdentity || this.userIdentity === "") {
        this.connectionStatus = "❌ User identity is required.";
        this.statusColor = "red";
        return;
      }

      try {
        this.connectionStatus = "Connecting...";
        this.statusColor = "black";

        const response = await axios.post("http://localhost:3000/connect", {
          userIdentity: this.userIdentity,
        }, { withCredentials: true });

        this.connectionStatus = `✅ ${response.data.message}`;
        this.statusColor = "green";

        // Redirect to the report page
        this.$router.push({ path: "/proto-reporting", query: { userIdentity: this.userIdentity } });
      } catch (error) {
        this.connectionStatus = `❌ Error: ${error.message}`;
        this.statusColor = "red";
      }
    },
  },
  mounted() {
    // Automatically fetch location when the component is mounted
    this.getCurrentLocation();
  },
};
</script>

<style scoped>
#user-identity {
  background-color: black;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative; /* Add this */
}

.logo{
  position: absolute;
  top: 50px;
  left: 100px;
  width: 100px;
  height: auto;
  z-index: 10;
}

.container {
  background-color: #ffffff; /* White background for the form */
  padding: 40px;
  border: 3px solid #00ff00;
  border-radius: 12px;
  width: 100%;
  max-width: 400px; /* Limit width of the form */
}

h1 {
  text-align: center;
  color: #2c3e50; /* Darker blue for the heading */
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-size: 16px;
  color: #34495e;
}

p {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: #34495e;
}

button {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-family: serif;
  background-color: #FAF7F3; /* Hyperledger Blue */
  color: black;
  border: 1px solid #ced4da;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background-color: #bbb;
}
</style>

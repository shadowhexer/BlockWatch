<template>
  <div class="overlay">
    <div class="user-guide">
      <div class="guide-text">
      <h2>Welcome to the BlockNomy-mity System</h2>
      <p>This video will help you understand how to use the system.</p>
      </div>
      <!-- Video element to show the guidelines -->
      <video controls muted class="guide-video" :src="videoSrc" type="video/mp4">
        Your browser does not support the video tag.
      </video>

      <button @click="closeGuide">Got It!</button>
    </div>
  </div>
</template>

<script>
import guideVideo from '@/assets/guideUse.mp4';

export default {
  name: 'UserGuide',
  data() {
    return {
      // The source of your guideline video (update this path to the actual video URL)
      videoSrc: guideVideo,
    };
  },
  methods: {
    closeGuide() {
      // Emit an event to close the guide when the button is clicked
      this.$emit('close-guide');
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed; /* Fixed positioning to overlay the entire screen */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
  display: flex;
  justify-content: center;
  align-items: center; /* Center the user guide vertically and horizontally */
  z-index: 1000; /* Ensure it's above other content */
}

.user-guide {
  background-color: transparent;
  font-size: larger;
  font-family: serif;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  text-align: center;
  border: 2px solid rgb(15, 254, 51);
}

.guide-text {
  border-radius: 20px;
  background-color: rgb(3, 3, 3);
  color: rgb(15, 254, 51);
  margin-bottom: 20px;
}

.guide-video {
  width: 100%;
  height: auto;
  margin-bottom: 20px;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>

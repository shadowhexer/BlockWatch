<template>
  <div class="register-container">
    <!-- Flex container to align the two sections side by side -->
    <div class="row">
      <!-- Left Column: Register New Tanod -->
      <div class="column left-column">
        <h2>👮 Register New Tanod</h2>
        <div class="form">
          <input v-model="username" placeholder="Username" />
          <input v-model="password" placeholder="Password" type="password" />
          <div class="buttons">
            <button @click="register">Register</button>
          </div>

          <!-- Display registration message -->
          <p class="message" v-if="message">{{ message }}</p>
        </div>
      </div>

      <!-- Right Column: List of Registered Tanods -->
      <div class="column right-column">
        <h2>List of Registered Tanods</h2>

        <!-- Table to display registered tanods -->
        <table>
          <thead>
            <tr>
              <th>Tanod ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loop through the tanods array and display each tanod -->
            <tr v-for="(tanod, index) in tanods" :key="index">
              <td>{{ tanod.id }}</td>
              <td>{{ tanod.username }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TanodRegister',
  data() {
    return {
      username: '',
      password: '',
      message: '',
      tanods: []  // Array to hold the fetched tanods
    };
  },
  methods: {
    // Method to register a new tanod
    async register() {
      if (!this.username || !this.password) {
        this.message = 'Both fields are required';
        return;
      }

      try {
        const res = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        });

        const data = await res.json();
        this.message = data.message || data.error;

        if (data.message) {
          this.username = '';
          this.password = '';
          this.fetchTanods();  // Refresh the tanods list after registration
        }
      } catch (err) {
        console.error(err);
        this.message = 'Server error';
      }
    },

    // Method to fetch and display tanods
    async fetchTanods() {
      try {
        const resTanods = await fetch('http://localhost:3000/tanods');
        this.tanods = await resTanods.json(); // Store the fetched tanods in the tanods array
      } catch (error) {
        console.error('Fetch tanods failed:', error);
      }
    }
  },

  // Fetch tanods when the component is mounted
  mounted() {
    this.fetchTanods();
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-family: 'Segoe UI', sans-serif;
  max-width: 100%;
}

.row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.column {
  flex: 1;
  padding: 20px;
}

.left-column {
  padding-right: 30px; /* Add space between columns */
}

h2 {
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

table th, table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #dee2e6;
}

input {
  width: 100%;
  padding: 8px;
  margin: 6px 0;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.buttons {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

button {
  padding: 8px 20px;
  background-color: #007bff;
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
}

.message {
  color: #d9534f;
  margin-top: 12px;
  min-height: 18px;
  text-align: center;
}
</style>

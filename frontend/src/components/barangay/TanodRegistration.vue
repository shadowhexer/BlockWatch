<template>
  <div class="container mt-5 bg-dark text-light p-4 rounded">
    <div class="row">
      <!-- Left Column: Register New Tanod -->
      <div class="col-md-6 mb-4">
        <div class="card bg-secondary text-light border-0 rounded-2 shadow-lg">
          <div class="card-header bg-dark">
            <h2>👮 Register New Tanod</h2>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label for="username" class="form-label">Username</label>
              <input
                v-model="username"
                id="username"
                type="text"
                class="form-control rounded-3"
                placeholder="Enter Username"
              />
            </div>

            <div class="form-group mt-3">
              <label for="password" class="form-label">Password</label>
              <input
                v-model="password"
                id="password"
                type="password"
                class="form-control rounded-3"
                placeholder="Enter Password"
              />
            </div>

            <div class="mt-3">
              <button @click="register" class="btn btn-primary w-100 rounded-3">
                Register
              </button>
            </div>

            <!-- Display registration message -->
            <p class="mt-3 text-center text-success" v-if="message">{{ message }}</p>
          </div>
        </div>
      </div>

      <!-- Right Column: List of Registered Tanods -->
      <div class="col-md-6">
        <div class="card bg-secondary text-light border-0 rounded-1 shadow-lg">
          <div class="card-header bg-dark">
            <h2>List of Registered Tanods</h2>
          </div>
          <div class="card-body">
            <!-- Table to display registered tanods -->
            <table class="table table-bordered table-striped text-light">
              <thead class="bg-dark">
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
